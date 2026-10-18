# G19 J-5 — Embedded CI Q4_K SPIR-V relocation evidence — 2026-10-18

## Investigate
Read-only inspection of verified G19 CI `libggml-vulkan.so` yielded 1,055 occurrences of SPIR-V magic `03 02 23 07`. `llvm-nm -C` identifies `arr_dmmv_q4_k_f32_f32_data` at ELF VA `0x18e9e08` and `arr_dmmv_q4_k_f32_f32_len` at `0x18ebcf0`.

## Diagnose
`llvm-readelf -r` identifies six `R_AARCH64_RELATIVE` relocations at `0x18e9e08` through `0x18e9e30` to the Q4_K shader data at VAs `0x9e9408`, `0x9eddb0`, `0x9f27d8`, `0x9cded0`, `0x9d2a10`, `0x9d7598`. These locations contain expected SPIR-V magic and version field 66816 (SPIR-V 1.5). The first contiguous start offsets differ by 18856 and 18984 bytes, which must **not** be treated as exact blob lengths without accounting for padding and symbol metadata. The data array appears zero in raw ELF bytes until runtime relocations are interpreted.

## Plan / Test / Verify
Confirmed source symbol, relocation entries and magic/version using read-only Windows commands. An attempted isolated extraction-script write was blocked by tool safety checks. No exact blob extraction, hash, spirv-val, or physical Qwen3 GPU retest was completed in this checkpoint. Existing phone library unchanged. Next authorized step: extract six blobs using validated instruction boundaries and actual lengths; hash, validate Vulkan 1.2 SPIR-V, disassemble, compare candidate output, then choose a reversible repair.

## Governance
Investigate → Diagnose → Plan → Implement (blocked) → Test (read-only checks PASS) → Validate (boundaries identified) → Verify (no model correctness claim) → Evidence (this report and PR contributor pad). J-5 Windows/Fold6 only; J-7 Apple and production unchanged. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
