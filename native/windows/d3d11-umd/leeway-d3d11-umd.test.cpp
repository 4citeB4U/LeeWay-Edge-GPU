/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.D3D11_UMD
TAG: LEEWAY_D3D11_OPENADAPTER_ABI_FAIL_CLOSED_TEST
WHO: Creator-authorized LeeWay engineering.
WHAT: Load actual Windows UMD DLL and verify its one D3D11 export.
WHEN: 2026-10-24. WHERE: native/windows/d3d11-umd.
WHY: Falsely advertising OpenAdapter success can destabilize Direct3D.
HOW: LoadLibrary/GetProcAddress + typed HRESULT and callback checks.
AUTHORITY: Lab only, no adapter installation. LICENSE: LeeWay.
*/
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <dxgi.h>
#include <iostream>

typedef HRESULT (APIENTRY* OpenAdapterEntry)(void*);
int wmain(int argc,wchar_t** argv){
 if(argc!=2){std::cerr<<"DLL_PATH_REQUIRED\n";return 2;}
 HMODULE library=LoadLibraryW(argv[1]);
 if(!library){std::cerr<<"UMD_DLL_LOAD_FAILED\n";return 3;}
 auto fn=reinterpret_cast<OpenAdapterEntry>(GetProcAddress(library,"OpenAdapter10_2"));
 if(!fn){FreeLibrary(library);std::cerr<<"OPENADAPTER_EXPORT_MISSING\n";return 4;}
 const bool hasLabSubmit=GetProcAddress(library,"LeeWayUmdLabSubmit")!=nullptr;
 const bool hasLabReadback=GetProcAddress(library,"LeeWayUmdLabReadback")!=nullptr;
#if defined(LEEWAY_UMD_LAB_EXPECTED)
 if(!hasLabSubmit||!hasLabReadback){FreeLibrary(library);return 6;}
#else
 if(hasLabSubmit||hasLabReadback){FreeLibrary(library);return 7;}
#endif
 const auto invalid=fn(nullptr);
 unsigned char fakeData[512]{};
 const auto declined=fn(fakeData);
 FreeLibrary(library);
 if(invalid!=E_INVALIDARG||declined!=DXGI_ERROR_UNSUPPORTED){
  std::cerr<<"UMD_DDI_FAIL_CLOSED_VIOLATED\n";return 5;
 }
 std::cout<<"LEEWAY_D3D11_UMD_ABI_PASS realDllExport=true "
          <<"nullRejected=true noKmdAdmission=true deviceAdvertised=false "
          <<"driverInstalled=false\n";
 return 0;
}
