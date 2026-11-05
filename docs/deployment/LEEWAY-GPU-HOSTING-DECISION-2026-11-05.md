# LeeWay GPU hosting decision — 2026-11-05

**Authority:** Creator direction in the active engineering session. **Scope:** retire unused Fly.io deployment wiring and select the fastest deployment path supported by the connected LeeWay estate. **Status:** platform inventory and source changes verified; standalone hosted GPU inference remains unqualified.

## Decision

- Retire the Edge GPU repository's Fly-only deploy workflow and `fly.toml`. The old configuration ran a static file server on shared CPU (1 CPU, 256 MB) and could not provide the LeeWay GPU inference runtime.
- Keep the already-used Vercel projects for LeeWay web/control-plane and bounded catalog/API surfaces. Vercel is the shortest existing path for these serverless roles. A Vercel deployment marked READY is not proof of GPU hardware, model residency, or a complete governed inference.
- Do not route inference to Railway or Cloudflare hosted AI. Railway's official documentation says it does not offer GPU instances. The connected Railway production project currently has only a sleeping MySQL service and a 500 MB volume; neither is the Continuum authority.
- Cloudflare may be used later for DNS, edge routing, or protection when an existing LeeWay route requires it. The connected account currently lists no deployed Workers. Do not add Workers AI, Cloudflare storage, or another inference/database authority.
- Keep LeeWay GPU as the sole inference identity and Continuum as the sole durable storage/database authority. No user PC, `pc-primary`, external model inference, Railway MySQL, or alternate object store is part of the standalone inference path.

## Inventory evidence

| Platform | Observed account/project state | Decision |
| --- | --- | --- |
| Vercel | LeeWay Runtime Fabric, Model Hub, and Device Bridge projects exist. Latest deployment objects were READY; Runtime Fabric and Model Hub project objects also reported `live:false`. Model Hub has SSO protection. | Reuse for existing UI, catalog, and control-plane routes only; independently verify the exact production alias and route before relying on it. |
| Railway | Project `heroic-tenderness`, production environment: one `MySQL` service in SLEEPING state, one 500 MB volume; no GPU or Continuum service. | Not an inference host and not the Continuum database. |
| Cloudflare | One authenticated account; `GET /workers/scripts` returned an empty list. | No current Worker deployment to reuse. Optional edge/DNS role only after an actual route is identified. |
| Fly.io | Repository had `fly.toml` declaring shared CPU, one core, and 256 MB memory plus a main-branch deploy workflow. The recorded GitHub run failed because `FLY_API_TOKEN` was empty; successful deployment is not evidenced. | Removed from active deployment wiring. Historical references remain only in append-only evidence. |

## Required qualification before GPU hosting

A deployment host is eligible for the LeeWay GPU runtime only when it proves real LeeWay-owned accelerator execution and can bind the existing Runtime Fabric authorization, Formula decision, LDWMD memory admission, Model Hub model identity/residency, Continuum persistence/readback, Veritas result decision, and canonical receipt/learning chain. A static website, CPU container, catalog record, READY deployment, or provider capability statement cannot satisfy these gates.

The connected hosting inventory did not identify an already-provisioned qualified accelerator runtime. Therefore this change removes the incorrect Fly path and selects Vercel for existing control/catalog workloads; it does not claim or deploy a GPU inference service. No new provider, paid resource, secret, database, model, or device connection was provisioned.

## Source references

- [Railway unsupported workloads](https://docs.railway.com/platform/use-cases#unsupported-use-cases)
- [Railway AI agent workers](https://docs.railway.com/guides/ai-agent-workers)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

## Rollback and next gate

Rollback only if the retired workflow is later proven necessary for a currently authorized non-GPU workload: revert the specific source commit after reviewing its effects. Do not restore Fly for LeeWay GPU inference. The next executable step is to identify an existing LeeWay-owned hosted accelerator and Continuum service pair from their canonical repositories and deployment records; then qualify those service bindings before deploying or advertising inference.