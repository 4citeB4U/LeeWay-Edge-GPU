import Foundation
import Metal

// Self-contained fixed-weight linear classifier: real local tensor inference, NOT an LLM.
enum TinyModelInference {
    static let inputCount = 16
    static let outputCount = 8
    static func weight(_ o: Int, _ i: Int) -> Float {
        Float(((o * 13 + i * 7) % 17) - 8) / 32.0
    }
    static func input(_ i: Int) -> Float { Float(i + 1) / 16.0 }
    static func cpu() -> [Float] {
        (0..<outputCount).map { o in
            max(0, (0..<inputCount).reduce(Float(0)) { s, i in s + weight(o, i) * input(i) })
        }
    }
    static func run() -> String {
        guard let device = MTLCreateSystemDefaultDevice(),
              let queue = device.makeCommandQueue(),
              let library = device.makeDefaultLibrary(),
              let function = library.makeFunction(name: "leeway_tiny_model"),
              let pipeline = try? device.makeComputePipelineState(function: function),
              let inputBuffer = device.makeBuffer(length: inputCount * MemoryLayout<Float>.stride, options: .storageModeShared),
              let weightBuffer = device.makeBuffer(length: outputCount * inputCount * MemoryLayout<Float>.stride, options: .storageModeShared),
              let outputBuffer = device.makeBuffer(length: outputCount * MemoryLayout<Float>.stride, options: .storageModeShared)
        else { return "BLOCKED: Metal model pipeline unavailable" }
        let ip = inputBuffer.contents().bindMemory(to: Float.self, capacity: inputCount)
        let wp = weightBuffer.contents().bindMemory(to: Float.self, capacity: outputCount * inputCount)
        for i in 0..<inputCount { ip[i] = input(i) }
        for o in 0..<outputCount {
            for i in 0..<inputCount { wp[o * inputCount + i] = weight(o, i) }
        }
        let expected = cpu()
        let start = DispatchTime.now().uptimeNanoseconds
        guard let cb = queue.makeCommandBuffer(), let enc = cb.makeComputeCommandEncoder() else {
            return "BLOCKED: model command allocation failed"
        }
        enc.setComputePipelineState(pipeline)
        enc.setBuffer(inputBuffer, offset: 0, index: 0)
        enc.setBuffer(weightBuffer, offset: 0, index: 1)
        enc.setBuffer(outputBuffer, offset: 0, index: 2)
        enc.dispatchThreads(MTLSize(width: outputCount, height: 1, depth: 1),
                            threadsPerThreadgroup: MTLSize(width: min(outputCount, pipeline.maxTotalThreadsPerThreadgroup), height: 1, depth: 1))
        enc.endEncoding()
        cb.commit()
        cb.waitUntilCompleted()
        let durationNs = DispatchTime.now().uptimeNanoseconds - start
        guard cb.status == .completed else { return "FAIL: GPU classifier command not completed" }
        let op = outputBuffer.contents().bindMemory(to: Float.self, capacity: outputCount)
        let diffs = (0..<outputCount).map { abs(op[$0] - expected[$0]) }
        let maxError = diffs.allSatisfy { $0.isFinite } ? (diffs.max() ?? .infinity) : .infinity
        return "model=FIXED_LINEAR_RELU_16x8\nbackend=APPLE_METAL\noutputs=8\nmax_abs_error=\(maxError)\nwall_ms=\(Double(durationNs) / 1e6)\nstate=\(maxError < 0.0001 ? "PASS" : "FAIL")\nNOT_LLM"
    }
}