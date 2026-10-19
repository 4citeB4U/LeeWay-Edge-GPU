import SwiftUI
import Metal
@main
struct LeeWayGPUAppleApp: App {
    var body: some Scene { WindowGroup { GPUReadbackView() } }
}
struct GPUReadbackView: View {
    @State private var report = "NOT_EXECUTED: launch on iPhone"
    var body: some View {
        VStack(spacing: 20) {
            Text("LeeWay GPU Apple").font(.title).bold()
            Text("Physical GPU: " + (MTLCreateSystemDefaultDevice()?.name ?? "Unavailable"))
            Button("Run native Metal probe") { report = MetalReadback.execute() }
            Text(report).font(.system(.body, design: .monospaced)).textSelection(.enabled)
            Text("Not a local AI model inference test").font(.caption)
        }.padding()
    }
}
enum MetalReadback {
    static func execute() -> String {
        guard let device = MTLCreateSystemDefaultDevice(),
              let queue = device.makeCommandQueue(),
              let library = device.makeDefaultLibrary(),
              let fn = library.makeFunction(name: "leeway_probe"),
              let pipeline = try? device.makeComputePipelineState(function: fn),
              let buffer = device.makeBuffer(length: 256 * MemoryLayout<UInt32>.stride, options: .storageModeShared),
              let cb = queue.makeCommandBuffer(),
              let encoder = cb.makeComputeCommandEncoder()
        else { return "BLOCKED: Metal pipeline unavailable" }
        encoder.setComputePipelineState(pipeline)
        encoder.setBuffer(buffer, offset: 0, index: 0)
        encoder.dispatchThreads(MTLSize(width: 256, height: 1, depth: 1), threadsPerThreadgroup: MTLSize(width: min(64, pipeline.maxTotalThreadsPerThreadgroup), height: 1, depth: 1))
        encoder.endEncoding()
        cb.commit()
        cb.waitUntilCompleted()
        guard cb.status == .completed else { return "FAIL: command did not complete" }
        let ptr = buffer.contents().bindMemory(to: UInt32.self, capacity: 256)
        let mismatches = (0..<256).filter { ptr[$0] != UInt32($0 * 3 + 7) }.count
        return "backend=APPLE_METAL;lanes=256;mismatches=\(mismatches);state=\(mismatches == 0 ? "PASS" : "FAIL")"
    }
}