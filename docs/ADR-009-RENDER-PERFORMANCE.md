# ADR-009 — Render performance recovery / launch gate
Status: proposed, with local diagnostic implementation. 2026-11-25. PR #12 CI passed, but user reports A/B animated performance remains far below static. 0.33.7B max 17 FPS reported; static FPS not supplied. Do not infer new FPS or approve.
## Source audit
0.33.7B.1 creates four full-screen surfaces (#gpuHabitat WebGL, #tank Canvas2D, #fish3d WebGL, #waterForeground Canvas2D), two GL contexts, separate alpha FBO pass, 24 authored elements, 12 environmental image assets and two fish. Native scene 1672x941; display DPR up to 1.5. ROI already reduces alpha raster area. Existing CPU timers time command submission, not GPU completion. Bottlenecks are hypotheses: overdraw, compositor bandwidth, duplicate textures, draw/state changes, shader work, driver fallback, 2D effects and simulation. Check chrome://gpu and actual GPU (ANGLE, hardware vs SwiftShader), Chrome Performance and Spector.js capture, not FPS alone.
## Candidate architectures
A. Preferred prototype: unified retained WebGL2 renderer (Three.js as first library candidate, custom GLSL via ShaderMaterial, preserve actual fish meshes/UV/shaders and behavior). One canvas, one context, stable scene graph, back-to-front z groups, cached static runs, batched/atlased dynamic foliage. Draw native alpha in color pass; depth-tested fish internally, blend environment/fish at authored depth boundaries. Validate exact transparent fin/leaf composition, camera and optical order; if needed render fish to small local transparent target and composite as a depth-sorted object, not full-frame alpha maps. Keep separate physical proxies and trunk graph. Do not assume opaque Z-buffer alone is enough. Avoid a second full mask pass where equivalence proven. GPU shader effects, no per-frame canvas copy/readback. Compare exact same scene with old code and a minimal raw-WebGL2 prototype before committing to dependency.
B. PixiJS v8: strong 2D batching, cacheAsTexture, Mesh/custom shaders. Good for foliage and effects; existing true 3D fish require custom integration (not separate contexts as production target). Candidate for prototype only if A is unsuitable; avoid Pixi+Three dual renderer duplication.
C. WebGPU: future optional backend; not guaranteed faster, port custom shaders and compatibility required. Not first choice. Do not use physics engines, full game engine or rewrite behavior merely to solve rendering.
D. Fallback if direct mesh solution misses budget: offline pre-baked local plant pose atlas/flipbook with alpha, interpolate poses and use same texture for occlusion, bounded memory; far foliage only if quality parity and local wake behavior preserved. Do not flatten scene into video, since fish must navigate between plants/inside wood.
Sources: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices ; https://pixijs.com/8.x/guides/concepts/performance-tips ; https://pixijs.com/8.x/guides/components/scene-objects/container/cache-as-texture ; https://pixijs.com/8.x/guides/components/scene-objects/mesh ; https://threejs.org/docs/pages/WebGLRenderer ; https://threejs.org/docs/pages/ShaderMaterial ; https://threejs.org/manual/pages/webgpurenderer ; https://developer.chrome.com/docs/devtools/performance ; https://spector.babylonjs.com/ ; https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query
## Performance lab
Opt-in ?lab=1, no runtime rendering changes except temporary benchmark mode switches. 4 s warmup + 12 s per mode: original static, GPU static A, living GPU static, living GPU animated. Local JSON, no network, same viewport, max quality during samples, current optical/depth/night/flow controls. GPU queries asynchronous when supported; disjoint samples discarded; queries bounded; GPU/compositor times not summed as wall time. CPU metrics include command submission, RAF distribution is actual frame cadence. Fish paths stochastic, so repeat tests. Record hardware via chrome://gpu if renderer unavailable. Keep tab visible and mouse still; abort on resize/focus observation. Compare actual mode metadata with expected; reject runs with fallback. For launch use 10s warm + 30s sampling x3 and 15 min soak separately. Lab not a performance fix.
## Production target and budgets (proposed, not measured)
Desktop baseline: user machine hardware-accelerated Chrome/Edge, 1920x1080 and native viewport; target 60 FPS (16.67ms), p95 <=20ms, p99 <=33.4ms, no recurring >50ms, no sustained <55 FPS in comparable 60Hz test. GPU frame work target <=10ms, CPU sim <=2ms, submit/DOM <=3ms; CPU/GPU overlap, not exact additive budget. Start with <=40 draw calls per frame (measure fish mesh count before finalizing), one context, no full dynamic readback/upload, zero recurring allocations proportional to pixels, capped particles, 2 fish, local proxy collision, decision tick 5–10Hz and physics fixed 60Hz with interpolation. GPU memory target <=128 MiB for primary scene assets/targets, no monotonic growth in 15min, initial compressed payload measured and budget defined after inventory; target critical loading <=5s cached/<=10s on agreed broadband/device, not enforced until measured. Quality tiers explicitly labeled; mobile target provisional 30 stable FPS on supported representative hardware, 60 on capable tier. No silent downgrade of Max textures/models or behavior. Measure physical hardware, not SwiftShader CI performance. Browser/device matrix and draw/memory/size budgets refined after benchmark.
## Milestones
P0 diagnostic: get local JSON, driver status and Spector frame; identify CPU/GPU/compositor bound.
P1 isolated vertical slice: same 2 fish, original scene, one context, static visual parity and then one animated plant; compare direct sorted alpha vs prior ROI. Benchmark raw WebGL2 vs Three.js under same workload, not synthetic marketing demos.
P2 full living scene: bake static runs (preserve order), atlas where useful with edge padding, batch foliage, GPU optics, eliminate extra full-screen passes, separate decision/physics/render, cache allocations. Tests for translucent overlap, roots, depth, night, feeding, respiration, resize and inspect.
P3 release gate: representative physical hardware, frame pacing, long soak, loading and device fallback. Keep original reference and no merge until visual+performance signoff. Driftwood and future content still pending. Do not introduce other scenes.

## P1 implementation update
Raw WebGL1-compatible prototype first, preserving original shader/mesh data for architecture isolation. Three.js/WebGL2 remains candidate, not installed. Two 2D overlays remain and ordering differs in P1; no visual/performance approval. Six-mode lab compares unified with earlier paths. [P1](P1-UNIFIED-RENDERER.md).

## Physical evidence amendment
P0/P1 reports received. P1 failed FPS gate; resolution/pixel budget and compositor isolation take precedence over library migration or further mask work. See [PERFORMANCE-P0-P1](PERFORMANCE-P0-P1.md). P1.1 proposed, not implemented.

## P1.1 implementation
Opt-in ten-phase resolution/foreground/optics lab, normal Max unchanged. See [P1.1](P1.1-PIXEL-BUDGET.md). P1 performance gate remains failed; library decision deferred.

## P1.1 physical evidence
Pixel-budget hypothesis supported by two consistent measurements; keep GPU Living, prioritize independent surface budgets and retained static batching, then optical optimization. No unified promotion or library migration yet. See [results](PERFORMANCE-P1.1.md).

## P1.2 candidate
GPU Living remains reference. Tight depth/order-preserving static cache and independent backing budgets, explicit experimental profiles; paired lab. [P1.2](P1.2-INTELLIGENT-RETAINED.md).

## P1.2 physical evidence
Independent surface budgets are the strongest measured improvement; cache-only deltas small, keep optional. P1.3 prioritizes optical passes and compositor isolation at identical buffers. [Results](PERFORMANCE-P1.2.md).

## P1.3 implementation
Opt-in cached optical primitives and same-context GPU base lighting, reference/cache/GPU comparison. No further reduction in fish or scene backing. [P1.3](P1.3-OPTIMIZED-OPTICS.md).

## P2 candidate
Measured P1.2 balanced + reference optics, P1.3 optional pending physical report. Explicit candidate route and P3 performance gate harness; no default promotion. [P2](P2-PRODUCTION-RENDERER.md).

## P2.1
Before further migration, isolate auxiliary Canvas2D pixel cost at unchanged fish/habitat/foreground buffers; restore native on fallback. [P2.1](P2.1-AUXILIARY-COMPOSITION.md).

## P2.2
No new physical evidence; freeze speculative render changes. Local candidate comparison with conservative drift, gain and cadence guardrails, no automatic promotion. [P2.2](P2.2-CANDIDATE-REVIEW.md).

## P2.1/P2.2 measurements
Two short runs received; first drift too high, second within policy. GPU lightweight provisional priority, no default promotion. Next extended measurement and compositor trace if needed. [Results](PERFORMANCE-P2.1-P2.2.md).

## P3 physical outcome and next investigation
P2.2 extended selection valid, P3 fails. Investigate instrumentation/compositor/ROI correlation before new graphics changes. [Evidence](PERFORMANCE-P3-EXTENDED.md).


P3.1 candidate: paired full/light profiling and conservative disjoint mask ROI, trace markers and cadence correlation; inspection smoke synchronized with explicit states; no promotion or physical FPS claim. See [P3.1](P3.1-FRAME-PACING.md).

## P3.1 measured outcome
No split activation and high drift; retain union, investigate browser compositor before additional changes. [Results](PERFORMANCE-P3.1.md).


Chrome trace evidence: normal candidate 59.81 animation callbacks/s, 58.48 presentation events/s (unique timestamps), ~24.54s, not P3 approval. Next minimal RAF-only comparison, no speculative compositor rewrite or quality reduction. [Trace analysis](PERFORMANCE-CHROME-TRACE.md).
