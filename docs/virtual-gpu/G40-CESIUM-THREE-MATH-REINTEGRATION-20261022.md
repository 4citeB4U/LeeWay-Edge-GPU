<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.G40.ORIGINAL_MATH_PROVIDERS
TAG: LEEWAY.G40.CESIUM_THREE_SOURCE_REUSE_BEFORE_BUILD
5WH:
WHAT = Recover original CesiumJS and Three.js mathematics omitted from G23-G39 standalone compute acceptance.
WHY = Pure matmul and Formula state are not the complete LeeWay geometry/spatial mathematical toolkit.
WHO = LeeWay creator-authorized research; no production signer or policy promotion.
WHERE = LeeWay-Edge-GPU/docs/virtual-gpu/G40-CESIUM-THREE-MATH-REINTEGRATION-20261022.md
WHEN = 2026-10-22
HOW = Original GitHub source audit and independent live mathematics probes on Agent-Lee workstation.
LICENSE: MIT (report only; library licenses apply separately)
-->
# G40 — Original CesiumJS and Three.js mathematics: recovered, NOT yet integrated

## Correct architecture and false equivalences

LeeWay has at least **three distinct original mathematical capabilities**:
(1) Golden Formula v1, a frozen 16×6 evaluation engine and canonical adapter;
(2) LeeWay software worker, currently demonstrated on dense Float32
matrix multiplication through LDWMD HOST_RAM; and
(3) spatial / computational-geometry operations implemented by CesiumJS
and Three.js across **other original LeeWay repositories**.

These capabilities are not identical, and no source evidence supports
claims that Cesium or Three is called by the immutable Formula v1
arithmetic implementation or by the current G36 matrix multiplication.
Never add an unconditional browser/WebGL/GPU requirement to Formula
or claim Cesium/Three themselves constitute an OS-enumerated GPU.

## CesiumJS: real original mathematical provider

Original source:
[Leeway-Maps spatial engine](https://github.com/4citeB4U/Leeway-Maps/blob/ba492f3f1e9a7b65c04dae28e318495e14775bf3/src/spatial/cognitiveSpatialEngine.js)

Exports `measureRelation(anchor,target)` and
`analyzeSpatialState({anchor,targets,route})` and identifies as
`leeway-maps-cesium-spatial-v1`. Uses actual CesiumJS WGS84
`EllipsoidGeodesic`, `Cartographic`, `Cartesian3`,
`Transforms.eastNorthUpToFixedFrame`, matrix inverse, surface
and slant distance, heading, altitude delta, local east/north/up
coordinates and cumulative route distance. The original repository
includes three numerical/invariant tests in
`src/spatial/cognitiveSpatialEngine.test.mjs`.

**Live executed on Agent-Lee Windows laptop:** Using existing installed
CesiumJS 1.138.0 from the LeeWay Maps checkout, direct original
Cesium classes (not the original LeeWay wrapper) returned:
- WGS84 one-degree equatorial geodesic **111319.4907932264 m**.
- Straight ECEF chord **111318.07788798446 m**.
- ENU east offset **111313.83923667614 m**.
- Geodesic range invariant PASSED. No GPU used.
- Local Maps checkout `d35183c` is dirty and does not include
  the source `src/spatial/cognitiveSpatialEngine.js`; the reviewed
  original file is available at the linked GitHub revision. Do NOT
  overwrite local maps work merely to obtain that file. Hence the
  original wrapper was NOT executed on the laptop in this test.

## Three.js: original LeeWay computational geometry, not only rendering

Original sources:
- [Agent Lee geometry presets](https://github.com/4citeB4U/agentx23/blob/30d4748696a28f964abf26978b2a34379e4594b3/.Agent_Lee_OS/src/utils/presets.ts)
- [Agent Lee mesh surface sampler](https://github.com/4citeB4U/agentx23/blob/30d4748696a28f964abf26978b2a34379e4594b3/.Agent_Lee_OS/src/utils/sampler.ts)

The presets source uses actual `Matrix4` affine transformations,
`BufferGeometry.applyMatrix4`, merging geometry,
`Box3.getCenter`, centering and `computeVertexNormals`.
The sampler source uses `MeshSurfaceSampler`, `Vector3`
and `Float32Array` to obtain geometry-dependent sample coordinates.
These are true mathematical operations, even when consumed by
visualization. The existing LeeWay GPU Diagnostics page also imports
Three.js for 3D vectors and display geometry; its renderer is not
evidence of a GPU compute execution provider.
The former `LeeWayUniverse.tsx` explicitly says its Three.js
imports were removed, so it must NOT be counted as an active Three
compute engine.

**Live executed on Agent-Lee Windows laptop:** Three.js 0.186.1
installed **offline from existing npm cache into a temporary isolated
directory**, without changing product dependencies or dirty repositories.
Direct Three classes returned:
- Matrix4+Vector3 affine transform [2,0,0] -> **[4,7,6]** PASS.
- BoxGeometry translate and bounding box min **[0,1,2]**,
  max **[2,3,4]** PASS; 36 non-indexed box triangle vertices.
- Vertex normals recalculated and MeshSurfaceSampler yielded finite 3D
  coordinates PASS.
- This is an authentic **Three library mathematical proof**, NOT execution
  of the original agentx23 TypeScript functions, not yet an endorsed
  software-GPU geometry kernel, and not a Formula state computation.

## Separate MC-G9 shadow lane must remain truthfully isolated

The [canonical Formula repository's Cesium spatial-context specification](https://github.com/4citeB4U/Leeway-formula-live/blob/a1d59f78b7ef43ea1529ebaa787958b6484ea442/docs/machine-consciousness/11-CESIUM-SPATIAL-CONTEXT-v0.md)
records Cesium Maps telemetry as `SHADOW_ONLY`, using the mapping
`personal-map-spatial-density-v0`. That lane has six **different
measurements** (visible candidates, moving subjects, transit route
deviation, labels, p95 frame time, interaction latency). Its four
original local tests passed, but the October 4 live trace had
**zero complete 16×6 spatial windows** because transit deviation
was unavailable. Its actual spatial Formula state was
`NOT_EXECUTED`, policy authority false. It must not be
silently used to approve geometry/GPU work or zero-fill missing data.

## Mandatory new mathematical capability gates

| Feature gate | Existing source status | Minimum meaningful qualification |
| --- | --- | --- |
| G40-M01 Cesium WGS84 spatial relation | Original source FOUND, direct Cesium library test PASS | Source-pin actual Leeway-Maps provider, invoke its original functions; finite/range/unit and independent geodesic/ENU oracles; bind typed output and provenance to one request |
| G40-M02 Three mesh geometry | Original source FOUND, direct Three library test PASS | Source-pin actual agentx23 geometry and sampling functions, deterministic seeded sampling where required, compare transform, surface and bounding invariants; no rendering-state-only proof |
| G40-M03 original 16×6 spatial observation map | Original MC-G9 SHADOW structural tests PASS only | 16 complete real traces and approved mapping/policy if promoting to Formula scheduling; separate from standalone geometry math |
| G40-M04 governed optional compute operation | NOT IMPLEMENTED | Operator whitelist, explicit library/runtime source closure, LDWMD memory accounting, signed Veritas PRE/POST, durable result, Receipt and Learning Ledger same-request proof |
| G40-M05 integrated public GPU API/SDK | NOT IMPLEMENTED | Real `spatial.wgs84-relation` and `geometry.mesh-transform` opt-in client calls with backend provenance and numeric output; no generic arbitrary app/adapter claim |

Do not rewrite the canonical Frozen Formula or conflate
`Cesium.Cartesian3` geospatial ECEF with Three.js's generic
local scene coordinates. Define units, WGS84/ECEF/ENU vs model-local
reference frames, floating point precision and origin-shifting
rules explicitly at their boundary.

**Actual G40 result: ORIGINAL MATH REUSED IN SOURCE INVENTORY;
BOTH LIBRARIES' STANDALONE MATH PROBED; NOT INTEGRATED INTO GOVERNED
GPU SERVICE AND NOT PRODUCTION-CERTIFIED.**

See the companion JSON provider catalog for precise evidence status.
