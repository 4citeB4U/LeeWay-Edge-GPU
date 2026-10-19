import SwiftUI
import Metal
@main
struct LeeWayGPUAppleApp: App {
    var body: some Scene { WindowGroup { GPUReadbackView() } }
}
struct GPUReadbackView: View {
    // Local consent is scoped to this app. It does not grant third-party or
    // canonical Runtime Fabric GPU execution authority.
    @AppStorage("leeway.apple.gpu.localOptIn.v1") private var localOptIn = false
    @State private var report = "NOT_EXECUTED: launch on iPhone"

    private func runLocalMetalProbe() {
        guard localOptIn else {
            report = "BLOCKED: LeeWay GPU local opt-in is OFF"
            return
        }
        report = MetalReadback.execute()
    }

    private func runTinyLocalModel() {
        guard localOptIn else {
            report = "BLOCKED: LeeWay GPU local opt-in is OFF"
            return
        }
        report = TinyModelInference.run()
    }

    var body: some View {
        ScrollView {
        VStack(spacing: 20) {
            Text("LeeWay GPU Apple").font(.title).bold()
            Text("Physical GPU: " + (MTLCreateSystemDefaultDevice()?.name ?? "Unavailable"))
            Toggle("Use LeeWay GPU for this app", isOn: $localOptIn)
                .accessibilityIdentifier("leeway.apple.gpu.local-opt-in")
            Text(localOptIn
                 ? "ON: this app may run local Metal demonstrations."
                 : "OFF: this app will not dispatch LeeWay local Metal demonstrations.")
                .font(.caption)
            Text("Third-party apps: NOT CONNECTED. This switch does not redirect other apps or replace Apple's GPU driver.")
                .font(.caption2).foregroundStyle(.secondary)
            Button("Run native Metal probe") { runLocalMetalProbe() }
            Text(report).font(.system(.body, design: .monospaced)).textSelection(.enabled)
            Button("Run tiny local neural model") { runTinyLocalModel() }
            Text("Tiny classifier is not a language model").font(.caption)
            LeeWayEcosystemView()
        }.padding()
        }
        .onChange(of: localOptIn) { _, enabled in
            if !enabled {
                report = "NOT_EXECUTED: LeeWay GPU local opt-in is OFF"
            }
        }
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