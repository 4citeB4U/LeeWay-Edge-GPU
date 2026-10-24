# Microsoft Graphics Driver Samples — pinned upstream source

LEEWAY HEADER — DO NOT REMOVE

- Upstream project: `microsoft/graphics-driver-samples`
- Pinned source commit: `de4a2161991eda254013da6c18226f5ea06e4a9c`
- Material included: upstream `compute-only-sample/` and original `license.txt` (MIT).
- Purpose: source reference and auditable starting point for a real LeeWay compute-only Windows driver, avoiding recreation of Microsoft graphics-kernel DDIs.
- LeeWay creator retains authority over *first-party LeeWay changes*, not copyright ownership of Microsoft's pre-existing reference source.

The upstream source remains unmodified here. The WDK configuration in its original project files is old. It is **not** the production LeeWay driver; the `cosdriver/cos.inf` ACPI device ID must never be installed as the LeeWay GPU, and no included source should be signed/released without review.

Check the pinned source SHA-256s, license, source-only state and representative KMD/UMD files with:

```powershell
node --test native/windows/mcdm/source-contract.test.mjs
```

See `native/windows/mcdm/README.md` for current build blockers, target LeeWay command/memory integration and full driver release gates.
