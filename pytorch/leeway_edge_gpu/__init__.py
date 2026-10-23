"""Leeway Edge GPU PyTorch registration. No CPU compute fallback is installed."""
from importlib import import_module
import atexit
import torch

PRODUCT_NAME = "Leeway Edge GPU"
__version__ = "0.1.0.dev0"
_native = None
_load_error = None

# Never steal a backend already registered by another extension.
_name = torch._C._get_privateuse1_backend_name()
if _name not in ("privateuseone", "leeway"):
    raise RuntimeError(f"{PRODUCT_NAME}: PyTorch's extension slot is owned by {_name!r}")
if hasattr(torch, "leeway"):
    raise RuntimeError(f"{PRODUCT_NAME}: torch.leeway is already registered")
torch.utils.rename_privateuse1_backend("leeway")
try:
    _native = import_module("._C", __name__)
except ImportError as exc:
    _load_error = str(exc)
else:
    # Driver COM objects must be released before Windows DLL process-detach.
    atexit.register(_native._shutdown)


def _require_native():
    if _native is None:
        raise RuntimeError(f"{PRODUCT_NAME}: native GPU adapter unavailable: {_load_error}")
    return _native


def _index(device=None):
    if device is None:
        return 0
    if isinstance(device, int):
        index = device
    else:
        parsed = torch.device(device)
        if parsed.type != "leeway":
            raise ValueError(f"{PRODUCT_NAME}: expected a leeway device")
        index = parsed.index or 0
    if index != 0:
        raise ValueError(f"{PRODUCT_NAME}: only leeway:0 is implemented")
    return index


def is_available():
    return _native is not None and _native.is_available()


def device_count():
    return int(is_available())


def current_device():
    _require_native().initialize()
    return 0


def set_device(device):
    _index(device)
    _require_native().initialize()


def synchronize(device=None):
    _index(device)
    _require_native().synchronize()


def get_device_name(device=None):
    _index(device)
    _require_native().initialize()
    return PRODUCT_NAME


def get_device_properties(device=None):
    _index(device)
    return {"name": PRODUCT_NAME, **_require_native().properties()}


def memory_allocated(device=None):
    _index(device)
    return _require_native().statistics()["allocated_bytes"]


def status():
    return {
        "name": PRODUCT_NAME,
        "device": "leeway:0",
        "available": is_available(),
        "scope": "EXPERIMENTAL_GPU_COMPUTE",
        "production_dispatch_authorized": False,
        "canonical_receipt_issued": False,
        "cpu_compute_fallback": False,
        "native_load_error": _load_error,
        "statistics": _native.statistics() if _native else None,
    }


def _lazy_init():
    _require_native().initialize()


def get_amp_supported_dtype():
    return []


torch._register_device_module("leeway", __import__(__name__))
torch.utils.generate_methods_for_privateuse1_backend()
