# Leeway Edge GPU for PyTorch

Experimental native GPU backend, registered as `leeway` and exposed through
`torch.leeway`. The implemented Windows adapter uses physical D3D12 GPU buffers
and HLSL compute shaders. It excludes software/remote DXGI adapters, never selects
WARP or Microsoft Basic Render Driver (including its observed unflagged CI form),
and installs no CPU compute fallback. CPU memory participates in explicit
uploads/readbacks and host orchestration.

The display name is **Leeway Edge GPU**. `get_device_properties()` also reports
the underlying hardware adapter and vendor. Registration does not change the
Windows display-adapter name, create a physical LeeWay chip, or make CUDA claims.

The Windows qualification run passed 13 checks on an NVIDIA GeForce RTX 5060
Laptop GPU with one unavailable-device check skipped. It includes numerical
readback and clean process shutdown. See [evidence and scope](../docs/virtual-gpu/PYTORCH-EDGE-GPU-20261023.md).

## Build against an existing PyTorch installation

This initial adapter targets Windows x64, Python >=3.10 and PyTorch 2.12.x.
Use the installed Windows SDK and a Visual Studio x64 Native Tools prompt:

```bat
cd pytorch
set DISTUTILS_USE_SDK=1
python setup.py build_ext --inplace
python -m unittest discover -s tests -v
```

Set `LEEWAY_REQUIRE_GPU=1` for a qualification run that must fail when no physical
GPU is available. Without it, hardware tests are explicitly skipped on hosts
without a qualified adapter. No GPU runtime, model, driver, or system package is
downloaded by these commands. A build on another OS installs the Python discovery
surface only; `is_available()` reports false. Vulkan and Metal adapters are not
implemented in this package.

From the `pytorch` directory (or after building/installing the package locally):

```python
import torch
import leeway_edge_gpu

assert torch.leeway.is_available()
print(torch.leeway.get_device_name())       # Leeway Edge GPU
print(torch.leeway.get_device_properties()) # physical adapter remains visible

with torch.inference_mode():
    a = torch.ones((64, 32), device="leeway")
    b = torch.ones((32, 16), device="leeway")
    c = a @ b                              # native D3D12 GPU shader
    print(c.device)                        # leeway:0
    print(c.cpu())                         # explicit GPU readback
```

## Implemented scope

- One physical adapter, selected with DXGI's high-performance preference.
- Contiguous float32 tensors, with storage offset zero.
- `empty`, `empty_strided` with contiguous strides, `ones`, `zeros`, scalar fill,
  transfers, rank-2 matmul, same-shape tensor addition/multiplication, and ReLU.
- Synchronous command submission and synchronization; one default stream.
- Device properties and allocated-byte/dispatch/transfer counters.
- Bounds matching `dispatch/tensor-contract.mjs`: 4,194,304 elements per tensor,
  dimensions <=4096, and 67,108,864 multiplies per matmul. These are qualification
  limits, not measured hardware limits.

Unsupported operators, dtypes, broadcasting, views, asynchronous transfers,
extra streams, GPU random generation, autograd, and compiler integration raise
errors. General model compatibility is not established. CPU tensors may supply
input data with an explicit `.to("leeway")`; supported mathematical operations
execute in GPU shaders. There is no automatic move of a failed operation to CPU.

## LeeWay authority boundary

This package is an **experimental compute adapter**, comparable to the existing
G19 physical-device probes. It does not enroll an issuer, change Formula policy,
borrow the D3D12 signer's private key, issue a canonical receipt, append a ledger,
or enable production dispatch. `torch.leeway.status()` preserves those states.
The existing G39 acceptance matrix and Runtime Fabric gates remain authoritative.

The next production integration must bind the exact operator/input payload to
Formula admission, LDWMD ownership, independently signed Veritas PRE/POST,
Continuum readback, and canonical Receipt/Learning Ledger results. A local GPU
test result is diagnostic evidence, not production certification.
