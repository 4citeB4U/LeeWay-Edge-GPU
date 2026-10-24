/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.ADAPTER_DISCOVERY
TAG: LEEWAY_DXGI_PNP_KERNEL_ADAPTER_LUID_CORRELATION_V1
WHO: LeeWay owner-authorized engineering.
WHAT: Enumerate actual Windows DXGI adapters and match exact PnP instance via
      documented D3DKMT adapter-name to LUID mapping.
WHEN: 2026-10-24. WHERE: native/windows/dxgi-probe.
WHY: Native OS recognition cannot be inferred from a friendly name.
HOW: SetupDi present device interface + D3DKMT open + IDXGIFactory1 LUID
     comparison; no GPU compute and no device installation.
AUTHORITY: READ_ONLY_DIAGNOSTIC. No product or Veritas enrollment.
LICENSE: Existing LeeWay source terms.
*/
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <initguid.h>
#include <setupapi.h>
#include <cfgmgr32.h>
#include <winternl.h>
#include <ntddvdeo.h>
#include <d3dkmthk.h>
#include <dxgi1_2.h>
#include <string>
#include <vector>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <cstdint>
#include <cstring>

#pragma comment(lib, "dxgi.lib")
#pragma comment(lib, "setupapi.lib")
#pragma comment(lib, "cfgmgr32.lib")
#pragma comment(lib, "gdi32.lib")

namespace {
struct Adapter {
  LUID luid{};
  std::wstring description;
};
std::string utf8(const std::wstring& text) {
  if (text.empty()) return {};
  const int count=WideCharToMultiByte(CP_UTF8,WC_ERR_INVALID_CHARS,
    text.c_str(),static_cast<int>(text.size()),nullptr,0,nullptr,nullptr);
  if(count<=0) return {};
  std::string out(static_cast<size_t>(count),'\0');
  if(WideCharToMultiByte(CP_UTF8,WC_ERR_INVALID_CHARS,text.c_str(),
    static_cast<int>(text.size()),out.data(),count,nullptr,nullptr)!=count)
    return {};
  return out;
}
std::string jsonString(const std::string& value) {
  std::ostringstream out;
  out << '"';
  for (unsigned char c : value) {
    switch (c) {
      case '"': out << "\\\""; break;
      case '\\': out << "\\\\"; break;
      case '\n': out << "\\n"; break;
      case '\r': out << "\\r"; break;
      case '\t': out << "\\t"; break;
      default:
        if(c<0x20) out<<"\\u00"<<std::hex<<std::setw(2)
          <<std::setfill('0')<<static_cast<unsigned>(c)<<std::dec;
        else out << static_cast<char>(c);
    }
  }
  out << '"';
  return out.str();
}
std::string jsonWide(const std::wstring& value) {return jsonString(utf8(value));}
std::wstring getProp(HDEVINFO set,SP_DEVINFO_DATA& device,DWORD key) {
  std::vector<BYTE> buf(2048,0);
  DWORD type=0;
  if(!SetupDiGetDeviceRegistryPropertyW(set,&device,key,&type,
    buf.data(),static_cast<DWORD>(buf.size()),nullptr)||type!=REG_SZ)
    return L"";
  auto* value=reinterpret_cast<wchar_t*>(buf.data());
  return std::wstring(value);
}
std::wstring luidString(const LUID& value){
  std::wostringstream out;
  out<<std::uppercase<<std::hex<<static_cast<uint32_t>(value.HighPart)
     <<L"-"<<value.LowPart;
  return out.str();
}
bool luidEqual(const LUID& x,const LUID& y){
  return x.HighPart==y.HighPart&&x.LowPart==y.LowPart;
}
std::vector<Adapter> enumDXGI() {
  std::vector<Adapter> out;
  IDXGIFactory1* factory=nullptr;
  const HRESULT status=CreateDXGIFactory1(__uuidof(IDXGIFactory1),
    reinterpret_cast<void**>(&factory));
  if(FAILED(status)||!factory)throw std::runtime_error("DXGI_FACTORY_FAILED");
  for(UINT i=0;;++i){
    IDXGIAdapter1* current=nullptr;
    const HRESULT hr=factory->EnumAdapters1(i,&current);
    if(hr==DXGI_ERROR_NOT_FOUND)break;
    if(FAILED(hr)){factory->Release();throw std::runtime_error("DXGI_ENUM_FAILED");}
    DXGI_ADAPTER_DESC1 desc{};
    if(SUCCEEDED(current->GetDesc1(&desc)))out.push_back({desc.AdapterLuid,desc.Description});
    current->Release();
  }
  factory->Release();
  return out;
}
}
int main(int argc,char**) {
  // No device writes, admin privileges, driver load or runtime dispatch.
  if(argc!=1) {std::cerr<<"LEEWAY_DXGI_PROBE_USAGE";return 2;}
  try{
    const auto dxgi=enumDXGI();
    HDEVINFO set=SetupDiGetClassDevsW(&GUID_DISPLAY_DEVICE_ARRIVAL,
      nullptr,nullptr,DIGCF_PRESENT|DIGCF_DEVICEINTERFACE);
    if(set==INVALID_HANDLE_VALUE)throw std::runtime_error("DISPLAY_INTERFACE_ENUM_FAILED");
    std::ostringstream results;
    results<<"{\"schema\":\"leeway.native.dxgi-pnp.v1\",\"readOnly\":true,"
           <<"\"mappingMethod\":\"SetupDi+D3DKMT+DXGI_LUID\","
           <<"\"pnp\":[";
    bool firstPnp=true;
    std::vector<std::string> dxgiRows;
    for(DWORD i=0;;++i){
      SP_DEVICE_INTERFACE_DATA iface{};
      iface.cbSize=sizeof(iface);
      if(!SetupDiEnumDeviceInterfaces(set,nullptr,&GUID_DISPLAY_DEVICE_ARRIVAL,i,&iface)){
        if(GetLastError()!=ERROR_NO_MORE_ITEMS){SetupDiDestroyDeviceInfoList(set);
          throw std::runtime_error("DISPLAY_INTERFACE_ENUMERATION_FAILED");}
        break;
      }
      DWORD needed=0;
      SetupDiGetDeviceInterfaceDetailW(set,&iface,nullptr,0,&needed,nullptr);
      if(GetLastError()!=ERROR_INSUFFICIENT_BUFFER||needed<sizeof(SP_DEVICE_INTERFACE_DETAIL_DATA_W))
        continue;
      std::vector<BYTE> backing(needed,0);
      auto* detail=reinterpret_cast<SP_DEVICE_INTERFACE_DETAIL_DATA_W*>(backing.data());
      detail->cbSize=sizeof(*detail);
      SP_DEVINFO_DATA device{};
      device.cbSize=sizeof(device);
      if(!SetupDiGetDeviceInterfaceDetailW(set,&iface,detail,needed,nullptr,&device))
        continue;
      wchar_t instance[2048]{};
      if(!SetupDiGetDeviceInstanceIdW(set,&device,instance,2048,nullptr))continue;
      const std::wstring name=getProp(set,device,SPDRP_FRIENDLYNAME).empty()?
        getProp(set,device,SPDRP_DEVICEDESC):getProp(set,device,SPDRP_FRIENDLYNAME);
      const std::wstring service=getProp(set,device,SPDRP_SERVICE);
      ULONG statusFlags=0,problem=0;
      const CONFIGRET state=CM_Get_DevNode_Status(&statusFlags,&problem,device.DevInst,0);
      const bool started=state==CR_SUCCESS&&(statusFlags&DN_STARTED)!=0
                         &&(statusFlags&DN_HAS_PROBLEM)==0;
      if(!firstPnp)results<<",";
      firstPnp=false;
      results<<"{\"FriendlyName\":"<<jsonWide(name)
             <<",\"InstanceId\":"<<jsonWide(instance)
             <<",\"ServiceName\":"<<jsonWide(service)
             <<",\"Status\":"<<(started?"\"OK\"":"\"NOT_STARTED\"")<<"}";
      D3DKMT_OPENADAPTERFROMDEVICENAME opened{};
      opened.pDeviceName=detail->DevicePath;
      if(D3DKMTOpenAdapterFromDeviceName(&opened)==0){
        for(const auto& dx : dxgi)if(luidEqual(dx.luid,opened.AdapterLuid)){
          std::ostringstream line;
          line<<"{\"PNPDeviceID\":"<<jsonWide(instance)
              <<",\"Description\":"<<jsonWide(dx.description)
              <<",\"AdapterLuid\":"<<jsonWide(luidString(dx.luid))
              <<",\"NativeMapping\":true}";
          dxgiRows.push_back(line.str());
        }
        D3DKMT_CLOSEADAPTER close{};
        close.hAdapter=opened.hAdapter;
        D3DKMTCloseAdapter(&close);
      }
    }
    SetupDiDestroyDeviceInfoList(set);
    results<<"],\"dxgi\":[";
    for(size_t i=0;i<dxgiRows.size();++i){
      if(i)results<<",";
      results<<dxgiRows[i];
    }
    results<<"],\"enumeratedDxgiCount\":"<<dxgi.size()
           <<",\"matchedDxgiAndPnPCount\":"<<dxgiRows.size()<<"}";
    std::cout<<results.str()<<"\n";
    return 0;
  }catch(const std::exception& e){
    std::cerr<<"LEEWAY_DXGI_PNP_PROBE_FAIL_CLOSED "<<e.what()<<"\n";
    return 1;
  }
}
