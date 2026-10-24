# G19 J-7 review of J-5 Diagnostics projection

## Disposition

J-7 acknowledges the projection's fail-closed framing and its explicit EVIDENCE_CALLBACK_ACCEPTED status. The combined G18/G19 contract command passed **29/29**. The projection is still source-only and unconnected to the live Diagnostics Matrix or Digital Brain. No model was executed.

## Confirmed safeguards

- Missing claim, authority, evidence, or model returns UNVERIFIED.
- CPU fallback, mismatched device/observation/model digest, absent verifier, and non-true synchronous verifier result prevent callback acceptance.
- Physical GPU and LeeWay provider are separate output fields; osNativeAdapter remains false.
- Unmeasured VRAM remains null unless a claimed memory source equals LDWMD_VERIFIED and the callback accepts the claim.

## Review findings to close before live wiring

1. **Model ID can be omitted.** The alignment condition checks claim.modelId === model.id without requiring either value to be nonempty or binding a model ID in evidence. A probe with both fields absent reached EVIDENCE_CALLBACK_ACCEPTED.
2. **Physical GPU provenance is not bound into the verifier call.** physicalGpu.name, manufacturer, and observation source are only nonempty caller strings. The callback receives (evidence, claim, authorization); it is not passed the projected GPU observation. A probe using an invented GPU identity and callback ()=>true reached EVIDENCE_CALLBACK_ACCEPTED. The output does not say PASS, but this is insufficient to populate a trusted hardware lane.
3. **VRAM provenance is only a caller flag and count.** Setting memoryMeasurementSource='LDWMD_VERIFIED' plus any nonnegative safe integer emits that VRAM amount when the generic callback returns true. No dedicated allocation receipt/hash, lease/allocation ID, timestamp/freshness, device/model binding, or adapter-capacity check is required. A probe caused 999999999 bytes to appear in the callback-accepted projection.
4. **Authority fields are booleans.** Formula, Runtime Fabric, Device Bridge, LDWMD, Continuum, and Veritas are represented as caller-supplied 	rue values. The canonical verifier must bind actual request-scoped receipts; this projection itself does not.
5. A Promise-returning verifier is fail-closed (UNVERIFIED), as the helper requires synchronous literal 	rue.

These probes do not show a live false PASS: the projection returns EVIDENCE_CALLBACK_ACCEPTED, and no production UI consumes it. They show that the contract cannot independently qualify the facts it projects. Before live integration, bind verified physical GPU provenance and an LDWMD allocation receipt to the same request/model/device/observation, require a model ID, and keep the output unverified until canonical Veritas verifies that envelope.

Machine-readable probes and source hashes: `evidence-staging/native-gpu-readiness-g19/diagnostics-projection-j7-review.json`, SHA-256 `04685b4c15666d58ff3850caf65cd348d7d071021b81b9ce4d019d31d3e42e0b`.
