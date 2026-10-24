#include <vulkan/vulkan.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cstdint>
#include <vector>
#include <fstream>
#include <iterator>
#include <stdexcept>
#define VK_OK(call) do { VkResult rc=(call); if(rc!=VK_SUCCESS) throw std::runtime_error(#call); } while(0)
static constexpr uint32_t N=256;
static uint32_t expected(uint32_t i){return (i*17u)^0x5A5A1234u;}
int main(int argc,char**argv){
 try{
  if(argc!=2) throw std::runtime_error("usage: leeway-vulkan-probe shader.spv");
  std::ifstream file(argv[1],std::ios::binary);
  std::vector<char> bytes((std::istreambuf_iterator<char>(file)),std::istreambuf_iterator<char>());
  if(bytes.empty()||bytes.size()%4)throw std::runtime_error("shader SPIR-V missing/unaligned");
  VkApplicationInfo app{VK_STRUCTURE_TYPE_APPLICATION_INFO};app.pApplicationName="LeeWay-G19-Readback-Probe";app.apiVersion=VK_API_VERSION_1_0;
  VkInstanceCreateInfo ici{VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO};ici.pApplicationInfo=&app;
  VkInstance instance{};VK_OK(vkCreateInstance(&ici,nullptr,&instance));
  uint32_t count=0;VK_OK(vkEnumeratePhysicalDevices(instance,&count,nullptr));if(!count)throw std::runtime_error("NO_VULKAN_DEVICE");
  std::vector<VkPhysicalDevice> gpus(count);VK_OK(vkEnumeratePhysicalDevices(instance,&count,gpus.data()));
  VkPhysicalDevice gpu{};uint32_t family=UINT32_MAX;VkPhysicalDeviceProperties properties{};
  // Qualcomm Adreno only. Do not accidentally qualify a software/foreign Vulkan adapter.
  constexpr uint32_t QUALCOMM_VENDOR_ID=0x5143u;
  for(auto d:gpus){
   VkPhysicalDeviceProperties candidate{};vkGetPhysicalDeviceProperties(d,&candidate);
   if(candidate.vendorID!=QUALCOMM_VENDOR_ID||candidate.deviceType==VK_PHYSICAL_DEVICE_TYPE_CPU)continue;
   uint32_t n=0;vkGetPhysicalDeviceQueueFamilyProperties(d,&n,nullptr);
   std::vector<VkQueueFamilyProperties> qs(n);vkGetPhysicalDeviceQueueFamilyProperties(d,&n,qs.data());
   for(uint32_t j=0;j<n;j++){if(qs[j].queueFlags&VK_QUEUE_COMPUTE_BIT){gpu=d;family=j;properties=candidate;break;}}
   if(gpu)break;
  }
  if(!gpu)throw std::runtime_error("QUALCOMM_COMPUTE_DEVICE_NOT_FOUND");
  float priority=1.0f;VkDeviceQueueCreateInfo qci{VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO};qci.queueFamilyIndex=family;qci.queueCount=1;qci.pQueuePriorities=&priority;
  VkDeviceCreateInfo dci{VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO};dci.queueCreateInfoCount=1;dci.pQueueCreateInfos=&qci;
  VkDevice device{};VK_OK(vkCreateDevice(gpu,&dci,nullptr,&device));VkQueue queue{};vkGetDeviceQueue(device,family,0,&queue);
  VkBufferCreateInfo bci{VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO};bci.size=N*sizeof(uint32_t);bci.usage=VK_BUFFER_USAGE_STORAGE_BUFFER_BIT;bci.sharingMode=VK_SHARING_MODE_EXCLUSIVE;
  VkBuffer buffer{};VK_OK(vkCreateBuffer(device,&bci,nullptr,&buffer));VkMemoryRequirements needs{};vkGetBufferMemoryRequirements(device,buffer,&needs);
  VkPhysicalDeviceMemoryProperties mem{};vkGetPhysicalDeviceMemoryProperties(gpu,&mem);uint32_t index=UINT32_MAX;
  for(uint32_t i=0;i<mem.memoryTypeCount;i++){if((needs.memoryTypeBits&(1u<<i))&&(mem.memoryTypes[i].propertyFlags&(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT|VK_MEMORY_PROPERTY_HOST_COHERENT_BIT))==(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT|VK_MEMORY_PROPERTY_HOST_COHERENT_BIT)){index=i;break;}}
  if(index==UINT32_MAX)throw std::runtime_error("NO_COHERENT_HOST_MEMORY");
  VkMemoryAllocateInfo mai{VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO};mai.allocationSize=needs.size;mai.memoryTypeIndex=index;
  VkDeviceMemory allocation{};VK_OK(vkAllocateMemory(device,&mai,nullptr,&allocation));VK_OK(vkBindBufferMemory(device,buffer,allocation,0));
  // Initialize the readback buffer to a sentinel before shader submission.
  void* initial{};VK_OK(vkMapMemory(device,allocation,0,bci.size,0,&initial));
  std::memset(initial,0xFF,static_cast<size_t>(bci.size));vkUnmapMemory(device,allocation);
  VkDescriptorSetLayoutBinding binding{};binding.binding=0;binding.descriptorType=VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;binding.descriptorCount=1;binding.stageFlags=VK_SHADER_STAGE_COMPUTE_BIT;
  VkDescriptorSetLayoutCreateInfo slci{VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO};slci.bindingCount=1;slci.pBindings=&binding;
  VkDescriptorSetLayout layout{};VK_OK(vkCreateDescriptorSetLayout(device,&slci,nullptr,&layout));
  VkPipelineLayoutCreateInfo plci{VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO};plci.setLayoutCount=1;plci.pSetLayouts=&layout;VkPipelineLayout pipelineLayout{};VK_OK(vkCreatePipelineLayout(device,&plci,nullptr,&pipelineLayout));
  // SPIR-V requires uint32_t-aligned storage, not a potentially unaligned char vector.
  std::vector<uint32_t> words(bytes.size()/sizeof(uint32_t));
  std::memcpy(words.data(),bytes.data(),bytes.size());
  if(words.size()<5||words[0]!=0x07230203u)throw std::runtime_error("SPIRV_HEADER_INVALID");
  VkShaderModuleCreateInfo smci{VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO};smci.codeSize=bytes.size();smci.pCode=words.data();
  VkShaderModule shader{};VK_OK(vkCreateShaderModule(device,&smci,nullptr,&shader));
  VkPipelineShaderStageCreateInfo stage{VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO};stage.stage=VK_SHADER_STAGE_COMPUTE_BIT;stage.module=shader;stage.pName="main";
  VkComputePipelineCreateInfo pci{VK_STRUCTURE_TYPE_COMPUTE_PIPELINE_CREATE_INFO};pci.stage=stage;pci.layout=pipelineLayout;VkPipeline pipeline{};VK_OK(vkCreateComputePipelines(device,VK_NULL_HANDLE,1,&pci,nullptr,&pipeline));
  VkDescriptorPoolSize poolSize{VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,1};VkDescriptorPoolCreateInfo dpci{VK_STRUCTURE_TYPE_DESCRIPTOR_POOL_CREATE_INFO};dpci.maxSets=1;dpci.poolSizeCount=1;dpci.pPoolSizes=&poolSize;
  VkDescriptorPool pool{};VK_OK(vkCreateDescriptorPool(device,&dpci,nullptr,&pool));VkDescriptorSetAllocateInfo dsai{VK_STRUCTURE_TYPE_DESCRIPTOR_SET_ALLOCATE_INFO};dsai.descriptorPool=pool;dsai.descriptorSetCount=1;dsai.pSetLayouts=&layout;VkDescriptorSet set{};VK_OK(vkAllocateDescriptorSets(device,&dsai,&set));
  VkDescriptorBufferInfo dbi{buffer,0,bci.size};VkWriteDescriptorSet write{VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET};write.dstSet=set;write.descriptorCount=1;write.descriptorType=VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;write.pBufferInfo=&dbi;vkUpdateDescriptorSets(device,1,&write,0,nullptr);
  VkCommandPoolCreateInfo cpci{VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO};cpci.queueFamilyIndex=family;VkCommandPool cmdPool{};VK_OK(vkCreateCommandPool(device,&cpci,nullptr,&cmdPool));
  VkCommandBufferAllocateInfo cbai{VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO};cbai.commandPool=cmdPool;cbai.level=VK_COMMAND_BUFFER_LEVEL_PRIMARY;cbai.commandBufferCount=1;VkCommandBuffer cmd{};VK_OK(vkAllocateCommandBuffers(device,&cbai,&cmd));
  VkCommandBufferBeginInfo bi{VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO};VK_OK(vkBeginCommandBuffer(cmd,&bi));vkCmdBindPipeline(cmd,VK_PIPELINE_BIND_POINT_COMPUTE,pipeline);vkCmdBindDescriptorSets(cmd,VK_PIPELINE_BIND_POINT_COMPUTE,pipelineLayout,0,1,&set,0,nullptr);vkCmdDispatch(cmd,4,1,1);
  VkMemoryBarrier barrier{VK_STRUCTURE_TYPE_MEMORY_BARRIER};barrier.srcAccessMask=VK_ACCESS_SHADER_WRITE_BIT;barrier.dstAccessMask=VK_ACCESS_HOST_READ_BIT;vkCmdPipelineBarrier(cmd,VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,VK_PIPELINE_STAGE_HOST_BIT,0,1,&barrier,0,nullptr,0,nullptr);VK_OK(vkEndCommandBuffer(cmd));
  VkSubmitInfo submit{VK_STRUCTURE_TYPE_SUBMIT_INFO};submit.commandBufferCount=1;submit.pCommandBuffers=&cmd;VkFenceCreateInfo fci{VK_STRUCTURE_TYPE_FENCE_CREATE_INFO};VkFence fence{};VK_OK(vkCreateFence(device,&fci,nullptr,&fence));VK_OK(vkQueueSubmit(queue,1,&submit,fence));VK_OK(vkWaitForFences(device,1,&fence,VK_TRUE,10000000000ULL));
  void* ptr{};VK_OK(vkMapMemory(device,allocation,0,bci.size,0,&ptr));uint32_t mismatches=0;for(uint32_t i=0;i<N;i++){if(static_cast<uint32_t*>(ptr)[i]!=expected(i))mismatches++;}vkUnmapMemory(device,allocation);
  std::printf("{\"adapter\":\"%s\",\"vendorId\":%u,\"deviceId\":%u,\"apiVersion\":%u,\"elements\":%u,\"mismatches\":%u,\"scope\":\"VULKAN_PHYSICAL_GPU_KERNEL_ONLY\"}\n",properties.deviceName,properties.vendorID,properties.deviceID,properties.apiVersion,N,mismatches);
  vkDeviceWaitIdle(device);vkDestroyFence(device,fence,nullptr);vkDestroyCommandPool(device,cmdPool,nullptr);vkDestroyDescriptorPool(device,pool,nullptr);vkDestroyPipeline(device,pipeline,nullptr);vkDestroyShaderModule(device,shader,nullptr);vkDestroyPipelineLayout(device,pipelineLayout,nullptr);vkDestroyDescriptorSetLayout(device,layout,nullptr);vkDestroyBuffer(device,buffer,nullptr);vkFreeMemory(device,allocation,nullptr);vkDestroyDevice(device,nullptr);vkDestroyInstance(instance,nullptr);
  return mismatches?2:0;
 }catch(const std::exception&e){std::fprintf(stderr,"G19_VULKAN_PROBE_NOT_QUALIFIED:%s\n",e.what());return 3;}
}
