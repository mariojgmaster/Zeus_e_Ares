# Aqua Eterna — especificações vivas
Fonte de verdade funcional e técnica. Revisão: 25/11/2026. Este índice é obrigatório em todo PR. A especificação diferencia requisitos acordados, implementação, aprovação humana, evidência automatizada e proposta futura. Não declarar aprovado o que não foi homologado.
- [Visão e experiência](PRODUCT.md): identidade, visual, interação e acessibilidade.
- [Biologia e comportamento](BIOLOGY.md): anatomia, nado, respiração, personalidade e interação.
- [Ambiente e profundidade](HABITAT.md): composição, óptica, vegetação, tronco e próximas etapas.
- [Arquitetura e desempenho](ENGINE.md): React, Docker, renderizadores, budgets e medição.
- [Roadmap, decisões e rastreabilidade](DELIVERY.md): versões, pendências e processo.
- [Roadmap histórico](../ROADMAP.md), [0.32](../MVP-0.32.md), [0.33.2](../MVP-0.33.2.md), [0.33.4](../MVP-0.33.4.md), [0.34 Living Driftwood](../MVP-0.34-LIVING-DRIFTWOOD.md).
## Política
Toda nova decisão deve ter ID, descrição, critérios verificáveis, estado e evidência/referência. Atualizar os documentos no mesmo PR que o código. Preservar histórico; não transformar propostas em requisitos homologados. O feedback do usuário prevalece sobre CI verde. Requisitos recuperados de versões antigas são registrados na medida da evidência disponível; detalhes não recuperados não devem ser inventados.

- [ADR-008 — GPU-native Living Habitat](../ADR-008-GPU-NATIVE-HABITAT.md): rollback 0.33.5, nova arquitetura proposta e gates incrementais.

- [MVP 0.33.7A](../MVP-0.33.7A.md): render estático GPU, ponte transitória, testes e limites.

- [0.33.7B](../MVP-0.33.7B.md) — GPU vivo, cenário único e raízes.

- [0.33.7B.1](../MVP-0.33.7B.1.md) — frame pacing e carregamento.

- [ADR-009](../ADR-009-RENDER-PERFORMANCE.md) — diagnóstico, alternativas de mercado e gate de lançamento.

- [P1 Unified Renderer](../P1-UNIFIED-RENDERER.md) — experimental sorted GPU scene and benchmark.

- [P0/P1 physical benchmarks](../PERFORMANCE-P0-P1.md) — measured results, limitations and proposed P1.1.

- [P1.1 Pixel Budget & Resolution Lab](../P1.1-PIXEL-BUDGET.md) — controlled scale and layer tests.

- [P1.1 physical results](../PERFORMANCE-P1.1.md) — two reports and proposed P1.2.

- [P1.2 Intelligent Retained Rendering](../P1.2-INTELLIGENT-RETAINED.md) — static cache and independent budgets.

- [P1.2 physical results](../PERFORMANCE-P1.2.md) — paired cache and independent budgets, optical strategy.

- [P1.3 Optimized Optical Engine](../P1.3-OPTIMIZED-OPTICS.md) — optical cache, GPU composition and paired lab.

- [P2 Production Renderer and P3 validation](../P2-PRODUCTION-RENDERER.md) — candidate, thresholds and soak.

- [P2.1 Auxiliary Composition](../P2.1-AUXILIARY-COMPOSITION.md) — independent auxiliary surface experiment.

- [P2.2 Candidate Review](../P2.2-CANDIDATE-REVIEW.md) — local evidence review and provisional selection.

- [P2.1/P2.2 physical results](../PERFORMANCE-P2.1-P2.2.md) — optical and auxiliary paired comparisons.

- [Extended P2.2/P3 results](../PERFORMANCE-P3-EXTENDED.md) — measured candidate, failed release gate, P3.1 proposal and CI caveat.


P3.1 candidate: paired full/light profiling and conservative disjoint mask ROI, trace markers and cadence correlation; inspection smoke synchronized with explicit states; no promotion or physical FPS claim. See [P3.1](../P3.1-FRAME-PACING.md).

- [P3.1 physical frame pacing results](../PERFORMANCE-P3.1.md) — high drift, zero split activation, investigation priorities.


Chrome trace evidence: normal candidate 59.81 animation callbacks/s, 58.48 presentation events/s (unique timestamps), ~24.54s, not P3 approval. Next minimal RAF-only comparison, no speculative compositor rewrite or quality reduction. [Trace analysis](../PERFORMANCE-CHROME-TRACE.md).
