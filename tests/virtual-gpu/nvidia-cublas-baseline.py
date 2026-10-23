"""Isolated NVIDIA comparison only; never LeeWay software execution."""
import argparse
import ctypes as c
import hashlib
import json
import os
from pathlib import Path
import re
import time

LABEL = 'BASELINE_ONLY_NEVER_LEEWAY_EXECUTION'
EXPECTED_DEVICE = 'NVIDIA GeForce RTX 5060 Laptop GPU'

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def bind(lib, name, args, result=c.c_int):
    fn = getattr(lib, name)
    fn.argtypes, fn.restype = args, result
    return fn

def check(code, where):
    if code != 0:
        raise RuntimeError(f'{where} failed with status {code}')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--request', required=True)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--dll-dir', required=True)
    args = parser.parse_args()
    request = json.loads(Path(args.request).read_text(encoding='utf-8-sig'))
    cases = request.get('cases')
    reps, warmups = request.get('repetitions'), request.get('warmups')
    if not isinstance(request.get('schema'), str) or not request['schema']:
        raise ValueError('request schema required')
    if type(reps) is not int or reps < 1 or reps > 3 or type(warmups) is not int or not 0 <= warmups <= 1:
        raise ValueError('repetitions must be 1..3 and warmups 0..1')
    if not isinstance(cases, list) or not 1 <= len(cases) <= 6:
        raise ValueError('one to six cases required')
    specs, ids = [], set()
    for case in cases:
        ident, n = case.get('id'), case.get('size')
        if not isinstance(ident, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,64}', ident) or ident in ids:
            raise ValueError('case id invalid or repeated')
        if type(n) is not int or not 1 <= n <= 2048:
            raise ValueError('case size must be 1..2048')
        ids.add(ident)
        paths = [Path(case[key]).resolve(strict=True) for key in ('aPath', 'bPath')]
        byte_count = n * n * 4
        if any(p.stat().st_size != byte_count for p in paths):
            raise ValueError(f'{ident}: input length mismatch')
        specs.append((ident, n, paths, byte_count))

    dll_dir = Path(args.dll_dir).resolve(strict=True)
    dlls = {name: dll_dir / name for name in ('cublas64_12.dll', 'cublasLt64_12.dll', 'cudart64_12.dll')}
    if any(not p.is_file() for p in dlls.values()):
        raise FileNotFoundError('required CUDA runtime/cuBLAS DLL missing')
    dll_hashes = {name: digest(path) for name, path in dlls.items()}
    output = Path(args.output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    report_path = output / 'nvidia-cublas-baseline.json'
    if report_path.exists():
        raise FileExistsError('output report already exists')
    report = {'schema': 'leeway.nvidia-cublas-comparison.v1', 'classification': LABEL,
              'requestSha256': digest(Path(args.request)), 'dllSha256': dll_hashes,
              'status': 'FAILED', 'cases': [], 'correctness': 'NOT_VERIFIED_BY_BASELINE_HELPER',
              'timingBoundary': 'host allocation + H2D + synchronized SGEMM + D2H + free; excludes handle setup, input file reading, output write and validation',
              'computeOnlyGpuTiming': 'NOT_MEASURED', 'cublasMathMode': 'CUBLAS_PEDANTIC_MATH'}

    handle = c.c_void_p()
    cleanup_errors = []
    cuda_free = destroy = None
    try:
        with os.add_dll_directory(str(dll_dir)):
            driver = c.WinDLL('nvcuda.dll')
            rt = c.WinDLL(str(dlls['cudart64_12.dll']))
            blas = c.WinDLL(str(dlls['cublas64_12.dll']))
            cu_init = bind(driver, 'cuInit', [c.c_uint])
            cu_count = bind(driver, 'cuDeviceGetCount', [c.POINTER(c.c_int)])
            cu_get = bind(driver, 'cuDeviceGet', [c.POINTER(c.c_int), c.c_int])
            cu_name = bind(driver, 'cuDeviceGetName', [c.c_char_p, c.c_int, c.c_int])
            cu_pci = bind(driver, 'cuDeviceGetPCIBusId', [c.c_char_p, c.c_int, c.c_int])
            count_rt = bind(rt, 'cudaGetDeviceCount', [c.POINTER(c.c_int)])
            pci_rt = bind(rt, 'cudaDeviceGetPCIBusId', [c.c_char_p, c.c_int, c.c_int])
            set_device = bind(rt, 'cudaSetDevice', [c.c_int])
            malloc = bind(rt, 'cudaMalloc', [c.POINTER(c.c_void_p), c.c_size_t])
            cuda_free = bind(rt, 'cudaFree', [c.c_void_p])
            memcpy = bind(rt, 'cudaMemcpy', [c.c_void_p, c.c_void_p, c.c_size_t, c.c_int])
            sync = bind(rt, 'cudaDeviceSynchronize', [])
            create = bind(blas, 'cublasCreate_v2', [c.POINTER(c.c_void_p)])
            destroy = bind(blas, 'cublasDestroy_v2', [c.c_void_p])
            math_mode = bind(blas, 'cublasSetMathMode', [c.c_void_p, c.c_int])
            version = bind(blas, 'cublasGetVersion_v2', [c.c_void_p, c.POINTER(c.c_int)])
            sgemm = bind(blas, 'cublasSgemm_v2', [c.c_void_p, c.c_int, c.c_int, c.c_int, c.c_int, c.c_int,
                         c.POINTER(c.c_float), c.c_void_p, c.c_int, c.c_void_p, c.c_int,
                         c.POINTER(c.c_float), c.c_void_p, c.c_int])
            check(cu_init(0), 'cuInit')
            count = c.c_int(); check(cu_count(c.byref(count)), 'cuDeviceGetCount')
            matches = []
            for ordinal in range(count.value):
                dev = c.c_int(); name = c.create_string_buffer(256); bus = c.create_string_buffer(32)
                check(cu_get(c.byref(dev), ordinal), 'cuDeviceGet')
                check(cu_name(name, len(name), dev), 'cuDeviceGetName')
                check(cu_pci(bus, len(bus), dev), 'cuDeviceGetPCIBusId')
                if name.value.decode() == EXPECTED_DEVICE:
                    matches.append(bus.value.decode().lower())
            if len(matches) != 1: raise RuntimeError('expected exactly one matching NVIDIA device')
            rtc = c.c_int(); check(count_rt(c.byref(rtc)), 'cudaGetDeviceCount')
            ordinals = []
            for ordinal in range(rtc.value):
                bus = c.create_string_buffer(32)
                check(pci_rt(bus, len(bus), ordinal), 'cudaDeviceGetPCIBusId')
                if bus.value.decode().lower() == matches[0]: ordinals.append(ordinal)
            if len(ordinals) != 1: raise RuntimeError('CUDA runtime PCI identity mismatch')
            check(set_device(ordinals[0]), 'cudaSetDevice')
            check(create(c.byref(handle)), 'cublasCreate_v2')
            check(math_mode(handle, 2), 'cublasSetMathMode(PEDANTIC)')
            ver = c.c_int(); check(version(handle, c.byref(ver)), 'cublasGetVersion_v2')
            report['device'] = {'name': EXPECTED_DEVICE, 'pciBusId': matches[0], 'runtimeOrdinal': ordinals[0]}
            report['cublasVersion'] = ver.value
            alpha, beta = c.c_float(1), c.c_float(0)
            for ident, n, paths, byte_count in specs:
                a, b = (p.read_bytes() for p in paths)
                host_a = c.create_string_buffer(a, byte_count); host_b = c.create_string_buffer(b, byte_count)
                record = {'id': ident, 'size': n, 'inputSha256': [hashlib.sha256(x).hexdigest() for x in (a, b)], 'trials': []}
                report['cases'].append(record)
                for iteration in range(warmups + reps):
                    host_out = c.create_string_buffer(byte_count)
                    allocated = []
                    started = time.perf_counter_ns()
                    failure = None
                    try:
                        for _ in range(3):
                            ptr = c.c_void_p(); check(malloc(c.byref(ptr), byte_count), 'cudaMalloc'); allocated.append(ptr)
                        da, db, dc = allocated
                        check(memcpy(da, c.cast(host_a, c.c_void_p), byte_count, 1), 'cudaMemcpy H2D A')
                        check(memcpy(db, c.cast(host_b, c.c_void_p), byte_count, 1), 'cudaMemcpy H2D B')
                        # cuBLAS is column-major: B^T * A^T yields row-major A * B.
                        check(sgemm(handle, 0, 0, n, n, n, c.byref(alpha), db, n, da, n, c.byref(beta), dc, n), 'cublasSgemm_v2')
                        check(sync(), 'cudaDeviceSynchronize')
                        check(memcpy(c.cast(host_out, c.c_void_p), dc, byte_count, 2), 'cudaMemcpy D2H')
                    except Exception as error:
                        failure = error
                    finally:
                        for ptr in reversed(allocated):
                            code = cuda_free(ptr)
                            if code != 0: cleanup_errors.append(f'cudaFree status {code}')
                    elapsed = (time.perf_counter_ns() - started) / 1_000_000
                    if cleanup_errors: raise RuntimeError('; '.join(cleanup_errors))
                    if failure: raise failure
                    if iteration >= warmups:
                        result_path = output / f'{ident}-trial-{iteration-warmups+1}.f32'
                        with result_path.open('xb') as target: target.write(host_out.raw)
                        record['trials'].append({'file': result_path.name, 'sha256': digest(result_path), 'hostElapsedMs': elapsed})
            report['status'] = 'EXECUTED_CORRECTNESS_PENDING'
    except Exception as error:
        report['error'] = str(error)
    finally:
        if handle.value and destroy is not None:
            code = destroy(handle)
            if code != 0: cleanup_errors.append(f'cublasDestroy_v2 status {code}')
        if cleanup_errors:
            report['cleanupErrors'] = cleanup_errors
            report['status'] = 'FAILED'
        with report_path.open('x', encoding='utf-8') as file:
            json.dump(report, file, indent=2); file.write('\n')
    if report['status'] != 'EXECUTED_CORRECTNESS_PENDING':
        raise SystemExit(1)

if __name__ == '__main__':
    main()
