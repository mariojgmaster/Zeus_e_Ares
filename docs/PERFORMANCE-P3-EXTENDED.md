# P2.2 extended and P3 physical gate — 2026-11-26
Evidence: user-supplied aqua-auxiliary-lab (2).json and aqua-release-gate.json, derived summary only. Same Intel UHD 630 ANGLE D3D11, viewport 3278x1594 CSS DPR 1.25, day, WebGL Living, max mesh, retained, depth/flow/optics/vegetation on, actual modes/buffers match. Both extended protocol 10s warmup + 30s measurement. No disjoint events. P2.2 candidateReview present.
| Extended phase | FPS | p95/p99 ms | max ms | >50ms / frames |
|---|---:|---|---:|---|
| balanced-reference | 46.20 | 33.5/33.6 | 50.1 | 1/1386 |
| balanced-aux-reference | 50.14 | 33.4/33.6 | 50.1 | 1/1505 |
| balanced-cached | 46.77 | 33.5/33.6 | 34.0 | 0/1403 |
| balanced-aux-cached | 50.80 | 33.4/33.5 | 50.2 | 1/1524 |
| balanced-gpu | 47.83 | 33.4/33.5 | 50.0 | 0/1435 |
| balanced-aux-gpu | 52.27 | 33.4/33.5 | 34.5 | 0/1568 |
| detail-gpu | 46.70 | 33.4/33.5 | 33.9 | 0/1401 |
| detail-aux-gpu | 47.67 | 33.4/33.6 | 83.1 | 1/1431 |
| balanced-reference-repeat | 43.93 | 33.5/33.7 | 50.0 | 0/1318 |
Candidate review status candidate-for-review; reference mean 45.066 FPS, drift 4.9056% (just within 5%), winner +15.976%, third consecutive benchmark winner. Paired auxiliary gains +8.53%, +8.62%, +9.27%, +2.09% respectively. GPU vs cached on light buffer +2.89%; small difference, not causal/significant proof. New best +14.09% vs earlier 45.81 across runs; 19.13ms mean interval; windows 52.70/52.10/52.00 FPS. Selection criteria satisfied; visual and release approval outstanding.
| P3 repeat | FPS | p95/p99 ms | max ms | >50ms / frames | 10s windows FPS |
|---|---:|---|---:|---|---|
| 1 | 51.13 | 33.4/33.5 | 66.7 | 1/1534 | 50.90/50.51/51.99 |
| 2 | 48.07 | 33.4/50.2 | 83.4 | 20/1442 | 43.00/50.60/50.60 |
| 3 | 49.71 | 33.4/33.5 | 83.5 | 5/1492 | 50.60/49.62/48.90 |
Pooled 4468 frames / 90.0178s = 49.6346 FPS, mean interval 20.1472ms, 26 long intervals (0.582%). All sample, actual mode, features checks true. All FPS/p95/p99/longFrames/windows checks false. P3 performance-fail; releaseApproved false. Do not run soak as substitute for failed gate. No visual/night/soak signoff. Heap snapshots ~17.4–27.0 MiB, oscillatory, not GPU memory or proof of absence of leaks. Caches remain 2153328 and 1507328 bytes.
## Investigation
P3 average ROI mask coverage 571250 / 1450087 / 1623905 pixel-channel area, GPU mask mean .152/.279/.441ms; larger coverage correlates with worse cadence in this small sample, not causal and not monotonic with FPS. Existing union rectangle may cover large empty gaps between fish; inspect separate per-fish nonoverlapping tiles/rectangles or exact union and preserve coverage/halo, identical pose and alpha sampling. CPU total 1.438/1.481/1.572ms, GPU color 3.455/3.629/3.487ms, fish 1.687/1.881/1.586ms, optics .884/.924/.884ms. Timers asynchronous, cannot subtract or sum them to derive compositor overhead. 16.7/33.4ms cadence suggests missed refresh opportunities, actual display refresh not measured. Proposed P3.1 Frame Pacing & Compositor Diagnostics: first compare RAF-only instrumentation vs timer queries enabled at same settings; capture Chrome Performance trace (frames, main, GPU/compositor, raster, no screenshots if possible), stable visible tab/viewport, same power mode; correlate slow intervals with mask region area, actual render time, GPU query polling, browser long animation frames where supported. Use repeated controlled trials, no synthetic changes to biology or quality; avoid further resolution reduction. If ROI proves costly, compare exact disjoint union coverage with baseline and pixel parity tests. Do not promise 60 FPS on this device. No new renderer code in this documentation update. Candidate remains explicit balanced-soft/gpu, default unchanged. Driftwood remains blocked.
## CI caveat
Earlier P2.2 runtime CI 45753291447 passed. Subsequent documentation-only head 711a01e8 CI 45756433527 failed browser smoke (25 pass, 1 fail): auxiliaryComposition.spec.js timeout 5s after inspection return, expected tank width 640, observed 1280. Cause not established; could be timing or actual fallback/restore problem. Reproduce and inspect actual mode/inspection state before modifying test or runtime, no waiver. Latest documentation commit needs own CI. No merge.


P3.1 candidate: paired full/light profiling and conservative disjoint mask ROI, trace markers and cadence correlation; inspection smoke synchronized with explicit states; no promotion or physical FPS claim. See [P3.1](P3.1-FRAME-PACING.md).

P3.1 diagnostic received; no proof of optimization gain, next compositor trace and controlled comparisons. [Results](PERFORMANCE-P3.1.md).
