# LeeWay Apple GPU — third-party application qualification

REGION: GPU.APPLE.INTEGRATION
TAG: GPU.APPLE.OPTIN.QUALIFICATION
WHAT: Qualify a user-controlled Apple GPU service without claiming OS-wide interception.
WHY: Third-party applications require explicit platform-supported integration and independently verified execution.
WHO: LeeWay GPU / Device Bridge / Runtime Fabric owners; Apple-native changes reviewed by Apple lane J-7.
WHERE: LeeWay-Edge-GPU/native/apple
WHEN: 2026-10-19
HOW: Inspect -> platform qualification -> app opt-in -> signed admission -> physical GPU -> Veritas receipt.

## Authority and current state

The existing physical Apple Metal probe and tiny neural sample are local execution demonstrations. The iOS app's `Use LeeWay GPU for this app` control is **local-only**, defaults OFF, and gates those demonstrations. It neither redirects other applications nor grants Formula/LDWMD/Veritas authorization. No native Apple driver or macOS interception service is installed by this branch.

The canonical Device Bridge owns authenticated device/app identity, Runtime Fabric owns routing and trusted policy, the verified Formula owns workload selection, LDWMD owns memory admission, the Metal service owns physical execution, Continuum owns persistence, and Veritas independently admits evidence. A local toggle grants none of these capabilities.

## Coverage matrix

| Target | Mechanism | Current qualification |
| --- | --- | --- |
| LeeWayGPU iPhone app local demonstrations | SwiftUI per-app `@AppStorage` opt-in, default OFF; guard both local buttons | SOURCE IMPLEMENTED; macOS CI build, physical iPhone and on-device OFF/ON/OFF tests pending |
| Other LeeWay iOS applications | App-owned integration through approved Device Bridge/App Intents or an explicitly embedded client | NOT CONNECTED |
| Third-party iOS applications | Developer-provided integration through public Apple APIs, app-specific consent and the canonical service | NOT CONNECTED; general system-wide GPU interception not available to ordinary apps |
| Cooperating macOS applications | Explicit opt-in SDK/plugin/helper service with appropriately signed identity, consent and Runtime Fabric admission | PROPOSED; no qualified Mac runtime installed |
| Unmodified unrelated macOS applications | Arbitrary Metal call interception or replacement | BLOCKED pending separate Apple-platform feasibility, entitlement, security and reproducible proof; never infer from DriverKit presence |
| OS-wide virtual GPU driver | Separately approved and technically proven Apple graphics-driver integration | UNVERIFIED; do not create a counterfeit MTLDevice or claim universal support |

## Mandatory user semantics

- **OFF (default):** LeeWay-owned local demonstrations refuse to dispatch. Original Apple/third-party workloads are unchanged.
- **ON:** only an *explicitly supported and authorized workload* may use LeeWay GPU; the local example allows running its standalone Metal demonstration, not canonical work.
- **No compatible client:** report `NOT_CONNECTED`, not `ACTIVE`.
- **No trusted Device Bridge grant, Formula verdict, memory lease or Veritas pre-gate:** deny canonical GPU dispatch even when ON.
- Revocation, expired grant, wrong application/device, replay, STOP and lack of a valid execution receipt must fail closed.

## Next acceptance gates

1. Run the source regression tests and unsigned iPhone build on GitHub macOS; record exact commit/run and digest.
2. Verify the physical installed LeeWayGPU app still matches its source/package and test the OFF -> ON -> OFF user interaction without altering other app behavior.
3. Connect an actual authenticated Device Bridge request to the GPU service under Runtime Fabric pre-gate and canonical Formula and LDWMD admission.
4. Qualify one third-party-compatible adapter **only for a consenting participating application**. Capture request ID, binary identity, consent, physical dispatch/readback, and independent Veritas acceptance.
5. Qualify a separate macOS integration branch against a real Mac and Apple's signing/entitlement model before advertising Mac support.
6. Preserve Apple lane ownership and fail closed until each per-app capability is independently qualified.

This file is a scope and acceptance contract, not a Veritas receipt, production driver, GPU benchmark, or Learning Ledger event.
