# AQUA ETERNA — Zeus & Ares

MVP 0.32 — React + Docker (homologada em 25/11/2026). MVP 0.33.2 — Underwater Optics (homologada pelo usuário em 25/11/2026 (8/8 critérios)). MVP 0.33.3 — Living Vegetation (movimento aprovado; regressão de desempenho reportada). MVP 0.33.4 — Performance Recovery (candidata à homologação). Baseline 0.31 homologada pelo usuário e integrada à master; PRs #1, #2, #3. A versão 0.32 preserva o motor procedural, texturas, cenários, shaders e geometria; React monta a interface e o adaptador administra o ciclo de vida do motor.

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
