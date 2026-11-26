# P3.1.1 — Chrome trace evidence and controlled measurement proposal
2026-11-26. Derived analysis of user-provided Trace-20261126T021354.json.gz, 206643 events. Raw trace not uploaded. TracingStartedInBrowser marker to final trace event =24.538s; earlier preexisting async events excluded. Main page localhost candidate=1, profile=balanced-soft, opticalMode=gpu, no lab query; hostDPR=1.25. Actual framebuffer sizes, GPU model, power state, viewport and identical environmental state not independently verified by this trace. User supplied prior UHD630 measurements; no assumption that all conditions match.
| Series | Intervals | Rate/s | Mean ms | P50 | P95 | P99 | Max | >50ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| BeginFrame (renderer) |1471|60.00|16.667|16.669|16.800|16.875|19.108|0|
| FireAnimationFrame (renderer main) |1462|59.81|16.720|16.657|18.370|24.931|43.355|0|
| DrawFrame (renderer compositor) |1462|59.61|16.775|16.666|18.387|25.190|87.735|1|
| AnimationFrame::Presentation (unique timestamps) |1426|58.48|17.099|16.672|16.835|33.352|33.794|0|
Rate=1000/mean inter-event interval; quantiles linear interpolation. Presentation records 1459 minus 32 duplicated timestamps =1427 unique timestamps; proxy for presentation cadence, not direct monitor scanout or independently verified unique fish content. 37 intervals >25ms, 10 >33.4ms. Not identical to app RAF timestamp or P3 gate. 9 post-marker DroppedFrame records (partial update semantics); not equivalent to missed physical refreshes. Initial 86.09ms main task overlaps CpuProfiler::StartProfiling (77.7ms); initial DrawFrame gap 87.735ms; after first second callback rate 59.74, presentation 58.42; no >50ms intervals in either series. Do not ignore startup in production assessment.
| Time window | Callback rate/s | Presentation rate/s |
|---|---:|---:|
| 0–5s |59.88|58.36|
| 5–10s |59.59|55.78|
| 10–15s |59.79|58.79|
| 15–20s |60.00|59.80|
| 20–24.5s |59.77|59.78|
1462 complete FireAnimationFrame events: mean duration 2.150ms, p95 4.050, p99 8.057, max 12.102. Main thread RunTask total ~4498ms across trace (~18.3% of 24.54s; includes startup overhead); nested durations not additive. Only one recorded RunTask >50ms after start, profiler initiation. 3 major GC events sum 59.4ms, 93 minor GC sum 52.4ms; these are nested durations, not independent causal evidence. GPU process GPUTask attributed to renderer: 7939 completed events, mean .449ms, p95 1.168, max 6.814; process trace duration not GPU hardware execution. used_bytes field sampled 123.16–134.94 MiB; not independently verified VRAM residency or leak measurement. Only one RasterTask event exposed by recording categories, not evidence of absent raster cost.
## Compositor pipeline
Pair async b/e by pid/tid/name/id, exclude pre-marker starts and deduplicate identical timestamp pairs. Renderer compositor:
| Span | n | mean ms | p95 | p99 |
|---|---:|---:|---:|---:|
| Submit to receive |1460|.234|.429|.628|
| Receive to start draw |1460|13.412|17.819|24.350|
| Start draw to swap start |1461|3.822|14.899|22.864|
| Swap |1462|.030|.069|.098|
| Swap end to presentation |1462|13.033|15.538|16.089|
| Submit to presentation |1460|30.527|45.302|49.641|
Pipeline latency is not frame interval or GPU busy time: pipeline overlaps frames; expected VSync waits may be part of spans. Largest observed waits occur between receive/draw and swap/presentation; no proof of inefficient multi-surface composition, no detailed GPU hardware timeline in this trace. Do not subtract spans from a 16.67ms throughput budget or infer root cause. 
## Decision
Normal candidate shows near-60 callback and near-60 presentation in late windows, better than prior lab (52.27 best, 49.63 pooled release). Not apples-to-apples; capture overhead, phase drift, exact environment and differing metrics confound comparison. No proven instrumentation penalty, no proof of 60 stable or P3 pass. Keep union and all budgets/behavior/visual resources. Do not implement a compositor rewrite or reduce resolution solely on this trace. Next proposed P3.1.1 minimal RAF timestamp-only release mode: same explicit winning profile, no GPU query/poll, no per-frame metadata/CPU stage timers or per-frame object collection, bounded numeric interval storage, verify feature/buffer state at boundaries and periodically, maintain 3×10s+30s protocol and gate criteria; log instrumentation mode and sample validity, preserve full diagnostic separately. Validate timing with repeated/interleaved same-condition trials, then compare trace during a low-FPS episode if reproducible, confirm display refresh, hardware acceleration, actual buffer dimensions and concurrent load. P3 gate, human visual, day/night and 15min soak still pending. This is documentation only, no code implementation or merge. Prior P3.1 runtime CI 45758607846 success; later docs CI pending at review.
