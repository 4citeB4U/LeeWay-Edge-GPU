"""Build the Windows adapter against the caller's installed PyTorch."""
import sys
from setuptools import setup

extensions = []
commands = {}
if sys.platform == "win32":
    from torch.utils.cpp_extension import BuildExtension, CppExtension

    extensions = [CppExtension(
        "leeway_edge_gpu._C",
        ["native/backend.cpp"],
        libraries=["d3d12", "dxgi", "d3dcompiler"],
        extra_compile_args=["/O2", "/std:c++17", "/DNOMINMAX"],
    )]
    commands = {"build_ext": BuildExtension}

setup(
    name="leeway-edge-gpu",
    version="0.1.0.dev0",
    description="Leeway Edge GPU: experimental PyTorch GPU backend",
    packages=["leeway_edge_gpu"],
    python_requires=">=3.10",
    install_requires=["torch>=2.12,<2.13"],
    ext_modules=extensions,
    cmdclass=commands,
)
