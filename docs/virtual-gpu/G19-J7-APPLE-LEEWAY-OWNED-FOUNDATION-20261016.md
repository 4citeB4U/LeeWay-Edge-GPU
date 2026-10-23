# G19 J-7 — LeeWay-owned Apple foundation

**Recorded:** 2026-10-16  
**Owner:** J-7 — native Apple implementation  
**State:** source staged; native build and iPhone execution not yet performed.

## Creator decision applied

The LeeWay Apple provider must not rely on MLC Chat. MLC's public material may be studied as engineering reference, but no MLC Chat app, source, binary, model package, entitlement, brand, or execution claim is part of this implementation.

The staged provider is wholly named and bounded as `LeeWayEdgeApple`. It treats the device's `MTLDevice.name` as the physical Apple GPU observation and does not present it as a LeeWay graphics adapter.

## Source staged

Root: `native/apple/LeeWayEdgeApple/`

| Component | Purpose |
| --- | --- |
| `MetalComputeProbe.swift` + `LeeWayProbe.metal` | Public-Metal device lookup, deterministic compute dispatch, command completion, and independent CPU readback. |
| `LeeWayAppleEvidence.swift` | Separates local observation from canonical verification. A zero-mismatch readback remains `LOCAL_READBACK_PASSED_PENDING_RECEIPT`. |
| `FormulaAuthorizedLocalRuntime.swift` | LeeWay-owned runtime contract. The only implementation is `LeeWayRuntimeNotInstalled`, which rejects model execution. |
| `EvidenceView.swift` | Shows the execution provider and separately observed physical Metal device. |
| `BUILD-ON-MAC.md` | Apple signing, Xcode, and TestFlight procedure for the LeeWay-owned app. |
| `THIRD_PARTY_BOUNDARY.md` | Records that third-party materials are studied only, with no admitted dependency. |

## Static source review

The staged source was inspected for the necessary direct-Metal calls:

- `MTLCreateSystemDefaultDevice`
- `makeCommandQueue`
- `makeComputeCommandEncoder`
- `waitUntilCompleted`

The source directory contains no `MLC`, `llama`, `ExecuTorch`, or `MLX` reference. This is a source-boundary result, not an iOS compilation or execution result.

## Source integrity inventory

| File | SHA-256 |
| --- | --- |
| `BUILD-ON-MAC.md` | `2C7BA6D4AE4519B43D09B2C5FFEE303ECC79113AFA8F19BDCCA0CDB57078BED9` |
| `Config/LeeWayEdgeApple.xcconfig` | `E593D95B3E11606B95A171273ACA4F19294B2E3A25521B31044B420F70E5D650` |
| `README.md` | `F6B7A123AD95F32A2537D3CD19EDF8D0B3FB3A41964D9850C56E1982225FBABA` |
| `Sources/Execution/LeeWayAppleEvidence.swift` | `AB09DA7588664EA2A229ED201CA01896B2504C28A226C0AB74118C4C802ED433` |
| `Sources/Execution/LeeWayProbe.metal` | `68DE87617C8D9D69EBD5126A93263A8EFD91EF6259AE17BEB089E41102429A50` |
| `Sources/Execution/MetalComputeProbe.swift` | `76D4B2CE763E109E613370679257EF921003DDB5507DCB4E2510662253724D9B` |
| `Sources/LeeWayEdgeAppleApp.swift` | `207A914DBA7AA59348B1E3730E966D66AF60A8B2D55BEE21BF16CA7068AF4F5B` |
| `Sources/Runtime/FormulaAuthorizedLocalRuntime.swift` | `7F5FEDD18548FAF304DA798E4ED1E3A50375884AE45BF43EBC8F7779A4BA070C` |
| `Sources/Views/EvidenceView.swift` | `8565DCD089ACA3ADB5716E36F21E2F1C40F9F4E19430301154700D4A6C325DDE` |
| `THIRD_PARTY_BOUNDARY.md` | `146FD0DB329D837C73FA5214144FB260BE7A8B3EEA16AED4E65E615891BFDC2C` |

## Gates that remain

1. Create the Xcode target under a LeeWay Apple developer team and build this source on macOS.
2. Archive and send the LeeWay-owned build to TestFlight.
3. Run the direct Metal probe on the physical iPhone and retain its actual device name, completion result, and readback mismatch count.
4. Bind independently verified Formula authorization and a canonical Runtime Fabric/Veritas receipt.
5. Implement and admit a LeeWay-owned model loader, tokenizer, tensor executor, and Metal model kernels before making an inference claim.

No Apple credentials, app installation, model download, developer-mode change, iPhone Metal dispatch, model inference, Git commit, or push occurred while recording this checkpoint.

## Apple build-host alternatives recorded 2026-10-16

A native iPhone app that uses direct Metal cannot be compiled, signed, or archived entirely on Windows. The requirement is for Apple's build toolchain to run somewhere; it is not a requirement that the Creator personally own a Mac.

| Route | What runs the Apple build | LeeWay fit | Remaining requirement |
| --- | --- | --- | --- |
| Xcode Cloud | Apple's managed macOS/Xcode workers build the LeeWay repository and archive to TestFlight. | Preferred managed route. Apple controls the build environment; LeeWay retains its source, bundle ID, and app identity. | A one-time Xcode project/workflow setup, Apple Developer Program team, App Store Connect app record, and repository connection. |
| GitHub Actions macOS runner | A transient hosted macOS runner runs Xcode and archives the LeeWay project. | Good for reproducible source-controlled builds and evidence artifacts. | The LeeWay Apple signing certificate and provisioning profile must be placed only in repository secrets; TestFlight upload still needs Apple credentials/API key. |
| Swift Playgrounds on iPad | Apple's iPad development environment can build SwiftUI app playgrounds and submit them to App Store Connect. | Possible for a smaller native LeeWay app when an iPad is available. | Metal shader/runtime integration needs a capability check before it is selected for the production provider. |
| Physical or rented remote Mac | Xcode runs on a Mac controlled by the Creator or a hosted-Mac provider. | Full control and strongest debugging route. | The Mac must be reachable and signed into the LeeWay Apple developer team. |

TestFlight and App Store Connect distribute an already archived Apple-signed build. They do not compile raw Swift/Metal source by themselves. Therefore, no indirect source can turn the Windows host into a supported native iOS Metal build host.

Primary references: Apple [upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds), [Xcode Cloud TestFlight distribution](https://developer.apple.com/documentation/xcode/distributing-your-xcode-cloud-builds-through-testflight), [Swift Playgrounds](https://developer.apple.com/documentation/swift-playgrounds), and GitHub [macOS-runner Xcode signing](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications).
