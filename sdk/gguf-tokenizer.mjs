/*
REGION: LEEWAY.EDGE_GPU.MODEL_IO
TAG: LEEWAY.EDGE_GPU.GGUF_TOKENIZER.G7
WHAT: Local deterministic tokenization for the inspected Qwen2 and Gemma4 metadata profiles.
WHY: Text must enter the actual model graph, not a simulated response or external tokenizer service.
WHO: Creator-authorized Agent Lee. ROLES: EXECUTE VERIFY.
WHERE: Existing Edge GPU SDK. WHEN: Bounded local text inference.
HOW: Model-supplied vocabulary/merge order, explicit profile rules and fixed chat delimiters.
LICENSE: MIT. Profiles reference official Qwen2/Gemma4 tokenizer and prompt specifications.
*/
const qwenPattern=/(?:'[sS]|'[tT]|'[rR][eE]|'[vV][eE]|'[mM]|'[lL][lL]|'[dD])|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/gu;
function byteAlphabet(){const values=[];for(let b=33;b<=126;b++)values.push(b);for(let b=161;b<=172;b++)values.push(b);for(let b=174;b<=255;b++)values.push(b);const chars=values.slice();let extra=0;for(let b=0;b<256;b++)if(!values.includes(b)){values.push(b);chars.push(256+extra++);}const encode=new Array(256),decode=new Map();values.forEach((v,i)=>{encode[v]=String.fromCodePoint(chars[i]);decode.set(encode[v],v);});return {encode,decode};}
export class GgufTokenizer{
 constructor(metadata){
  this.profile=metadata['tokenizer.ggml.pre'];if(!['qwen2','gemma4'].includes(this.profile))throw Error('TOKENIZER_PROFILE_UNSUPPORTED:'+this.profile);
  this.tokens=metadata['tokenizer.ggml.tokens'];this.types=metadata['tokenizer.ggml.token_type'];
  const merges=metadata['tokenizer.ggml.merges'];if(!Array.isArray(this.tokens)||!Array.isArray(merges)||this.tokens.length>400000)throw Error('TOKENIZER_VOCABULARY_INVALID');
  this.ids=new Map(this.tokens.map((v,i)=>[v,i]));this.ranks=new Map();merges.forEach((pair,i)=>{if(!this.ranks.has(pair))this.ranks.set(pair,i);});
  this.alphabet=byteAlphabet();this.specials=this.tokens.filter((v,i)=>this.types?.[i]===3||this.types?.[i]===4).filter(v=>v.length>0).sort((a,b)=>b.length-a.length);
  this.specialRegex=new RegExp(this.specials.map(v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gu');
  this.bos=metadata['tokenizer.ggml.bos_token_id'];this.eos=new Set(metadata['tokenizer.ggml.eos_token_ids']||[metadata['tokenizer.ggml.eos_token_id']]);
 }
 chatPrompt(text){
  if(typeof text!=='string'||!text.trim()||text.length>4096)throw Error('TOKENIZER_TEXT_BUDGET');
  if(this.profile==='qwen2')return '<|im_start|>user\n'+text+'<|im_end|>\n<|im_start|>assistant\n';
  return '<bos><|turn>user\n'+text+'<turn|>\n<|turn>model\n';
 }
 #merge(piece){
  const symbols=Array.from(piece);if(symbols.length>8192)throw Error('TOKENIZER_FRAGMENT_BUDGET');
  while(symbols.length>1){let best=Infinity,index=-1;for(let i=0;i<symbols.length-1;i++){const rank=this.ranks.get(symbols[i]+' '+symbols[i+1]);if(rank!==undefined&&rank<best){best=rank;index=i;}}if(index<0)break;symbols.splice(index,2,symbols[index]+symbols[index+1]);}
  const out=[];
  for(const s of symbols){const id=this.ids.get(s);if(id!==undefined){out.push(id);continue;}
   if(this.profile==='qwen2'){for(const ch of Array.from(s)){const tid=this.ids.get(ch);if(tid===undefined)throw Error('TOKENIZER_UNKNOWN_BYTE_SYMBOL');out.push(tid);}}
   else for(const byte of new TextEncoder().encode(s)){const token='<0x'+byte.toString(16).toUpperCase().padStart(2,'0')+'>';const tid=this.ids.get(token);if(tid===undefined)throw Error('TOKENIZER_BYTE_FALLBACK_ABSENT');out.push(tid);}
  }
  return out;
 }
 #plain(text){
  if(!text)return [];
  if(this.profile==='qwen2')return [...text.matchAll(qwenPattern)].flatMap(m=>this.#merge([...new TextEncoder().encode(m[0])].map(b=>this.alphabet.encode[b]).join('')));
  return [...text.replace(/ /g,'▁').matchAll(/[^\n]+|[\n]+/gu)].flatMap(m=>this.#merge(m[0]));
 }
 encode(text,{special=false}={}){
  if(typeof text!=='string'||text.length>16384)throw Error('TOKENIZER_INPUT_TOO_LONG');
  if(!special)return this.#plain(text);
  const out=[];let last=0;this.specialRegex.lastIndex=0;
  for(const match of text.matchAll(this.specialRegex)){out.push(...this.#plain(text.slice(last,match.index)),this.ids.get(match[0]));last=match.index+match[0].length;}
  out.push(...this.#plain(text.slice(last)));return out;
 }
 decode(ids,{special=false}={}){
  const chunks=[];let bytes=[];const flush=()=>{if(bytes.length){chunks.push(new TextDecoder().decode(new Uint8Array(bytes)));bytes=[];}};
  for(const id of ids){if(!Number.isInteger(id)||id<0||id>=this.tokens.length)throw Error('TOKEN_ID_INVALID');const text=this.tokens[id],type=this.types?.[id];
   if(type===3||type===4){flush();if(special)chunks.push(text);continue;}
   if(this.profile==='qwen2'){for(const ch of Array.from(text)){const b=this.alphabet.decode.get(ch);if(b===undefined){flush();chunks.push(ch);}else bytes.push(b);}}
   else if(/^<0x[0-9A-Fa-f]{2}>$/.test(text))bytes.push(parseInt(text.slice(3,5),16));else{flush();chunks.push(text.replace(/▁/g,' '));}
  }
  flush();return chunks.join('');
 }
}
