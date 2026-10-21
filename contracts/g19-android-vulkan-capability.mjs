// G19 J-5: Android feature inventory only. No compute shader, model or GPU execution claim.
const feat=/^feature:([^=\r\n]+)(?:=([^\r\n]+))?$/gm;
export function readAndroidVulkanFeatures(raw){
 if(typeof raw!=='string')throw Error('ANDROID_FEATURE_SOURCE_REQUIRED');
 const entries=new Map();for(const m of raw.matchAll(feat))entries.set(m[1],m[2]??true);
 const compute=entries.has('android.hardware.vulkan.compute');
 const level=entries.get('android.hardware.vulkan.level')??null;
 const version=entries.get('android.hardware.vulkan.version')??null;
 return Object.freeze({source:'ADB_PM_LIST_FEATURES',computeFeatureAdvertised:compute,level:typeof level==='string'?level:null,version:typeof version==='string'?version:null,vulkanDispatchVerified:false,readbackVerified:false,localModelInferenceVerified:false});
}
