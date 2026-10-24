# G19 J-7 — Apple reusable-project routes

**Observed:** 2026-10-16  
**Owner:** J-7 — Apple iPhone / Metal lane  
**Purpose:** Reuse proven upstream work without misstating platform authority or execution proof.

## Decision

An existing project can remove the need to invent a mobile inference engine. It cannot remove Apple's signing, distribution, and device-permission boundaries for a LeeWay-owned application.

The immediate official route that does not require Developer Mode is a signed App Store or TestFlight app. Apple states that Developer Mode does not affect ordinary App Store installation or TestFlight participation. Its purpose is Xcode-run and locally installed development-signed apps.

Sources:

- Apple Developer: https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device/
- Apple TestFlight overview: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/

## Route A — Immediate physical iPhone baseline: MLC Chat

**Candidate:** MLC Chat, published through Apple's App Store by the MLC project maintainer.

- App Store listing: https://apps.apple.com/us/app/mlc-chat/id6448482937
- Upstream source: https://github.com/mlc-ai/mlc-llm/tree/main/ios
- Upstream platform statement: MLC LLM documents Metal support on Apple A-series GPUs for iOS/iPadOS: https://github.com/mlc-ai/mlc-llm

The current App Store listing states it requires iOS 17.0 or later and runs downloaded models locally. The live iPhone 11 is on iOS 17.6.1, so its operating-system version meets that published minimum. The listing also warns that model viability depends on available VRAM; the iPhone 11's practical model limit remains unmeasured.

**What this can prove after a successful local run:** an already signed third-party app executed a locally downloaded model on the physical iPhone using MLC's Apple GPU route.

**What it cannot prove:** LeeWay provider identity, a LeeWay Runtime Fabric authorization, a LeeWay Formula decision, LeeWay memory provenance, command-level Metal readback, or a canonical LeeWay Veritas receipt.

## Route B — LeeWay-owned application without Developer Mode: reuse MLC through TestFlight

Fork or vendor the MLC iOS application and add a small, explicit LeeWay evidence adapter. Build and sign it through Apple distribution, upload to App Store Connect, and install it through TestFlight. Apple documents that TestFlight distributes uploaded beta builds to invited testers and that builds need provisioning profiles containing the application identifiers.

This removes the **iPhone Developer Mode** dependency for installation. It still requires a valid Apple developer team, signing/provisioning, an App Store Connect app record, and a macOS/Xcode or equivalent Apple-supported build/upload route. Apple permits build upload through Xcode, Swift Playgrounds, Transporter, or `altool`; it also supports automation through its App Store Connect API.

Source: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/

**Required evidence adapter:** record the selected model artifact digest, runtime version, actual execution backend, observation ID, output digest, and any CPU fallback. The app must mark results `UNVERIFIED` unless the receipt verifier accepts the binding. A generic MLC success screen is not sufficient for G19 acceptance.

## Route C — reusable component stack: ExecuTorch + Hugging Face artifacts

ExecuTorch provides Apple Swift/Objective-C frameworks and identifies Core ML and experimental MLX as iOS acceleration paths. It also directs users to selected pre-exported artifacts on Hugging Face, but requires the model configuration, precision, target backend, and runtime to match.

- Runtime and supported iOS backends: https://github.com/pytorch/executorch
- Existing-artifact boundary: https://github.com/pytorch/executorch/blob/main/docs/source/getting-started.md

This is appropriate when the target model is a supported PyTorch/Hugging Face architecture. It is not the strongest first choice for an explicit **GPU** acceptance gate, because Core ML can choose CPU, GPU, or Neural Engine. Hardware attribution must be measured inside the app; it cannot be assumed from the framework name.

## Route D — llama.cpp SwiftUI sample

The upstream sample is a valid reusable local-inference starting point for an iPhone, but direct deployment still requires an Xcode build and run. It therefore does not resolve the present Developer Mode gate unless it is distributed through TestFlight or the App Store.

Source: https://github.com/ggml-org/llama.cpp/tree/master/examples/llama.swiftui

## Chosen order of work

1. Use **MLC Chat from the App Store** as the immediate physical-device and local-model baseline, with a small model first.
2. Treat a successful baseline as **third-party local Metal evidence only**.
3. Reuse MLC's iOS source for the LeeWay provider rather than writing an inference engine from scratch.
4. Deliver that provider through TestFlight to avoid a Developer Mode dependency, while adding the governed evidence adapter and G19 acceptance tests.

## G19 continuation — MLC Chat installed; model route resolved

The Creator reports that MLC Chat is now installed on the physical iPhone 11 and authorizes an in-app model download. The iPhone is now USB-connected, and current signed-app inventory directly confirms the baseline application:

- Bundle identifier: `mlc.Chat`
- Display name: `MLCChat`
- Version: `1.6`
- Signing identity: `Apple iPhone OS Application Signing`
- The supported-device list includes `iPhone12,1`, the connected iPhone 11.
- Dynamic app storage: `925,696` bytes at inspection time.
- Static app storage: `1,858,756,608` bytes.

The small dynamic-storage measurement is consistent with no downloaded model weights, but does not prove the absence of every app-managed cache. The upstream MLC iOS package configuration at commit `8978ea9aec626d64096aaa92fbc89bda2e3ea802` lists Llama 3.2 3B Instruct Q4, Gemma 2 2B IT Q4, Phi 3.5 Mini Instruct Q4, Qwen3 0.6B Q0, and Qwen3 1.7B Q4. It declares approximately 3.0 GB estimated runtime VRAM for every listed choice, including Qwen3 0.6B.

The supported Windows request for MLC Chat's shared Documents area returned `InstallationLookupFailed`. The app exposes no usable file-sharing container to this trusted Windows connection, and its private storage was not accessed. Therefore, the only supported way to obtain a local model for the existing signed application is through MLC Chat's own interface.

The correct first model is **Qwen3 0.6B Q0** if that option appears. It has the smallest parameter count in MLC's current iPhone catalog, but its 3.0 GB package estimate remains close to the practical memory limit of an iPhone 11 and must be observed rather than assumed to fit. In MLC Chat, choose Qwen3 0.6B Q0, allow its download to finish, then send a short prompt such as `Reply exactly: LeeWay MLC local test.`

After that on-device interaction, J-7 can rerun signed-app inventory and record the selected model, output, and any model-load or memory error. A successful chat establishes third-party local MLC execution; it does not establish a LeeWay Metal command receipt.

No model download, chat response, GPU execution, or Apple device setting change is claimed in this continuation.

## Superseding creator direction — LeeWay-owned runtime only

The Creator rejected MLC Chat as a LeeWay runtime dependency. That correction is accepted. MLC Chat, its application bundle, model packages, memory entitlements, branding, and execution results are not part of the LeeWay provider. Any earlier reference to an MLC-based LeeWay provider is superseded.

The approved direction is to study public implementation patterns and build a LeeWay-owned Apple application: its own bundle identifier, signing team, Metal execution provider, model format and loader, tokenizer, Formula authorization verifier, Runtime Fabric binding, and Veritas receipt boundary. Upstream projects may be examined as technical references, but are not an authority and cannot make a LeeWay inference claim.

`native/apple/LeeWayEdgeApple/` now stages that independent foundation. It has a direct public-Metal compute/readback probe and a fail-closed Formula-authorized runtime interface. It contains no MLC source or binary. It is source-staged only; a macOS/Xcode build, TestFlight installation, physical iPhone readback, independent receipt verification, and a LeeWay-owned model runtime are still required before any mobile inference claim.
