# AQUA ETERNA — Zeus & Ares

MVP 0.32 — React + Docker (homologada em 25/11/2026). MVP 0.33.2 — Underwater Optics (homologada pelo usuário em 25/11/2026 (8/8 critérios)). MVP 0.33.3 — Living Vegetation (movimento aprovado; regressão de desempenho reportada). MVP 0.33.4 — Performance Recovery (reprovada por travamentos). MVP 0.33.5 — Fluid Engine (reprovada: cenário comprometido apesar de FPS aproximadamente dobrado). Rollback visual: código executável 0.33.4; especificações preservadas. Baseline 0.31 homologada pelo usuário e integrada à master; PRs #1, #2, #3. A versão 0.32 preserva o motor procedural, texturas, cenários, shaders e geometria; React monta a interface e o adaptador administra o ciclo de vida do motor.

## Executar com Docker
```sh
docker compose up --build -d
```
Abra http://localhost:8080. Defina AQUA_PORT se precisar de outra porta. Para parar: `docker compose down`.

## Desenvolvimento
Node 22.12+:
```sh
npm install
npm run dev
```
Ou `docker compose -f compose.dev.yaml up` (localhost:5173).
```sh
npm test
npm run build
npx playwright install chromium
npm run test:smoke
```
O lockfile precisa ser gerado por npm e versionado antes de tratar o build como reprodutível.

## Arquitetura
- src/components: shell React (interface estável).
- src/engine: motor imperativo WebGL/Canvas Worker/Canvas 3D, ciclo de vida e carregamento dos atlas.
- src/assets: arquivos fotográficos e texturas originais binárias.
- public/parallax: 12 WebP independentes (incluindo água e superfície) e manifesto de 24 instâncias, 5 planos.
- src/engine/parallaxScene.js: composição, mapa alfa por plano, guarda de profundidade e óptica.
- src/styles: CSS preservado.
- Dockerfile: build Node + runtime Nginx; healthcheck /healthz.
- docs/ROADMAP.md: roadmap de evolução.

O motor continua imperativo para evitar regressões de performance e de animação. Não habilitar minificação sem validar a serialização de funções do Canvas Worker. Microfone necessita HTTPS ou localhost; não há backend nem transmissão de áudio a terceiros. As fotos de referência estão em repositório público. Personalidades são simulações, não reconstruções comprovadas. A versão 0.31 pode ser recuperada no commit dc01536d9a1e85ea2fed8547407a8d1602c2d946.

## Validação pendente
Build npm, Docker e smoke tests precisam ser executados em ambiente com dependências e Docker. Homologação visual e teste em GPU física/microfone permanecem necessários. Homologação integrada da 0.33.2 concluída pelo usuário (8/8); promoção depende das verificações técnicas aplicáveis. Parallax é o cenário padrão; botão Cenário alterna para Natural e Clássico. A câmera parallax móvel é limitada ao WebGL; Canvas/Worker mantém câmera estática com oclusão por plano. A geometria é 2.5D, não volumétrica.

## Living Vegetation
Deformação procedural de plantas por faixas horizontais ancoradas, corrente suave, resposta amortecida à velocidade e profundidade dos peixes, mapa alfa derivado do mesmo raster. WebGL e Canvas 3D atualizam em passos de 75 ms; Canvas Worker publica o ambiente junto ao bitmap compatível, em passos de pelo menos 120 ms. Controle Vegetação restaura a referência estática e respeita prefers-reduced-motion no início. A geometria segue 2.5D; não equivale a folhas 3D independentes. Validação visual, custo de rasterização e CI ainda precisam ser conferidos.

## Performance Recovery
Planos visuais continuam nativos; mapas de oclusão animados passam a 836 × 471, aproximadamente 75% menos bytes/pixels lidos. O mapa estático conserva resolução nativa. Faixas de deformação passam de 8 para 24 px, preservando a função de movimento. Objetos estáticos agrupados e cacheados; taxa de atualização adaptativa limitada a 75–160 ms (Worker: mínimo 120 ms). Controle FPS exibe custo da vegetação, máscara e tamanho do mapa. Confirmar visualmente contornos e fluidez e comparar FPS no mesmo dispositivo; não confundir redução de trabalho com ganho medido de FPS.

## Especificações do projeto
A fonte de verdade é [docs/specifications/README.md](docs/specifications/README.md). Toda alteração de comportamento, visual, arquitetura, performance, requisito pendente ou homologação deve atualizar a documentação no mesmo PR. A estratégia Worker/OffscreenCanvas da 0.33.5 foi revertida neste branch. Próxima arquitetura proposta: [GPU-native Habitat](docs/ADR-008-GPU-NATIVE-HABITAT.md). FPS real exige medição no dispositivo-alvo.

## 0.33.7A — GPU Static Scene (experimental)
Use GPU: Original/Estático to compare the retained static GPU planes and original renderer. GPU is off by default. Compare with Vegetação off on original; exiting restores prior vegetation preference. [Specification](docs/MVP-0.33.7A.md). No new assets or fish changes.

## 0.33.7B
Parallax único; GPU: Vivo padrão quando suportado. Original e Estático são modos de renderização, não cenários. [Especificação](docs/MVP-0.33.7B.md).

## 0.33.7B.1
Tela de carregamento real e otimização de cobertura GPU. [Especificação](docs/MVP-0.33.7B.1.md).

## Performance lab (branch experimental)
Abra /?lab=1, execute diagnóstico com aba visível e sem mexer no mouse, exporte JSON. Quatro modos, 4s warmup + 12s amostra cada. Não altera render padrão nem envia dados. Ver [ADR-009](docs/ADR-009-RENDER-PERFORMANCE.md).

## P1 experimental
Open /?unified=1 for unified scene. Open /?lab=1 for six-mode comparison; original default preserved. [P1](docs/P1-UNIFIED-RENDERER.md).

## P1.1 — Pixel Budget
Open /?pixelLab=1, choose quick or extended, run and export JSON. Same viewport, original assets. Normal / remains 100% and /?lab=1 remains six-mode comparison. [Spec](docs/P1.1-PIXEL-BUDGET.md).

## P1.2 — Intelligent Retained
Open /?retained=1&profile=balanced (or native, detail, max). Compare cache ON/OFF at same resolution. /?retainedLab=1 exports eight-profile JSON. Normal / unchanged. [Spec](docs/P1.2-INTELLIGENT-RETAINED.md).

## P1.3 — Optimized Optical Engine
Open /?optical=1 (balanced) or &profile=detail/native/max. Select original/cache/GPU optics. /?opticalLab=1 exports paired eight-phase JSON. Normal / unchanged. [Spec](docs/P1.3-OPTIMIZED-OPTICS.md).

## P2 release candidate
Open /?candidate=1 (balanced + reference optics). Explicit profile and opticalMode query options. /?releaseLab=1 runs 3×30s with warmups; append &soak=1 for 15min soak. Normal / unchanged. [Spec](docs/P2-PRODUCTION-RENDERER.md).

## P2.1 — Auxiliary Composition
Open /?candidate=1&profile=balanced-soft for opt-in lighter tank effects, /?auxLab=1 for nine paired phases. Original candidate/default unchanged. [Spec](docs/P2.1-AUXILIARY-COMPOSITION.md).

## P2.2 — Candidate Review
/?auxLab=1 now summarizes paired results locally and accepts an existing P2.1 JSON. Extended profile required for a provisional recommendation; no automatic promotion. [Spec](docs/P2.2-CANDIDATE-REVIEW.md).


P3.1 candidate: paired full/light profiling and conservative disjoint mask ROI, trace markers and cadence correlation; inspection smoke synchronized with explicit states; no promotion or physical FPS claim. See [P3.1](docs/P3.1-FRAME-PACING.md). Open /?pacingLab=1; export aqua-frame-pacing-lab.json.


P3.1.2 candidate: minimal numeric RAF collector, mirrored full/light/minimal comparison, explicit minimal release route with unchanged P3 thresholds. No renderer promotion or measured gain. Open /?minimalLab=1; export aqua-minimal-lab.json. [Specification](docs/P3.1.2-MINIMAL-INSTRUMENTATION.md).
