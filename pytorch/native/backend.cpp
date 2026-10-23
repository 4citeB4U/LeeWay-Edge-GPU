// Leeway Edge GPU experimental PyTorch adapter. Physical D3D12 compute only.
// GPU resources own tensor storage; host buffers are used solely for transfers.
#include <ATen/ATen.h>
#include <ATen/EmptyTensor.h>
#include <ATen/detail/PrivateUse1HooksInterface.h>
#include <c10/core/impl/DeviceGuardImplInterface.h>
#include <torch/library.h>
#include <pybind11/pybind11.h>
#include <windows.h>
#include <d3d12.h>
#include <dxgi1_6.h>
#include <d3dcompiler.h>
#include <wrl/client.h>
#include <atomic>
#include <array>
#include <cstring>
#include <mutex>
#include <string>

namespace leeway {
using Microsoft::WRL::ComPtr;
constexpr auto DEVICE = c10::DeviceType::PrivateUse1;
constexpr uint64_t MAX_ELEMENTS = 4 * 1024 * 1024;
constexpr uint64_t MAX_MULTIPLIES = 64 * 1024 * 1024;
std::atomic<uint64_t> allocated{0}, dispatches{0}, uploads{0}, downloads{0};
std::atomic<bool> initialized{false};
std::atomic<bool> shutdown_requested{false};

void check(HRESULT result, const char* operation) {
  TORCH_CHECK(SUCCEEDED(result), "Leeway Edge GPU: ", operation,
              " failed (HRESULT ", static_cast<int64_t>(result), ")");
}
void index(c10::DeviceIndex i) {
  TORCH_CHECK(i == -1 || i == 0, "Leeway Edge GPU: only leeway:0 is implemented");
}
bool software_adapter(const DXGI_ADAPTER_DESC1& description) {
  // Observed on windows-2022 CI: Basic Render Driver 1414:008c can have
  // Flags==0. Flags alone therefore cannot enforce the no-CPU-fallback rule.
  std::wstring name(description.Description);
  return (description.Flags & DXGI_ADAPTER_FLAG_SOFTWARE) ||
         (description.VendorId == 0x1414 && description.DeviceId == 0x008c) ||
         name.find(L"Basic Render Driver") != std::wstring::npos ||
         name.find(L"WARP") != std::wstring::npos;
}
bool eligible(const DXGI_ADAPTER_DESC1& description) {
  return !software_adapter(description) && !(description.Flags & DXGI_ADAPTER_FLAG_REMOTE);
}
ComPtr<IDXGIAdapter1> hardware_adapter() {
  ComPtr<IDXGIFactory6> factory;
  check(CreateDXGIFactory1(IID_PPV_ARGS(&factory)), "DXGI discovery");
  for (UINT i = 0;; ++i) {
    ComPtr<IDXGIAdapter1> adapter;
    HRESULT result = factory->EnumAdapterByGpuPreference(
        i, DXGI_GPU_PREFERENCE_HIGH_PERFORMANCE, IID_PPV_ARGS(&adapter));
    if (result == DXGI_ERROR_NOT_FOUND) break;
    check(result, "adapter enumeration");
    DXGI_ADAPTER_DESC1 description{};
    check(adapter->GetDesc1(&description), "adapter description");
    if (!eligible(description)) continue;
    if (SUCCEEDED(D3D12CreateDevice(adapter.Get(), D3D_FEATURE_LEVEL_11_0,
                                    __uuidof(ID3D12Device), nullptr))) return adapter;
  }
  TORCH_CHECK(false, "Leeway Edge GPU: no physical D3D12 GPU is available; CPU/WARP fallback is disabled");
}
bool available() noexcept {
  if (shutdown_requested.load()) return false;
  try { hardware_adapter(); return true; } catch (...) { return false; }
}

// Rectangular adaptation of the repository's 8x8 tiled WGSL matmul.
// All threads participate in barriers, including partial edge tiles.
const char* SHADER = R"hlsl(
StructuredBuffer<float> A : register(t0);
StructuredBuffer<float> B : register(t1);
RWStructuredBuffer<float> C : register(u0);
cbuffer Params : register(b0) {
  uint M; uint N; uint K; uint Count;
  uint Op; float Value; float Alpha; uint Reserved;
};
groupshared float tileA[64];
groupshared float tileB[64];
[numthreads(8,8,1)]
void matmul(uint3 gid:SV_DispatchThreadID, uint3 lid:SV_GroupThreadID) {
  float result = 0;
  for (uint t=0; t<K; t+=8) {
    tileA[lid.y*8+lid.x] = (gid.y<M && t+lid.x<K) ? A[gid.y*K+t+lid.x] : 0;
    tileB[lid.y*8+lid.x] = (gid.x<N && t+lid.y<K) ? B[(t+lid.y)*N+gid.x] : 0;
    GroupMemoryBarrierWithGroupSync();
    for(uint k=0;k<8;++k) result += tileA[lid.y*8+k]*tileB[k*8+lid.x];
    GroupMemoryBarrierWithGroupSync();
  }
  if(gid.y<M && gid.x<N) C[gid.y*N+gid.x] = result;
}
[numthreads(256,1,1)]
void elementwise(uint3 gid:SV_DispatchThreadID) {
  uint i=gid.x;
  if(i>=Count) return;
  if(Op==0) C[i]=Value;
  else if(Op==1) C[i]=A[i]+Alpha*B[i];
  else if(Op==2) C[i]=A[i]*B[i];
  else if(Op==3) { float value=A[i]; C[i]=isnan(value) ? value : max(value,0); }
}
)hlsl";

ComPtr<ID3DBlob> compile_shader(const char* entry) {
  ComPtr<ID3DBlob> shader, errors;
  HRESULT hr = D3DCompile(SHADER, std::strlen(SHADER), "Leeway Edge GPU", nullptr,
                          nullptr, entry, "cs_5_0", D3DCOMPILE_OPTIMIZATION_LEVEL3,
                          0, &shader, &errors);
  TORCH_CHECK(SUCCEEDED(hr), "Leeway Edge GPU: shader compilation failed: ",
              errors ? static_cast<const char*>(errors->GetBufferPointer()) : entry);
  return shader;
}

struct Buffer {
  ComPtr<ID3D12Resource> resource;
  D3D12_RESOURCE_STATES state = D3D12_RESOURCE_STATE_COMMON;
  size_t bytes = 0;
  ~Buffer() { allocated -= bytes; }
};
struct Runtime {
  ComPtr<ID3D12Device> device;
  ComPtr<ID3D12CommandQueue> queue;
  ComPtr<ID3D12CommandAllocator> allocator;
  ComPtr<ID3D12GraphicsCommandList> commands;
  ComPtr<ID3D12Fence> fence;
  ComPtr<ID3D12RootSignature> root;
  ComPtr<ID3D12PipelineState> mm_pipeline, element_pipeline;
  ComPtr<IDXGIAdapter1> adapter;
  std::mutex mutex;
  uint64_t fence_value = 0;
  bool closed = false;
  Runtime() {
    adapter = hardware_adapter();
    check(D3D12CreateDevice(adapter.Get(), D3D_FEATURE_LEVEL_11_0,
                           IID_PPV_ARGS(&device)), "device creation");
    D3D12_COMMAND_QUEUE_DESC q{};
    check(device->CreateCommandQueue(&q, IID_PPV_ARGS(&queue)), "command queue");
    check(device->CreateCommandAllocator(D3D12_COMMAND_LIST_TYPE_DIRECT,
                                        IID_PPV_ARGS(&allocator)), "command allocator");
    check(device->CreateCommandList(0, D3D12_COMMAND_LIST_TYPE_DIRECT, allocator.Get(),
                                    nullptr, IID_PPV_ARGS(&commands)), "command list");
    check(commands->Close(), "initial command close");
    check(device->CreateFence(0, D3D12_FENCE_FLAG_NONE, IID_PPV_ARGS(&fence)), "fence");
    std::array<D3D12_ROOT_PARAMETER, 4> params{};
    params[0].ParameterType = D3D12_ROOT_PARAMETER_TYPE_SRV;
    params[1].ParameterType = D3D12_ROOT_PARAMETER_TYPE_SRV;
    params[1].Descriptor.ShaderRegister = 1;
    params[2].ParameterType = D3D12_ROOT_PARAMETER_TYPE_UAV;
    params[3].ParameterType = D3D12_ROOT_PARAMETER_TYPE_32BIT_CONSTANTS;
    params[3].Constants.Num32BitValues = 8;
    D3D12_ROOT_SIGNATURE_DESC desc{};
    desc.NumParameters = static_cast<UINT>(params.size());
    desc.pParameters = params.data();
    ComPtr<ID3DBlob> blob, errors;
    check(D3D12SerializeRootSignature(&desc, D3D_ROOT_SIGNATURE_VERSION_1,
                                      &blob, &errors), "root signature serialization");
    check(device->CreateRootSignature(0, blob->GetBufferPointer(), blob->GetBufferSize(),
                                      IID_PPV_ARGS(&root)), "root signature");
    mm_pipeline = pipeline("matmul");
    element_pipeline = pipeline("elementwise");
    initialized = true;
  }
  ComPtr<ID3D12PipelineState> pipeline(const char* entry) {
    auto shader = compile_shader(entry);
    D3D12_COMPUTE_PIPELINE_STATE_DESC desc{};
    desc.pRootSignature = root.Get();
    desc.CS = {shader->GetBufferPointer(), shader->GetBufferSize()};
    ComPtr<ID3D12PipelineState> result;
    check(device->CreateComputePipelineState(&desc, IID_PPV_ARGS(&result)), "compute pipeline");
    return result;
  }
  ComPtr<ID3D12Resource> resource(size_t bytes, D3D12_HEAP_TYPE heap,
                                  D3D12_RESOURCE_STATES state) {
    D3D12_HEAP_PROPERTIES properties{};
    properties.Type = heap;
    D3D12_RESOURCE_DESC desc{};
    desc.Dimension = D3D12_RESOURCE_DIMENSION_BUFFER;
    desc.Width = (std::max)(size_t(4), bytes);
    desc.Height = desc.DepthOrArraySize = desc.MipLevels = 1;
    desc.SampleDesc.Count = 1;
    desc.Layout = D3D12_TEXTURE_LAYOUT_ROW_MAJOR;
    if (heap == D3D12_HEAP_TYPE_DEFAULT) desc.Flags = D3D12_RESOURCE_FLAG_ALLOW_UNORDERED_ACCESS;
    ComPtr<ID3D12Resource> result;
    check(device->CreateCommittedResource(&properties, D3D12_HEAP_FLAG_NONE, &desc,
                                           state, nullptr, IID_PPV_ARGS(&result)), "buffer allocation");
    return result;
  }
  void begin() {
    TORCH_CHECK(!closed, "Leeway Edge GPU: runtime has shut down");
    check(allocator->Reset(), "allocator reset");
    check(commands->Reset(allocator.Get(), nullptr), "command reset");
  }
  void transition(Buffer& buffer, D3D12_RESOURCE_STATES state) {
    if (buffer.state == state) return;
    D3D12_RESOURCE_BARRIER barrier{};
    barrier.Type = D3D12_RESOURCE_BARRIER_TYPE_TRANSITION;
    barrier.Transition = {buffer.resource.Get(), D3D12_RESOURCE_BARRIER_ALL_SUBRESOURCES,
                           buffer.state, state};
    commands->ResourceBarrier(1, &barrier);
    buffer.state = state;
  }
  void finish() {
    check(commands->Close(), "command close");
    ID3D12CommandList* lists[] = {commands.Get()};
    queue->ExecuteCommandLists(1, lists);
    check(queue->Signal(fence.Get(), ++fence_value), "fence signal");
    // Null-event waiting is synchronous and has no host event handle to leak.
    check(fence->SetEventOnCompletion(fence_value, nullptr), "GPU completion wait");
    check(device->GetDeviceRemovedReason(), "GPU execution");
  }
  void shutdown() {
    std::lock_guard<std::mutex> lock(mutex);
    if (closed) return;
    // Release COM runtime objects before Windows DLL process-detach. Submissions
    // are synchronous. Outstanding tensors retain their own resource references
    // until Python releases them; no new dispatch is allowed after this point.
    commands.Reset(); allocator.Reset(); fence.Reset();
    mm_pipeline.Reset(); element_pipeline.Reset(); root.Reset();
    queue.Reset(); device.Reset(); adapter.Reset();
    closed = true;
    initialized = false;
    shutdown_requested = true;
  }
};
Runtime& runtime() {
  TORCH_CHECK(!shutdown_requested.load(), "Leeway Edge GPU: runtime has shut down");
  static Runtime instance; return instance;
}

struct GPUAllocator final : c10::Allocator {
  c10::DataPtr allocate(size_t bytes) override {
    TORCH_CHECK(bytes <= MAX_ELEMENTS * 4, "Leeway Edge GPU: tensor budget exceeded");
    auto& rt = runtime();
    std::lock_guard<std::mutex> lock(rt.mutex);
    TORCH_CHECK(!rt.closed, "Leeway Edge GPU: runtime has shut down");
    auto value = std::make_unique<Buffer>();
    value->resource = rt.resource(bytes, D3D12_HEAP_TYPE_DEFAULT, D3D12_RESOURCE_STATE_COMMON);
    value->bytes = bytes;
    allocated += bytes;
    auto* pointer = value.release();
    return {reinterpret_cast<void*>(pointer->resource->GetGPUVirtualAddress()), pointer,
              [](void* p) { delete static_cast<Buffer*>(p); }, c10::Device(DEVICE, 0)};
  }
  void copy_data(void*, const void*, size_t) const override {
    TORCH_CHECK(false, "Leeway Edge GPU: raw host-pointer copying is unsupported; use Tensor.to()");
  }
} gpu_allocator;

at::Tensor empty(at::IntArrayRef size, std::optional<at::ScalarType> dtype,
                 std::optional<at::Layout> layout, std::optional<at::Device> device,
                 std::optional<bool> pin, std::optional<at::MemoryFormat> format) {
  if (device) { TORCH_CHECK(device->type() == DEVICE, "Leeway Edge GPU: wrong device"); index(device->index()); }
  TORCH_CHECK(!dtype || *dtype == at::kFloat, "Leeway Edge GPU: only float32 is implemented");
  TORCH_CHECK(!layout || *layout == at::kStrided, "Leeway Edge GPU: only strided layout is implemented");
  TORCH_CHECK(!pin.value_or(false), "Leeway Edge GPU: pinned allocation is not implemented");
  TORCH_CHECK(!format || *format == at::MemoryFormat::Contiguous,
               "Leeway Edge GPU: only contiguous memory format is implemented");
  uint64_t elements = 1;
  for (auto dim : size) {
    TORCH_CHECK(dim >= 0 && dim <= 4096, "Leeway Edge GPU: dimensions must be between 0 and 4096");
    elements *= static_cast<uint64_t>(dim);
    TORCH_CHECK(elements <= MAX_ELEMENTS, "Leeway Edge GPU: tensor budget exceeded");
  }
  return at::Tensor(at::detail::empty_generic(size, &gpu_allocator,
                    c10::DispatchKeySet(c10::DispatchKey::PrivateUse1), at::kFloat, format));
}
at::Tensor empty_strided(at::IntArrayRef size, at::IntArrayRef stride,
                         std::optional<at::ScalarType> dtype, std::optional<at::Layout> layout,
                         std::optional<at::Device> device, std::optional<bool> pin) {
  TORCH_CHECK(size.size() == stride.size(), "Leeway Edge GPU: invalid strides");
  int64_t expected = 1;
  for (int64_t d = static_cast<int64_t>(size.size()) - 1; d >= 0; --d) {
    TORCH_CHECK(stride[d] == expected, "Leeway Edge GPU: noncontiguous strides are not implemented");
    TORCH_CHECK(size[d] >= 0 && size[d] <= 4096, "Leeway Edge GPU: invalid dimension");
    TORCH_CHECK(expected <= static_cast<int64_t>(MAX_ELEMENTS), "Leeway Edge GPU: tensor budget exceeded");
    expected *= (std::max)(int64_t(1), size[d]);
  }
  return empty(size, dtype, layout, device, pin, at::MemoryFormat::Contiguous);
}
void tensor(const at::Tensor& t) {
  TORCH_CHECK(t.scalar_type() == at::kFloat && t.is_contiguous() && t.storage_offset() == 0,
               "Leeway Edge GPU: only contiguous float32 tensors at offset zero are implemented");
  TORCH_CHECK(!t.requires_grad(), "Leeway Edge GPU: autograd is not implemented; use inference_mode()");
}
Buffer& buffer(const at::Tensor& t) {
  tensor(t);
  TORCH_CHECK(t.device().type() == DEVICE, "Leeway Edge GPU: expected a leeway tensor");
  return *static_cast<Buffer*>(t.storage().data_ptr().get_context());
}
at::Tensor& copy(at::Tensor& to, const at::Tensor& from, bool nonblocking) {
  tensor(to); tensor(from);
  TORCH_CHECK(!nonblocking, "Leeway Edge GPU: asynchronous transfers are not implemented");
  TORCH_CHECK(to.sizes() == from.sizes(), "Leeway Edge GPU: broadcast copies are not implemented");
  bool source_gpu = from.device().type() == DEVICE, target_gpu = to.device().type() == DEVICE;
  TORCH_CHECK(source_gpu || target_gpu, "Leeway Edge GPU: copy requires a leeway endpoint");
  TORCH_CHECK(source_gpu || from.device().is_cpu(), "Leeway Edge GPU: unsupported source device");
  TORCH_CHECK(target_gpu || to.device().is_cpu(), "Leeway Edge GPU: unsupported target device");
  if (from.numel() == 0 || to.is_same(from)) return to;
  auto& rt = runtime();
  std::lock_guard<std::mutex> lock(rt.mutex);
  size_t bytes = from.numel() * sizeof(float);
  ComPtr<ID3D12Resource> staging;
  rt.begin();
  if (source_gpu && target_gpu) {
    auto& src = buffer(from); auto& dst = buffer(to);
    TORCH_CHECK(&src != &dst, "Leeway Edge GPU: aliased copies are not implemented");
    rt.transition(src, D3D12_RESOURCE_STATE_COPY_SOURCE);
    rt.transition(dst, D3D12_RESOURCE_STATE_COPY_DEST);
    rt.commands->CopyBufferRegion(dst.resource.Get(), 0, src.resource.Get(), 0, bytes);
  } else if (target_gpu) {
    auto& dst = buffer(to);
    staging = rt.resource(bytes, D3D12_HEAP_TYPE_UPLOAD, D3D12_RESOURCE_STATE_GENERIC_READ);
    void* mapped; D3D12_RANGE empty_range{0, 0};
    check(staging->Map(0, &empty_range, &mapped), "upload map");
    std::memcpy(mapped, from.const_data_ptr(), bytes);
    staging->Unmap(0, nullptr);
    rt.transition(dst, D3D12_RESOURCE_STATE_COPY_DEST);
    rt.commands->CopyBufferRegion(dst.resource.Get(), 0, staging.Get(), 0, bytes);
    uploads += bytes;
  } else {
    auto& src = buffer(from);
    staging = rt.resource(bytes, D3D12_HEAP_TYPE_READBACK, D3D12_RESOURCE_STATE_COPY_DEST);
    rt.transition(src, D3D12_RESOURCE_STATE_COPY_SOURCE);
    rt.commands->CopyBufferRegion(staging.Get(), 0, src.resource.Get(), 0, bytes);
  }
  rt.finish();
  if (!target_gpu) {
    void* mapped; D3D12_RANGE range{0, bytes};
    check(staging->Map(0, &range, &mapped), "readback map");
    std::memcpy(to.mutable_data_ptr(), mapped, bytes);
    D3D12_RANGE empty_range{0, 0}; staging->Unmap(0, &empty_range);
    downloads += bytes;
  }
  return to;
}
at::Tensor copy_from(const at::Tensor& from, const at::Tensor& to, bool nonblocking) {
  auto result = to;
  copy(result, from, nonblocking);
  return result;
}

struct Params { uint32_t m=0, n=0, k=0, count=0, op=0; float value=0, alpha=1; uint32_t reserved=0; };
void compute(const at::Tensor* a, const at::Tensor* b, at::Tensor& out, Params p, bool matmul) {
  auto& dest = buffer(out);
  if (!out.numel()) return;
  auto& rt = runtime();
  std::lock_guard<std::mutex> lock(rt.mutex);
  rt.begin();
  rt.transition(dest, D3D12_RESOURCE_STATE_UNORDERED_ACCESS);
  rt.commands->SetComputeRootSignature(rt.root.Get());
  rt.commands->SetPipelineState(matmul ? rt.mm_pipeline.Get() : rt.element_pipeline.Get());
  if (a) { auto& src = buffer(*a); rt.transition(src, D3D12_RESOURCE_STATE_NON_PIXEL_SHADER_RESOURCE);
    rt.commands->SetComputeRootShaderResourceView(0, src.resource->GetGPUVirtualAddress()); }
  else rt.commands->SetComputeRootShaderResourceView(0, 0);
  if (b) { auto& src = buffer(*b); rt.transition(src, D3D12_RESOURCE_STATE_NON_PIXEL_SHADER_RESOURCE);
    rt.commands->SetComputeRootShaderResourceView(1, src.resource->GetGPUVirtualAddress()); }
  else rt.commands->SetComputeRootShaderResourceView(1, 0);
  rt.commands->SetComputeRootUnorderedAccessView(2, dest.resource->GetGPUVirtualAddress());
  rt.commands->SetComputeRoot32BitConstants(3, 8, &p, 0);
  rt.commands->Dispatch(matmul ? (p.n+7)/8 : (p.count+255)/256, matmul ? (p.m+7)/8 : 1, 1);
  D3D12_RESOURCE_BARRIER barrier{};
  barrier.Type = D3D12_RESOURCE_BARRIER_TYPE_UAV;
  barrier.UAV.pResource = dest.resource.Get();
  rt.commands->ResourceBarrier(1, &barrier);
  rt.finish();
  ++dispatches;
}
at::Tensor make(at::IntArrayRef sizes) {
  return empty(sizes, at::kFloat, at::kStrided, c10::Device(DEVICE, 0), false, at::MemoryFormat::Contiguous);
}
at::Tensor& fill(at::Tensor& out, const at::Scalar& value) {
  Params p; p.count = static_cast<uint32_t>(out.numel()); p.value = value.toFloat();
  compute(nullptr, nullptr, out, p, false); return out;
}
at::Tensor& zero(at::Tensor& out) { return fill(out, 0); }
at::Tensor mm(const at::Tensor& a, const at::Tensor& b) {
  buffer(a); buffer(b);
  TORCH_CHECK(a.dim() == 2 && b.dim() == 2 && a.size(1) == b.size(0),
               "Leeway Edge GPU: matmul requires compatible rank-2 matrices");
  TORCH_CHECK(a.size(0) * a.size(1) * b.size(1) <= static_cast<int64_t>(MAX_MULTIPLIES),
               "Leeway Edge GPU: matmul budget exceeded");
  auto result = make({a.size(0), b.size(1)});
  Params p; p.m = static_cast<uint32_t>(a.size(0)); p.k = static_cast<uint32_t>(a.size(1));
  p.n = static_cast<uint32_t>(b.size(1)); compute(&a, &b, result, p, true); return result;
}
at::Tensor element(const at::Tensor& a, const at::Tensor* b, uint32_t op, float alpha=1) {
  buffer(a);
  if (b) { buffer(*b); TORCH_CHECK(a.sizes() == b->sizes(), "Leeway Edge GPU: broadcasting is not implemented"); }
  auto out = make(a.sizes()); Params p; p.count = static_cast<uint32_t>(a.numel());
  p.op = op; p.alpha = alpha; compute(&a, b, out, p, false); return out;
}
at::Tensor add(const at::Tensor& a, const at::Tensor& b, const at::Scalar& alpha) {
  return element(a, &b, 1, alpha.toFloat());
}
at::Tensor mul(const at::Tensor& a, const at::Tensor& b) { return element(a, &b, 2); }
at::Tensor relu(const at::Tensor& a) { return element(a, nullptr, 3); }

struct Guard : c10::impl::NoOpDeviceGuardImpl<DEVICE> {
  c10::Device getDevice() const override { return {DEVICE, 0}; }
  c10::Device exchangeDevice(c10::Device d) const override { index(d.index()); return getDevice(); }
  void setDevice(c10::Device d) const override { index(d.index()); }
  c10::Stream getStream(c10::Device) const noexcept override {
    return c10::Stream(c10::Stream::DEFAULT, c10::Device(DEVICE, 0));
  }
  c10::Stream exchangeStream(c10::Stream s) const noexcept override { return getStream(s.device()); }
  c10::Stream getNewStream(c10::Device, int) const override {
    TORCH_CHECK(false, "Leeway Edge GPU: additional streams are not implemented");
  }
  c10::DeviceIndex deviceCount() const noexcept override { return available() ? 1 : 0; }
  void synchronizeDevice(c10::DeviceIndex i) const override { index(i); runtime(); }
};
C10_REGISTER_GUARD_IMPL(PrivateUse1, Guard);
struct Hooks : at::PrivateUse1HooksInterface {
  bool isBuilt() const override { return true; }
  bool isAvailable() const override { return available(); }
  bool hasPrimaryContext(c10::DeviceIndex i) const override { index(i); return initialized.load(); }
  void init() const override { runtime(); }
  c10::DeviceIndex deviceCount() const override { return available() ? 1 : 0; }
  c10::DeviceIndex getCurrentDevice() const override { return 0; }
  void setCurrentDevice(c10::DeviceIndex i) const override { index(i); }
  c10::DeviceIndex exchangeDevice(c10::DeviceIndex i) const override { index(i); return 0; }
  c10::DeviceIndex maybeExchangeDevice(c10::DeviceIndex i) const override { index(i); return 0; }
} hooks;
struct Register {
  Register() { c10::SetAllocator(DEVICE, &gpu_allocator); at::RegisterPrivateUse1HooksInterface(&hooks); }
} registration;

void unsupported(const c10::OperatorHandle& op, torch::jit::Stack*) {
  TORCH_CHECK(false, "Leeway Edge GPU: operator ", op.schema().operator_name(),
               " is not implemented; CPU compute fallback is disabled");
}
TORCH_LIBRARY_IMPL(aten, PrivateUse1, m) {
  m.impl("empty.memory_format", TORCH_FN(empty));
  m.impl("empty_strided", TORCH_FN(empty_strided));
  m.impl("copy_", TORCH_FN(copy));
  m.impl("_copy_from", TORCH_FN(copy_from));
  m.impl("fill_.Scalar", TORCH_FN(fill));
  m.impl("zero_", TORCH_FN(zero));
  m.impl("mm", TORCH_FN(mm));
  m.impl("add.Tensor", TORCH_FN(add));
  m.impl("mul.Tensor", TORCH_FN(mul));
  m.impl("relu", TORCH_FN(relu));
}
TORCH_LIBRARY_IMPL(_, PrivateUse1, m) {
  m.fallback(torch::CppFunction::makeFromBoxedFunction<&unsupported>());
}
PYBIND11_MODULE(TORCH_EXTENSION_NAME, m) {
  m.def("is_available", &available);
  m.def("_shutdown", [] { if (initialized.load()) runtime().shutdown(); });
  m.def("adapter_is_eligible", [](std::wstring name, UINT vendor, UINT device, UINT flags) {
    DXGI_ADAPTER_DESC1 description{};
    wcsncpy_s(description.Description, name.c_str(), _TRUNCATE);
    description.VendorId = vendor; description.DeviceId = device; description.Flags = flags;
    return eligible(description);
  });
  m.def("validate_shaders", [] { compile_shader("matmul"); compile_shader("elementwise"); return true; });
  m.def("initialize", [] { hooks.init(); });
  m.def("synchronize", [] { hooks.init(); }); // Every queue submission is synchronous.
  m.def("statistics", [] {
    pybind11::dict d; d["allocated_bytes"]=allocated.load(); d["gpu_dispatches"]=dispatches.load();
    d["upload_bytes"]=uploads.load(); d["readback_bytes"]=downloads.load(); return d;
  });
  m.def("properties", [] {
    auto& rt = runtime(); DXGI_ADAPTER_DESC1 desc{};
    check(rt.adapter->GetDesc1(&desc), "adapter properties");
    pybind11::dict d; d["adapter_name"]=std::wstring(desc.Description); d["vendor_id"]=desc.VendorId;
    d["device_id"]=desc.DeviceId; d["dedicated_video_memory"]=desc.DedicatedVideoMemory;
    d["shared_system_memory"]=desc.SharedSystemMemory; d["runtime"]="D3D12";
    d["software_adapter"]=software_adapter(desc); d["dxgi_flags"]=desc.Flags;
    d["index"]=0; return d;
  });
}
} // namespace leeway
