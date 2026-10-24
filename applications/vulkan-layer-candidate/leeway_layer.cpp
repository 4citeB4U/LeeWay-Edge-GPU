#define VK_NO_PROTOTYPES
#include <vulkan/vulkan.h>
#include <vulkan/vk_layer.h>
#include <cstring>
#include <mutex>
#include <unordered_map>
#include <windows.h>

namespace {
constexpr const char *NAME="VK_LAYER_LEEWAY_gpu_optin";
std::mutex mutex;
std::unordered_map<VkInstance,PFN_vkGetInstanceProcAddr> nextInstances;
std::unordered_map<VkDevice,PFN_vkGetDeviceProcAddr> nextDevices;
PFN_vkGetInstanceProcAddr globalNext=nullptr;
VkInstance lastInstance=VK_NULL_HANDLE;
}
extern "C" {
__declspec(dllexport) VKAPI_ATTR PFN_vkVoidFunction VKAPI_CALL vkGetInstanceProcAddr(VkInstance,const char*);
__declspec(dllexport) VKAPI_ATTR PFN_vkVoidFunction VKAPI_CALL vkGetDeviceProcAddr(VkDevice,const char*);
__declspec(dllexport) VKAPI_ATTR VkResult VKAPI_CALL vkCreateInstance(const VkInstanceCreateInfo*,const VkAllocationCallbacks*,VkInstance*);
__declspec(dllexport) VKAPI_ATTR void VKAPI_CALL vkDestroyInstance(VkInstance,const VkAllocationCallbacks*);
__declspec(dllexport) VKAPI_ATTR VkResult VKAPI_CALL vkCreateDevice(VkPhysicalDevice,const VkDeviceCreateInfo*,const VkAllocationCallbacks*,VkDevice*);
__declspec(dllexport) VKAPI_ATTR void VKAPI_CALL vkDestroyDevice(VkDevice,const VkAllocationCallbacks*);
__declspec(dllexport) VKAPI_ATTR VkResult VKAPI_CALL vkEnumerateInstanceLayerProperties(uint32_t*,VkLayerProperties*);
__declspec(dllexport) VKAPI_ATTR VkResult VKAPI_CALL vkEnumerateInstanceExtensionProperties(const char*,uint32_t*,VkExtensionProperties*);
VKAPI_ATTR VkResult VKAPI_CALL vkNegotiateLoaderLayerInterfaceVersion(VkNegotiateLayerInterface *info){
 if(!info||info->loaderLayerInterfaceVersion<2)return VK_ERROR_INITIALIZATION_FAILED;
 info->loaderLayerInterfaceVersion=2;
 info->pfnGetInstanceProcAddr=vkGetInstanceProcAddr;
 info->pfnGetDeviceProcAddr=vkGetDeviceProcAddr;
 info->pfnGetPhysicalDeviceProcAddr=nullptr;
 return VK_SUCCESS;
}
__declspec(dllexport) VKAPI_ATTR VkResult VKAPI_CALL vkEnumerateInstanceLayerProperties(uint32_t *count,VkLayerProperties *props){
 if(!count)return VK_ERROR_INITIALIZATION_FAILED;
 if(!props){*count=1;return VK_SUCCESS;}
 if(*count==0)return VK_INCOMPLETE;
 VkLayerProperties layer={};
 std::strncpy(layer.layerName,NAME,VK_MAX_EXTENSION_NAME_SIZE-1);
 layer.specVersion=VK_API_VERSION_1_4;layer.implementationVersion=1;
 std::strncpy(layer.description,"LeeWay GPU opt-in Vulkan observation layer (non-dispatch)",VK_MAX_DESCRIPTION_SIZE-1);
 props[0]=layer;*count=1;return VK_SUCCESS;
}
__declspec(dllexport) VKAPI_ATTR VkResult VKAPI_CALL vkEnumerateInstanceExtensionProperties(const char *layer,uint32_t *count,VkExtensionProperties*){
 if(layer&&std::strcmp(layer,NAME)!=0)return VK_ERROR_LAYER_NOT_PRESENT;
 if(!count)return VK_ERROR_INITIALIZATION_FAILED;
 *count=0;return VK_SUCCESS;
}
__declspec(dllexport) VKAPI_ATTR VkResult VKAPI_CALL vkCreateInstance(const VkInstanceCreateInfo *info,const VkAllocationCallbacks *allocator,VkInstance *instance){
 if(!info||!instance)return VK_ERROR_INITIALIZATION_FAILED;
 auto *chain=reinterpret_cast<VkLayerInstanceCreateInfo*>(const_cast<void*>(info->pNext));
 while(chain && !(chain->sType==VK_STRUCTURE_TYPE_LOADER_INSTANCE_CREATE_INFO && chain->function==VK_LAYER_LINK_INFO))
  chain=reinterpret_cast<VkLayerInstanceCreateInfo*>(const_cast<void*>(chain->pNext));
 if(!chain||!chain->u.pLayerInfo)return VK_ERROR_INITIALIZATION_FAILED;
 auto next=chain->u.pLayerInfo->pfnNextGetInstanceProcAddr;
 if(!next)return VK_ERROR_INITIALIZATION_FAILED;
 auto create=reinterpret_cast<PFN_vkCreateInstance>(next(VK_NULL_HANDLE,"vkCreateInstance"));
 if(!create)return VK_ERROR_INITIALIZATION_FAILED;
 chain->u.pLayerInfo=chain->u.pLayerInfo->pNext;
 auto result=create(info,allocator,instance);
 if(result==VK_SUCCESS){
  std::lock_guard<std::mutex> lock(mutex);
  nextInstances[*instance]=next;globalNext=next;lastInstance=*instance;
  OutputDebugStringA("LEEWAY_GPU_VULKAN_LAYER_INSTANCE_PASS_THROUGH\n");
 }
 return result;
}
__declspec(dllexport) VKAPI_ATTR void VKAPI_CALL vkDestroyInstance(VkInstance instance,const VkAllocationCallbacks *alloc){
 PFN_vkGetInstanceProcAddr next=nullptr;
 {
  std::lock_guard<std::mutex> lock(mutex);
  auto it=nextInstances.find(instance);if(it!=nextInstances.end()){next=it->second;nextInstances.erase(it);}
 }
 if(next){auto destroy=reinterpret_cast<PFN_vkDestroyInstance>(next(instance,"vkDestroyInstance"));if(destroy)destroy(instance,alloc);}
}
__declspec(dllexport) VKAPI_ATTR VkResult VKAPI_CALL vkCreateDevice(VkPhysicalDevice physical,const VkDeviceCreateInfo *info,const VkAllocationCallbacks *alloc,VkDevice *device){
 if(!info||!device)return VK_ERROR_INITIALIZATION_FAILED;
 auto *chain=reinterpret_cast<VkLayerDeviceCreateInfo*>(const_cast<void*>(info->pNext));
 while(chain && !(chain->sType==VK_STRUCTURE_TYPE_LOADER_DEVICE_CREATE_INFO && chain->function==VK_LAYER_LINK_INFO))
  chain=reinterpret_cast<VkLayerDeviceCreateInfo*>(const_cast<void*>(chain->pNext));
 if(!chain||!chain->u.pLayerInfo)return VK_ERROR_INITIALIZATION_FAILED;
 auto nextI=chain->u.pLayerInfo->pfnNextGetInstanceProcAddr;
 auto nextD=chain->u.pLayerInfo->pfnNextGetDeviceProcAddr;
 if(!nextI||!nextD)return VK_ERROR_INITIALIZATION_FAILED;
 VkInstance instance;
 {std::lock_guard<std::mutex> lock(mutex);instance=lastInstance;}
 auto create=reinterpret_cast<PFN_vkCreateDevice>(nextI(instance,"vkCreateDevice"));
 if(!create)return VK_ERROR_INITIALIZATION_FAILED;
 chain->u.pLayerInfo=chain->u.pLayerInfo->pNext;
 auto result=create(physical,info,alloc,device);
 if(result==VK_SUCCESS){
  std::lock_guard<std::mutex> lock(mutex);nextDevices[*device]=nextD;
  OutputDebugStringA("LEEWAY_GPU_VULKAN_LAYER_DEVICE_PASS_THROUGH\n");
 }
 return result;
}
__declspec(dllexport) VKAPI_ATTR void VKAPI_CALL vkDestroyDevice(VkDevice device,const VkAllocationCallbacks *alloc){
 PFN_vkGetDeviceProcAddr next=nullptr;
 {std::lock_guard<std::mutex> lock(mutex);auto it=nextDevices.find(device);if(it!=nextDevices.end()){next=it->second;nextDevices.erase(it);}}
 if(next){auto destroy=reinterpret_cast<PFN_vkDestroyDevice>(next(device,"vkDestroyDevice"));if(destroy)destroy(device,alloc);}
}
__declspec(dllexport) VKAPI_ATTR PFN_vkVoidFunction VKAPI_CALL vkGetInstanceProcAddr(VkInstance instance,const char *name){
 if(!name)return nullptr;
 if(std::strcmp(name,"vkCreateInstance")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkCreateInstance);
 if(std::strcmp(name,"vkDestroyInstance")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkDestroyInstance);
 if(std::strcmp(name,"vkCreateDevice")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkCreateDevice);
 if(std::strcmp(name,"vkDestroyDevice")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkDestroyDevice);
 if(std::strcmp(name,"vkGetInstanceProcAddr")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkGetInstanceProcAddr);
 if(std::strcmp(name,"vkGetDeviceProcAddr")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkGetDeviceProcAddr);
 if(std::strcmp(name,"vkEnumerateInstanceLayerProperties")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkEnumerateInstanceLayerProperties);
 if(std::strcmp(name,"vkEnumerateInstanceExtensionProperties")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkEnumerateInstanceExtensionProperties);
 PFN_vkGetInstanceProcAddr next=nullptr;
 {std::lock_guard<std::mutex> lock(mutex);auto it=nextInstances.find(instance);if(it!=nextInstances.end())next=it->second;else next=globalNext;}
 return next?next(instance,name):nullptr;
}
__declspec(dllexport) VKAPI_ATTR PFN_vkVoidFunction VKAPI_CALL vkGetDeviceProcAddr(VkDevice device,const char *name){
 if(!name)return nullptr;
 if(std::strcmp(name,"vkGetDeviceProcAddr")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkGetDeviceProcAddr);
 if(std::strcmp(name,"vkDestroyDevice")==0)return reinterpret_cast<PFN_vkVoidFunction>(vkDestroyDevice);
 PFN_vkGetDeviceProcAddr next=nullptr;
 {std::lock_guard<std::mutex> lock(mutex);auto it=nextDevices.find(device);if(it!=nextDevices.end())next=it->second;}
 return next?next(device,name):nullptr;
}
}
