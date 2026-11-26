# Roadmap, decisões e rastreabilidade
Estados: H = homologado pelo usuário; P = parcial; R = reprovado; C = candidato; F = futuro; E = evidência de implementação, homologação não recuperada. CI e merge são dimensões separadas.
| Versão | Escopo | Estado/evidência |
|---|---|---|
| 0.1 | Canvas 2D, alimentar/voz/noite/imersão/toque | E |
| 0.3 | observação 3D, girar, boca | E |
| 0.10–0.13 | frente, foto, nado, ½×, corrente e painel | E |
| 0.20 | comportamento procedural diversificado | E |
| 0.23 | referência visual oficial | H |
| 0.25.2 | recuperação do visual 0.23 | E |
| 0.28 | respiração, bolhas, alimentação, colisões e variações | E |
| 0.29 | Biological Personality | H, PR #1 integrada |
| 0.30 | Living Habitat | H, PR #2 integrada |
| 0.31 | Depth Engine | H, PR #3 integrada |
| 0.32 | React & Docker | H arquitetura, PR #4 não integrada na consulta |
| 0.32.1–0.32.2 | hotfix oclusão/escala | R, substituídas |
| 0.32.3 | authored SVG matte | C histórica, substituída como padrão pelo parallax |
| 0.33.0 | Living Habitat Parallax | E |
| 0.33.1 | Natural Color | H prévia |
| 0.33.2 | Underwater Optics | H 8/8, PR #5 |
| 0.33.3 | Living Vegetation | P movimento aprovado; performance reprovada, CI passou, PR #6 |
| 0.33.4 | Performance Recovery | R travamentos persistem, CI passou, PR #7 |
| 0.33.5 | Fluid Engine | R, FPS aproximadamente dobrou mas cenário quebrou, PR #8 |
| 0.33.6 | Visual Rollback | E, runtime 0.33.4 restaurado, docs mantidas, desempenho pendente |
| 0.33.7A | GPU Static Scene | P, melhora parcial, 13 FPS Original |
| 0.33.7B | GPU vivo, cenário único e raízes | C |
| 0.33.7B.1 | Frame Pacing & Loading | C, 0.33.7B melhorou mas 17 FPS máx e engasgos |
| 0.33.7C–D | Física e validação | F |
| 0.34 | Living Driftwood | F, bloqueada pela fluidez |
| 0.34.1 | Water Physics | F |
| 0.35 | Natural Lighting | F |
| 0.36 | Environmental Physics | F |
| 0.37 | Cinematic Aquarium | F |
| 0.38 | Performance & Regression | F |
## Backlog transversal
- Memória persistente além dos perfis/regiões atuais, refinamento biológico e interação social, guelras e anatomia sem regressão; escopo e numeração final a definir.
- Avaliar arquitetura/IA futura somente se necessária, sem quebrar offline ou adicionar serviço/tokens por padrão.
- Perfis de render, profiling, regressão visual, GPU física, microfone, testes prolongados, tags, lockfile e documentação técnica.
- Tronco: mapear portais reais, grafo, cavidade, clearance, reserva, estados, renderização e teste; água, luz, física e cinematografia conforme ENV-06.
## Decisões
D-01: baseline visual 0.23; evitar mudança sem necessidade. D-02: migração React/Docker antes de evolução. D-03: parallax naturalista com recursos separados, óptica e profundidade coerentes. D-04: desempenho bloqueia novas funcionalidades; 0.33.4 não aprovada. D-05: tronco antes de Water Physics; 0.34.1 reservado à água. D-06: documentação de especificações obrigatória no GitHub para tudo definido/aprovado/pendente, incluindo novas decisões. D-07: metas numéricas de performance propostas aguardam validação real.
## Processo
Branches e PRs encadeados, sem promover para master sem homologação do usuário e CI aplicável. Atualizar docs, status, testes, evidências e riscos no mesmo PR. Registrar feedback literal relevante, versionar critérios de aceite, não ocultar bloqueios. Para cada novo requisito indicar ID/estado/teste/versão e preservar histórico. Versões antigas não recuperadas integralmente: inventário acima contém apenas fatos conhecidos; completar com evidência histórica quando disponível.

D-08: reverter runtime da 0.33.5; não aceitar ganho de FPS com quebra visual; experimentar GPU-native Habitat em etapas protegidas por flag. PR #8 preservada como histórico, sem merge. Metas e numeração 0.33.7A–D são propostas.

D-09: usuário aprovou ADR-008 e etapa A. Manter padrão original, preservar composição e realizar paridade antes de deformação.
D-10: Parallax único; raízes no cascalho; fluidez 60 FPS. Outros cenários arquivados. Duas passagens GPU transitórias.

D-11: manter arquitetura GPU vivo aprovada parcialmente; não sacrificar qualidade, implementar carregamento real, medir estabilidade até 60 FPS.

D-12: usuário reportou A/B animado ainda muito abaixo do estático; PR #12 CI verde não implica aprovação. Bloquear avanço de conteúdo até arquitetura e performance validadas; ADR-009 proposta, lab diagnóstico não é melhoria de FPS.

D-13: user authorized P1; PR #13 CI passed but P0 physical JSON missing. Implement raw retained unified prototype behind URL flag first; no dependency migration yet; six-mode lab. No promotion before performance and visual evidence.

D-14: P0 and P1 physical reports received; P1 CI green but performance gate failed. Keep default unchanged; next proposed P1.1 resolution/layer isolation and static caching, Three.js choice deferred. [Evidence](../PERFORMANCE-P0-P1.md).

D-15: user approved P1.1. Diagnostic scale opt-in only; maintain original resources and production defaults; record exact measured settings, restore on cancel/finish. Await physical evidence before next rendering change.

D-16: P1.1 CI success and physical diagnostics received; diagnostic validated, product performance/visual gates not passed. P1.2 proposed, no implementation or merge. [Results](../PERFORMANCE-P1.1.md).

D-17: user approved P1.2. Candidate published separately, original Max default unchanged; P1.3 and release remain blocked pending evidence. [P1.2](../P1.2-INTELLIGENT-RETAINED.md).

D-18: P1.2 CI passed, quick hardware report received and analyzed; best 45.81 FPS, zero >50ms in short sample. Performance gate remains open and visual approval absent. P1.3 proposed, no implementation or merge. [Results](../PERFORMANCE-P1.2.md).

D-19: user approved P1.3; candidate isolated, original default unchanged, physical and visual gate pending. [P1.3](../P1.3-OPTIMIZED-OPTICS.md).

D-20: user requested continuation; P2 consolidation and P3 diagnostic tooling candidate only. P1.3 hardware report outstanding, default production unchanged. Release approval and Driftwood blocked. [P2](../P2-PRODUCTION-RENDERER.md).

D-21: P1.3 full CI passed, hardware report and release gate missing; user requested continuation. P2.1 experiment isolated, no production promotion or FPS claim. [P2.1](../P2.1-AUXILIARY-COMPOSITION.md).

D-22: P2.1 full CI PASS; P2.2 tooling implemented, physical report still pending; no automatic approval or merge. [P2.2](../P2.2-CANDIDATE-REVIEW.md).

D-23: two quick reports received; CI P2.1/P2.2 PASS. Extended benchmark and visual gate outstanding, no release approval. [Results](../PERFORMANCE-P2.1-P2.2.md).

D-24: P2.2 extended candidate selected; P3 0/3, no release. Latest prior docs-only CI failed auxiliary inspection smoke; reproduce before promotion. [Evidence](../PERFORMANCE-P3-EXTENDED.md).


P3.1 candidate: paired full/light profiling and conservative disjoint mask ROI, trace markers and cadence correlation; inspection smoke synchronized with explicit states; no promotion or physical FPS claim. See [P3.1](../P3.1-FRAME-PACING.md).

D-25: P3.1 CI 45758607846 PASS, physical report analyzed; improvement unproven, P3 still blocked. [Results](../PERFORMANCE-P3.1.md).
