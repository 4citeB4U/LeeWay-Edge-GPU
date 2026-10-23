"""Comparison fixtures and an independent CPU float64 oracle; outside LeeWay's measured path."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--output-dir', required=True)
parser.add_argument('--sizes', default='256,512,1024,2048')
args = parser.parse_args()
sizes = [int(value) for value in args.sizes.split(',')]
if not 1 <= len(sizes) <= 6 or len(set(sizes)) != len(sizes) or any(n < 1 or n > 2048 for n in sizes):
    raise ValueError('Require 1..6 distinct square sizes, each 1..2048')
root = Path(args.output_dir).resolve()
root.mkdir(parents=True, exist_ok=True)
manifest = {'schema': 'leeway.dense-challenge.fixtures.v1', 'repetitions': 3, 'warmups': 1,
            'dtype': 'FLOAT32_ROW_MAJOR', 'distribution': 'DENSE_NONZERO_UNIFORM_VALUES_-2_-1_1_2',
            'reference': 'INDEPENDENT_NUMPY_CPU_FLOAT64_MATMUL_CAST_FLOAT32',
            'numpyVersion': np.__version__, 'cases': []}
digest = lambda value: hashlib.sha256(value).hexdigest()
for n in sizes:
    ident = f'dense-{n}'
    seed = 20261022 + n
    rng = np.random.default_rng(seed)
    choices = np.array([-2, -1, 1, 2], dtype='<f4')
    a = choices[rng.integers(0, 4, size=(n, n))]
    b = choices[rng.integers(0, 4, size=(n, n))]
    expected = (a.astype(np.float64) @ b.astype(np.float64)).astype('<f4')
    if not np.isfinite(expected).all():
        raise ValueError('Independent reference returned non-finite output')
    files = {}
    hashes = {}
    for key, array in [('a', a), ('b', b), ('reference', expected)]:
        file_path = root / f'{ident}-{key}.f32'
        raw = array.tobytes(order='C')
        with file_path.open('xb') as stream:
            stream.write(raw)
        files[key + 'Path'] = str(file_path)
        hashes[key + 'Sha256'] = digest(raw)
    manifest['cases'].append({'id': ident, 'size': n, 'seed': seed, **files, **hashes,
                              'scalarMultiplies': n**3, 'nominalFlops': 2*n**3,
                              'correctness': 'EXACT_FLOAT32_EQUALITY_FOR_BOUNDED_INTEGER_FIXTURE'})
with (root / 'fixtures.json').open('x', encoding='utf-8') as stream:
    json.dump(manifest, stream, indent=2)
    stream.write('\n')
print(json.dumps({'fixtures': len(sizes), 'manifest': str(root / 'fixtures.json')}))
