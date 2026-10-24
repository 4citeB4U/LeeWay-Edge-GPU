// Synthetic operator metadata only; no trained model weights or qualification.
const H='1'.repeat(64),J='2'.repeat(64),K='3'.repeat(64);
export function syntheticModelPlan() {
  const tokens = [...Array.from({length: 94}, (_, i) => String.fromCharCode(33 + i)), 'Ġ', 'Ċ', '<|im_start|>', '<|im_end|>'];
  const tensors = []; let fileOffset = 0;
  function add(name, shape) { const elements = shape.reduce((a, b) => a * b, 1), bytes = elements * 4;
    tensors.push({name, shape, elements, bytes, fileOffset, type: 0}); fileOffset += bytes; }
  add('token_embd.weight', [64, tokens.length]); add('output_norm.weight', [64]);
  for (const name of ['attn_norm.weight', 'ffn_norm.weight']) add('blk.0.' + name, [64]);
  for (const name of ['attn_q.weight', 'attn_k.weight', 'attn_v.weight', 'attn_output.weight', 'ffn_gate.weight', 'ffn_up.weight', 'ffn_down.weight']) add('blk.0.' + name, [64, 64]);
  return {metadata: {'general.architecture': 'qwen2', 'qwen2.embedding_length': 64,
    'qwen2.block_count': 1, 'qwen2.attention.head_count': 1, 'qwen2.attention.head_count_kv': 1,
    'qwen2.attention.layer_norm_rms_epsilon': 1e-6, 'tokenizer.ggml.pre': 'qwen2',
    'tokenizer.ggml.tokens': tokens, 'tokenizer.ggml.merges': [],
    'tokenizer.ggml.token_type': tokens.map((_, i) => i >= tokens.length - 2 ? 3 : 1)},
    tensors, contextLimit: 128, modelSha256: H, tokenizerSha256: J, implementationSha256: K};
}
