// cpu.worker.js
self.onmessage = (e) => {
  const { A, B, size } = e.data;

  const result = new Float32Array(size * size);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      let sum = 0;
      for (let k = 0; k < size; k++) {
        sum += A[i * size + k] * B[k * size + j];
      }
      result[i * size + j] = sum;
    }
  }

  self.postMessage(result);
};
