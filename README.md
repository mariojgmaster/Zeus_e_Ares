# AQUA ETERNA — Zeus & Ares

MVP 0.32 — React + Docker (homologada em 25/11/2026). MVP 0.32.2 — Natural Occlusion & Smooth Depth (candidata à homologação). Baseline 0.31 homologada pelo usuário e integrada à master; PRs #1, #2, #3. A versão 0.32 preserva o motor procedural, texturas, cenários, shaders e geometria; React monta a interface e o adaptador administra o ciclo de vida do motor.

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
- src/styles: CSS preservado.
- Dockerfile: build Node + runtime Nginx; healthcheck /healthz.
- docs/ROADMAP.md: roadmap de evolução.

O motor continua imperativo para evitar regressões de performance e de animação. Não habilitar minificação sem validar a serialização de funções do Canvas Worker. Microfone necessita HTTPS ou localhost; não há backend nem transmissão de áudio a terceiros. As fotos de referência estão em repositório público. Personalidades são simulações, não reconstruções comprovadas. A versão 0.31 pode ser recuperada no commit dc01536d9a1e85ea2fed8547407a8d1602c2d946.

## Validação pendente
Build npm, Docker e smoke tests precisam ser executados em ambiente com dependências e Docker. Homologação visual e teste em GPU física/microfone permanecem necessários. Não promover a branch antes da homologação da 0.32.2.
