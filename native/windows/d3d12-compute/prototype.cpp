// LeeWay-managed D3D12 compute probe. Uses existing physical adapters; this is not a new OS GPU.
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <d3d12.h>
#include <dxgi1_6.h>
#include <d3dcompiler.h>
#include <wrl/client.h>
#include <cerrno>
#include <climits>
#include <cstdint>
#include <cstdlib>
#include <cstdio>
#include <cstring>
#include <exception>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

#pragma comment(lib, "d3d12.lib")
#pragma comment(lib, "dxgi.lib")
#pragma comment(lib, "d3dcompiler.lib")

using Microsoft::WRL::ComPtr;

namespace {
constexpr UINT kDefaultElementCount = 262144;
constexpr UINT kMaxElementCount = 1048576;
constexpr UINT kDefaultSeed = 1013904223u;
constexpr UINT kThreadWidth = 64;
constexpr UINT64 kWaitMilliseconds = 10000;

struct Workload {
    UINT elementCount = kDefaultElementCount;
    UINT seed = kDefaultSeed;
};

UINT parseUint32(const char* value, const char* name) {
    if (!value || !*value) throw std::runtime_error(std::string("D3D12_WORKLOAD_INVALID: missing ") + name);
    errno = 0;
    char* end = nullptr;
    const unsigned long parsed = std::strtoul(value, &end, 10);
    if (errno == ERANGE || end == value || *end != '\0' || parsed > UINT_MAX) {
        throw std::runtime_error(std::string("D3D12_WORKLOAD_INVALID: invalid ") + name);
    }
    return static_cast<UINT>(parsed);
}

Workload parseWorkload(int argc, char** argv) {
    Workload workload;
    for (int i = 1; i < argc; ++i) {
        const std::string option = argv[i];
        if (option == "--elements" && i + 1 < argc) {
            workload.elementCount = parseUint32(argv[++i], "elements");
        } else if (option == "--seed" && i + 1 < argc) {
            workload.seed = parseUint32(argv[++i], "seed");
        } else {
            throw std::runtime_error("D3D12_WORKLOAD_INVALID: expected --elements <1..1048576> and --seed <uint32>");
        }
    }
    if (workload.elementCount == 0 || workload.elementCount > kMaxElementCount) {
        throw std::runtime_error("D3D12_WORKLOAD_INVALID: elements outside 1..1048576");
    }
    return workload;
}

void check(HRESULT hr, const char* operation) {
    if (FAILED(hr)) {
        std::ostringstream message;
        message << operation << " failed (HRESULT 0x" << std::hex << std::uppercase
                << static_cast<unsigned long>(hr) << ")";
        throw std::runtime_error(message.str());
    }
}

std::string jsonEscape(const wchar_t* input) {
    std::string output;
    for (const wchar_t* p = input; *p; ++p) {
        const wchar_t ch = *p;
        if (ch == L'\\' || ch == L'"') {
            output.push_back('\\');
            output.push_back(static_cast<char>(ch));
        } else if (ch >= 0x20 && ch <= 0x7e) {
            output.push_back(static_cast<char>(ch));
        } else {
            output.push_back('?');
        }
    }
    return output;
}

UINT expectedValue(UINT index, UINT seed) {
    return index * 1664525u + seed;
}

D3D12_RESOURCE_DESC bufferDescription(UINT64 bytes, D3D12_RESOURCE_FLAGS flags) {
    D3D12_RESOURCE_DESC desc{};
    desc.Dimension = D3D12_RESOURCE_DIMENSION_BUFFER;
    desc.Alignment = 0;
    desc.Width = bytes;
    desc.Height = 1;
    desc.DepthOrArraySize = 1;
    desc.MipLevels = 1;
    desc.Format = DXGI_FORMAT_UNKNOWN;
    desc.SampleDesc.Count = 1;
    desc.SampleDesc.Quality = 0;
    desc.Layout = D3D12_TEXTURE_LAYOUT_ROW_MAJOR;
    desc.Flags = flags;
    return desc;
}

D3D12_HEAP_PROPERTIES heapProperties(D3D12_HEAP_TYPE type) {
    D3D12_HEAP_PROPERTIES properties{};
    properties.Type = type;
    properties.CPUPageProperty = D3D12_CPU_PAGE_PROPERTY_UNKNOWN;
    properties.MemoryPoolPreference = D3D12_MEMORY_POOL_UNKNOWN;
    properties.CreationNodeMask = 1;
    properties.VisibleNodeMask = 1;
    return properties;
}

std::string dispatchOnAdapter(IDXGIAdapter1* adapter, const DXGI_ADAPTER_DESC1& desc,
                              const Workload& workload) {
    try {
        ComPtr<ID3D12Device> device;
        check(D3D12CreateDevice(adapter, D3D_FEATURE_LEVEL_11_0,
                                IID_PPV_ARGS(device.GetAddressOf())), "D3D12CreateDevice");

        const char* shaderSource = R"(
RWStructuredBuffer<uint> Output : register(u0);
        cbuffer Parameters : register(b0) { uint ElementCount; uint Seed; }
[numthreads(64, 1, 1)]
void main(uint3 dispatchId : SV_DispatchThreadID) {
    if (dispatchId.x < ElementCount)
                Output[dispatchId.x] = dispatchId.x * 1664525u + Seed;
}
)";
        ComPtr<ID3DBlob> shader;
        ComPtr<ID3DBlob> compilerErrors;
        HRESULT compileResult = D3DCompile(shaderSource, std::strlen(shaderSource),
            "leeway-d3d12-compute-probe", nullptr, nullptr, "main", "cs_5_1",
            D3DCOMPILE_ENABLE_STRICTNESS, 0, shader.GetAddressOf(), compilerErrors.GetAddressOf());
        if (FAILED(compileResult)) {
            const char* detail = compilerErrors ? static_cast<const char*>(compilerErrors->GetBufferPointer()) : "";
            throw std::runtime_error(std::string("D3DCompile failed: ") + detail);
        }

        D3D12_DESCRIPTOR_RANGE range{};
        range.RangeType = D3D12_DESCRIPTOR_RANGE_TYPE_UAV;
        range.NumDescriptors = 1;
        range.BaseShaderRegister = 0;
        range.RegisterSpace = 0;
        range.OffsetInDescriptorsFromTableStart = D3D12_DESCRIPTOR_RANGE_OFFSET_APPEND;

        D3D12_ROOT_PARAMETER parameters[2]{};
        parameters[0].ParameterType = D3D12_ROOT_PARAMETER_TYPE_32BIT_CONSTANTS;
        parameters[0].Constants.ShaderRegister = 0;
        parameters[0].Constants.RegisterSpace = 0;
        parameters[0].Constants.Num32BitValues = 2;
        parameters[0].ShaderVisibility = D3D12_SHADER_VISIBILITY_ALL;
        parameters[1].ParameterType = D3D12_ROOT_PARAMETER_TYPE_DESCRIPTOR_TABLE;
        parameters[1].DescriptorTable.NumDescriptorRanges = 1;
        parameters[1].DescriptorTable.pDescriptorRanges = &range;
        parameters[1].ShaderVisibility = D3D12_SHADER_VISIBILITY_ALL;

        D3D12_ROOT_SIGNATURE_DESC rootDesc{};
        rootDesc.NumParameters = 2;
        rootDesc.pParameters = parameters;
        rootDesc.Flags = D3D12_ROOT_SIGNATURE_FLAG_NONE;
        ComPtr<ID3DBlob> rootBlob;
        ComPtr<ID3DBlob> rootErrors;
        check(D3D12SerializeRootSignature(&rootDesc, D3D_ROOT_SIGNATURE_VERSION_1,
            rootBlob.GetAddressOf(), rootErrors.GetAddressOf()), "D3D12SerializeRootSignature");

        ComPtr<ID3D12RootSignature> rootSignature;
        check(device->CreateRootSignature(0, rootBlob->GetBufferPointer(), rootBlob->GetBufferSize(),
            IID_PPV_ARGS(rootSignature.GetAddressOf())), "CreateRootSignature");

        D3D12_COMPUTE_PIPELINE_STATE_DESC pipelineDesc{};
        pipelineDesc.pRootSignature = rootSignature.Get();
        pipelineDesc.CS = {shader->GetBufferPointer(), shader->GetBufferSize()};
        ComPtr<ID3D12PipelineState> pipeline;
        check(device->CreateComputePipelineState(&pipelineDesc,
            IID_PPV_ARGS(pipeline.GetAddressOf())), "CreateComputePipelineState");

        D3D12_DESCRIPTOR_HEAP_DESC descriptorDesc{};
        descriptorDesc.Type = D3D12_DESCRIPTOR_HEAP_TYPE_CBV_SRV_UAV;
        descriptorDesc.NumDescriptors = 1;
        descriptorDesc.Flags = D3D12_DESCRIPTOR_HEAP_FLAG_SHADER_VISIBLE;
        ComPtr<ID3D12DescriptorHeap> descriptorHeap;
        check(device->CreateDescriptorHeap(&descriptorDesc,
            IID_PPV_ARGS(descriptorHeap.GetAddressOf())), "CreateDescriptorHeap");

        const UINT64 byteCount = static_cast<UINT64>(workload.elementCount) * sizeof(UINT);
        const auto defaultHeap = heapProperties(D3D12_HEAP_TYPE_DEFAULT);
        const auto outputDesc = bufferDescription(byteCount, D3D12_RESOURCE_FLAG_ALLOW_UNORDERED_ACCESS);
        ComPtr<ID3D12Resource> output;
        check(device->CreateCommittedResource(&defaultHeap, D3D12_HEAP_FLAG_NONE, &outputDesc,
            D3D12_RESOURCE_STATE_UNORDERED_ACCESS, nullptr,
            IID_PPV_ARGS(output.GetAddressOf())), "Create GPU output buffer");

        D3D12_UNORDERED_ACCESS_VIEW_DESC uav{};
        uav.ViewDimension = D3D12_UAV_DIMENSION_BUFFER;
        uav.Format = DXGI_FORMAT_UNKNOWN;
        uav.Buffer.NumElements = workload.elementCount;
        uav.Buffer.StructureByteStride = sizeof(UINT);
        device->CreateUnorderedAccessView(output.Get(), nullptr, &uav,
            descriptorHeap->GetCPUDescriptorHandleForHeapStart());

        const auto readbackHeap = heapProperties(D3D12_HEAP_TYPE_READBACK);
        const auto readbackDesc = bufferDescription(byteCount, D3D12_RESOURCE_FLAG_NONE);
        ComPtr<ID3D12Resource> readback;
        check(device->CreateCommittedResource(&readbackHeap, D3D12_HEAP_FLAG_NONE, &readbackDesc,
            D3D12_RESOURCE_STATE_COPY_DEST, nullptr,
            IID_PPV_ARGS(readback.GetAddressOf())), "Create readback buffer");

        D3D12_COMMAND_QUEUE_DESC queueDesc{};
        queueDesc.Type = D3D12_COMMAND_LIST_TYPE_COMPUTE;
        ComPtr<ID3D12CommandQueue> queue;
        check(device->CreateCommandQueue(&queueDesc,
            IID_PPV_ARGS(queue.GetAddressOf())), "CreateCommandQueue");

        ComPtr<ID3D12CommandAllocator> allocator;
        check(device->CreateCommandAllocator(D3D12_COMMAND_LIST_TYPE_COMPUTE,
            IID_PPV_ARGS(allocator.GetAddressOf())), "CreateCommandAllocator");
        ComPtr<ID3D12GraphicsCommandList> commandList;
        check(device->CreateCommandList(0, D3D12_COMMAND_LIST_TYPE_COMPUTE,
            allocator.Get(), nullptr, IID_PPV_ARGS(commandList.GetAddressOf())), "CreateCommandList");

        commandList->SetPipelineState(pipeline.Get());
        commandList->SetComputeRootSignature(rootSignature.Get());
        ID3D12DescriptorHeap* heaps[] = {descriptorHeap.Get()};
        commandList->SetDescriptorHeaps(1, heaps);
        commandList->SetComputeRoot32BitConstant(0, workload.elementCount, 0);
        commandList->SetComputeRoot32BitConstant(0, workload.seed, 1);
        commandList->SetComputeRootDescriptorTable(1, descriptorHeap->GetGPUDescriptorHandleForHeapStart());
        const UINT groups = (workload.elementCount + kThreadWidth - 1) / kThreadWidth;
        commandList->Dispatch(groups, 1, 1);

        D3D12_RESOURCE_BARRIER barrier{};
        barrier.Type = D3D12_RESOURCE_BARRIER_TYPE_TRANSITION;
        barrier.Transition.pResource = output.Get();
        barrier.Transition.Subresource = D3D12_RESOURCE_BARRIER_ALL_SUBRESOURCES;
        barrier.Transition.StateBefore = D3D12_RESOURCE_STATE_UNORDERED_ACCESS;
        barrier.Transition.StateAfter = D3D12_RESOURCE_STATE_COPY_SOURCE;
        commandList->ResourceBarrier(1, &barrier);
        commandList->CopyResource(readback.Get(), output.Get());
        check(commandList->Close(), "CloseCommandList");

        ComPtr<ID3D12Fence> fence;
        check(device->CreateFence(0, D3D12_FENCE_FLAG_NONE,
            IID_PPV_ARGS(fence.GetAddressOf())), "CreateFence");
        HANDLE fenceEvent = CreateEventW(nullptr, FALSE, FALSE, nullptr);
        if (!fenceEvent) throw std::runtime_error("CreateEventW failed");
        const UINT64 fenceValue = 1;
        const ULONGLONG started = GetTickCount64();
        ID3D12CommandList* lists[] = {commandList.Get()};
        queue->ExecuteCommandLists(1, lists);
        HRESULT signalResult = queue->Signal(fence.Get(), fenceValue);
        if (FAILED(signalResult)) {
            CloseHandle(fenceEvent);
            check(signalResult, "Queue::Signal");
        }
        check(fence->SetEventOnCompletion(fenceValue, fenceEvent), "SetEventOnCompletion");
        const DWORD waitResult = WaitForSingleObject(fenceEvent, static_cast<DWORD>(kWaitMilliseconds));
        CloseHandle(fenceEvent);
        if (waitResult != WAIT_OBJECT_0) throw std::runtime_error("GPU fence wait timed out or failed");
        const ULONGLONG elapsedMs = GetTickCount64() - started;

        D3D12_RANGE readRange{0, static_cast<SIZE_T>(byteCount)};
        void* mapped = nullptr;
        check(readback->Map(0, &readRange, &mapped), "Map readback");
        const auto* values = static_cast<const UINT*>(mapped);
        UINT mismatchCount = 0;
        UINT firstMismatch = UINT_MAX;
        for (UINT i = 0; i < workload.elementCount; ++i) {
            if (values[i] != expectedValue(i, workload.seed)) {
                if (mismatchCount == 0) firstMismatch = i;
                ++mismatchCount;
            }
        }
        D3D12_RANGE writtenRange{0, 0};
        readback->Unmap(0, &writtenRange);

        std::ostringstream json;
        json << "{\"workload\":{\"operation\":\"AFFINE_U32_V1\",\"elements\":"
             << workload.elementCount << ",\"seed\":" << workload.seed << "}"
             << ",\"adapterName\":\"" << jsonEscape(desc.Description)
             << "\",\"adapterClass\":\"PHYSICAL_HARDWARE_ADAPTER\""
             << ",\"vendorId\":" << desc.VendorId
             << ",\"deviceId\":" << desc.DeviceId
             << ",\"luid\":\"" << std::hex << std::uppercase << desc.AdapterLuid.HighPart
             << "-" << desc.AdapterLuid.LowPart << std::dec << "\""
             << ",\"api\":\"D3D12\",\"dispatchGroups\":" << groups
             << ",\"elementsWritten\":" << workload.elementCount
             << ",\"readbackMatchesReference\":" << (mismatchCount == 0 ? "true" : "false")
             << ",\"mismatchCount\":" << mismatchCount
             << ",\"firstMismatchIndex\":";
        if (mismatchCount == 0) json << "null"; else json << firstMismatch;
        json << ",\"dispatchAndFenceMilliseconds\":" << elapsedMs
             << ",\"softwareAdapter\":false,\"leeWayMode\":\"UNQUALIFIED_PROVIDER_PROTOTYPE\""
             << ",\"runtimeFabricAuthorized\":false,\"leeWayOsNativeGpu\":false,\"status\":\""
             << (mismatchCount == 0 ? "PASS" : "FAIL") << "\"}";
        return json.str();
    } catch (const std::exception& error) {
        std::ostringstream json;
        json << "{\"workload\":{\"operation\":\"AFFINE_U32_V1\",\"elements\":"
             << workload.elementCount << ",\"seed\":" << workload.seed << "}"
             << ",\"adapterName\":\"" << jsonEscape(desc.Description)
             << "\",\"adapterClass\":\"PHYSICAL_HARDWARE_ADAPTER\""
             << ",\"vendorId\":" << desc.VendorId << ",\"deviceId\":" << desc.DeviceId
             << ",\"api\":\"D3D12\",\"softwareAdapter\":false"
             << ",\"leeWayMode\":\"UNQUALIFIED_PROVIDER_PROTOTYPE\",\"runtimeFabricAuthorized\":false,\"leeWayOsNativeGpu\":false"
             << ",\"status\":\"FAIL\",\"error\":\"";
        for (char ch : std::string(error.what())) {
            if (ch == '"' || ch == '\\') json << '\\';
            if (ch >= 0x20) json << ch;
        }
        json << "\"}";
        return json.str();
    }
}
} // namespace

int main(int argc, char** argv) {
    Workload workload;
    try {
        workload = parseWorkload(argc, argv);
    } catch (const std::exception& error) {
        std::cerr << error.what() << "\n";
        return 2;
    }
    ComPtr<IDXGIFactory6> factory;
    HRESULT hr = CreateDXGIFactory2(0, IID_PPV_ARGS(factory.GetAddressOf()));
    if (FAILED(hr)) {
        std::cerr << "CreateDXGIFactory2 failed (HRESULT 0x" << std::hex << hr << ")\n";
        return 2;
    }

    UINT seenHardware = 0;
    UINT passed = 0;
    for (UINT index = 0;; ++index) {
        ComPtr<IDXGIAdapter1> adapter;
        hr = factory->EnumAdapterByGpuPreference(index, DXGI_GPU_PREFERENCE_HIGH_PERFORMANCE,
            IID_PPV_ARGS(adapter.GetAddressOf()));
        if (hr == DXGI_ERROR_NOT_FOUND) break;
        if (FAILED(hr)) {
            std::cerr << "EnumAdapterByGpuPreference failed (HRESULT 0x" << std::hex << hr << ")\n";
            return 2;
        }
        DXGI_ADAPTER_DESC1 desc{};
        check(adapter->GetDesc1(&desc), "IDXGIAdapter1::GetDesc1");
        if ((desc.Flags & DXGI_ADAPTER_FLAG_SOFTWARE) != 0) continue;

        ComPtr<ID3D12Device> probeDevice;
        if (FAILED(D3D12CreateDevice(adapter.Get(), D3D_FEATURE_LEVEL_11_0,
                                    IID_PPV_ARGS(probeDevice.GetAddressOf())))) continue;
        probeDevice.Reset();
        ++seenHardware;
        const std::string result = dispatchOnAdapter(adapter.Get(), desc, workload);
        std::cout << result << "\n";
        if (result.find("\"status\":\"PASS\"") != std::string::npos) ++passed;
    }

    std::cout << "{\"summary\":true,\"workload\":{\"operation\":\"AFFINE_U32_V1\",\"elements\":"
              << workload.elementCount << ",\"seed\":" << workload.seed << "},\"hardwareAdapters\":" << seenHardware
              << ",\"passed\":" << passed << ",\"failed\":" << (seenHardware - passed)
              << ",\"requirePhysicalAdapter\":true,\"leeWayOsNativeGpu\":false}\n";
    return seenHardware > 0 && passed == seenHardware ? 0 : 3;
}
