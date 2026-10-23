# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.DIAGNOSTIC
# TAG: LEEWAY.G86.ATTENTION_OPERATOR_AUDIT
# 5WH: WHAT = Validate real-token layer-0 Qwen3 attention operators against independent Torch.
# WHY = Locate math discrepancies rather than speculatively modifying Qwen3 execution.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g86-attention-operator-audit.py
# WHEN = 2026-10-23
# HOW = Compare real embedding projections, rotary outputs, scores and causal contexts.
# LICENSE: MIT; AUTHORITY: Laboratory diagnostic; no independent llama.cpp activations.
import sys,os,json,importlib.util,numpy as np,torch
root=os.path.dirname(__file__)
def load(name,file):
 s=importlib.util.spec_from_file_location(name,os.path.join(root,file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
g73=load('g73','g73-first-transformer-block.py')
g62=load('g62','g62-native-quant-blocks.py')
def run(file):
 base,idx=g73.index_gguf(file);shape,typ,offset=idx['token_embd.weight']
 assert shape==[2560,151936] and typ==14
 def embed(token):
  with open(file,'rb') as f:f.seek(base+offset+2100*token);raw=f.read(2100)
  return g62.decode(raw,14)
 x=np.stack((embed(151643),embed(87)))
 W=lambda name:g73.weights(file,base,idx,'blk.0.'+name)
 eps=np.float32(1e-6)
 norm=g73.rms(x,W('attn_norm.weight'))
 tn=torch.from_numpy(x.copy());tw=torch.from_numpy(W('attn_norm.weight').copy())
 norm_t=tn*torch.rsqrt(tn.square().mean(-1,keepdim=True)+1e-6)*tw
 errors={'inputNorm':float(np.max(np.abs(norm-norm_t.numpy())))}
 q=(norm@W('attn_q.weight').T).reshape(2,32,128);k=(norm@W('attn_k.weight').T).reshape(2,8,128);v=(norm@W('attn_v.weight').T).reshape(2,8,128)
 for name,arr,heads in [('attn_q.weight',q,32),('attn_k.weight',k,8),('attn_v.weight',v,8)]:
  oracle=(norm_t@torch.from_numpy(W(name).copy()).T).reshape(2,heads,128).numpy()
  errors[name]=float(np.max(np.abs(arr-oracle)))
 def neox_numpy(z,p):
  phase=p/(1e6**(np.arange(64,dtype=np.float64)/64));c=np.cos(phase).astype('f4');s=np.sin(phase).astype('f4')
  return np.concatenate((z[...,:64]*c-z[...,64:]*s,z[...,:64]*s+z[...,64:]*c),axis=-1)
 def neox_torch(z,p):
  phase=torch.tensor(p,dtype=torch.float64)/torch.pow(torch.tensor(1e6,dtype=torch.float64),torch.arange(64,dtype=torch.float64)/64)
  c=phase.cos().float();s=phase.sin().float()
  return torch.cat((z[...,:64]*c-z[...,64:]*s,z[...,:64]*s+z[...,64:]*c),dim=-1)
 qw=W('attn_q_norm.weight');kw=W('attn_k_norm.weight')
 qn=np.stack([neox_numpy(g73.rms(q[i],qw),i) for i in range(2)])
 kn=np.stack([neox_numpy(g73.rms(k[i],kw),i) for i in range(2)])
 qt=torch.from_numpy(q.copy());kt=torch.from_numpy(k.copy())
 qwt=torch.from_numpy(qw.copy());kwt=torch.from_numpy(kw.copy())
 qr=torch.stack([neox_torch(qt[i]*torch.rsqrt(qt[i].square().mean(-1,keepdim=True)+1e-6)*qwt,i) for i in range(2)])
 kr=torch.stack([neox_torch(kt[i]*torch.rsqrt(kt[i].square().mean(-1,keepdim=True)+1e-6)*kwt,i) for i in range(2)])
 errors['qNormRoPE']=float(np.max(np.abs(qn-qr.numpy())))
 errors['kNormRoPE']=float(np.max(np.abs(kn-kr.numpy())))
 keys=np.repeat(kn,4,axis=1).transpose(1,0,2);vals=np.repeat(v,4,axis=1).transpose(1,0,2)
 scores=np.einsum('htd,hsd->hts',qn.transpose(1,0,2),keys)/np.sqrt(np.float32(128))
 tq=qr.permute(1,0,2);tk=kr.repeat_interleave(4,dim=1).permute(1,0,2);tv=torch.from_numpy(v.copy()).repeat_interleave(4,dim=1).permute(1,0,2)
 ts=(tq@tk.transpose(1,2))/np.sqrt(128)
 errors['scores']=float(np.max(np.abs(scores-ts.numpy())))
 mask=np.tril(np.ones((2,2),dtype=bool))
 ss=np.where(mask[None],scores,-np.inf);sm=np.exp(ss-ss.max(-1,keepdims=True));sm/=sm.sum(-1,keepdims=True)
 ctx=np.einsum('hts,hsd->htd',sm,vals)
 refctx=(torch.softmax(ts.masked_fill(~torch.from_numpy(mask)[None],float('-inf')),dim=-1)@tv).numpy()
 errors['causalContext']=float(np.max(np.abs(ctx-refctx)))
 passed=all(np.isfinite(list(errors.values()))) and all(v<=3e-4 for v in errors.values())
 print(json.dumps({'status':'G86_TORCH_OPERATOR_PASS' if passed else 'G86_OPERATOR_MISMATCH','actualTokenIds':[151643,87],'layer':0,'errors':errors,'allOperatorsWithin3eMinus4':passed,'llamaCppIntermediateReference':False,'secondTokenMismatchResolved':False,'productionAccepted':False},indent=2))
 if not passed:sys.exit(1)
if __name__=='__main__':run(sys.argv[1])
