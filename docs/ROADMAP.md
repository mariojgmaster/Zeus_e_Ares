# Aqua Eterna — roadmap ambiental e critérios de qualidade

## Identidade da experiência
Aquário virtual afetivo e biologicamente inspirado, offline, interativo e procedural. Zeus azul-escuro e Ares vermelho-vinho, sem manchas esbranquiçadas. Modelos, atlas, anatomia e movimentos homologados devem ser preservados. Personalidades simuladas não representam comprovação dos animais reais.

## Sequência ambiental recuperada
| Versão | Tema | Entrega |
|---|---|---|
| 0.30 | Living Habitat | Cenário naturalista; composição responsiva; cenário clássico preservado |
| 0.31 | Depth Engine | Oclusão ambiental por profundidade; integração com WebGL e software |
| 0.32 | React & Docker | Migração arquitetural homologada pelo usuário em 25/11/2026 |
| 0.32.1 | Vegetation Occlusion Hotfix | Não homologada: rebarbas nas folhas e escala abrupta | 
| 0.32.2 | Natural Occlusion & Smooth Depth | Não homologada: contornos vegetais ainda insatisfatórios | 
| 0.32.3 | Authored Vegetation Matte | Máscara vetorial em resolução nativa; preservar correção de profundidade; candidata à homologação |
| 0.33.0 | Living Habitat Parallax | 24 instâncias independentes; 5 planos; substitui máscara estática no cenário padrão |
| 0.33.1 | Natural Color | Graduação de cores naturais, aprovada visualmente na prévia |
| 0.33.2 | Underwater Optics | Integração dos recursos e óptica subaquática; homologada pelo usuário em 25/11/2026 (8/8) |
| 0.33.3 | Living Vegetation | Movimento orgânico aprovado; regressão de performance reportada |
| 0.33.4 | Performance Recovery | CI passou; reprovada pelo usuário por travamentos persistentes |
| 0.33.5 | Fluid Engine | Reprovada: FPS aproximadamente dobrou, cenário quebrou |
| 0.33.6 | Visual Rollback | Runtime idêntico à 0.33.4; docs preservadas; não homologada |
| 0.33.7A | GPU Static Scene | Melhora parcial; 13 FPS no Original, não homologada |
| 0.33.7B | GPU Living Vegetation | Candidata: GPU vivo, Parallax único e ancoragem |
| 0.33.7B.1 | Frame Pacing & Loading | Candidata: 17 FPS máx reportado, reduzir trabalho e revelar aquário pronto |
| 0.33.7C | Unified Environmental Physics | Pendente: proxies locais e fallback |
| 0.33.7D | Performance & Visual Gate | Pendente: benchmark e regressão |
| 0.34 | Living Driftwood | Portais por tamanho, cavidade navegável e esconderijo |
| 0.34.1 | Water Physics | Superfície, correnteza, ondulações e partículas coerentes |
| 0.35 | Natural Lighting | Sombras e ciclo de iluminação diária |
| 0.36 | Environmental Physics | Colisões volumétricas, refúgios, desvio e integração ambiente/biologia |
| 0.37 | Cinematic Aquarium | Câmera, imersão e paisagem sonora |
| 0.38 | Performance & Regression | Otimização e consolidação dos testes de regressão |

## Requisitos transversais
- Identidade visual: preservar as texturas fotográficas e as geometrias dos peixes; azul profundo e vermelho-vinho.
- Biologia e comportamento: respiração obrigatória; trajetórias variáveis, curvas naturais em todos os eixos, frenagem, alimentação, repouso, exploração, microcomportamentos, memória e personalidades.
- Física: manter colisões entre peixes e obstáculos; não confundir oclusão visual com colisão física.
- Interação: vidro, ração, voz (permissão do navegador), perfis, observação, fotografias e controles existentes.
- Acessibilidade/imersão: controles responsivos, opção de ocultar a interface e comparação com a versão anterior.
- Arquitetura: React/Vite e Docker a partir de 0.32, preservando execução sem serviços externos; WebGL com fallback Canvas Worker/Canvas 3D.
- Entrega: PRs encadeados, sem promover à master antes da homologação; preservar baseline e registrar evidências.

## 0.31 — implementação e limitações
Mapa de profundidade estático em espaço da fotografia, 512 x 288 (147.456 bytes), composto por nove polígonos aproximados de tronco, pedras, folhas e substrato, com cinco planos de profundidade distintos. Descarte por fragmento no WebGL e por pixel no rasterizador software, em função da posição z da superfície do peixe. Mapeamento acompanha o recorte responsivo. Controle Profundidade permite A/B; oclusão desativada no cenário clássico e na observação de modelos. Não é geometria 3D completa: refinamento das silhuetas, vegetação independente e colisão ambiental volumétrica continuam no roadmap.

## Evidência de validação 0.31
- JavaScript: sintaxe validada com Node.
- Chromium headless, Canvas Worker: 1280 x 720 e 390 x 844, alternância profundidade, clássico/natural e observação, sem erros de página.
- Rasterizador software, teste controlado de oclusão em 1280 x 720: posição z=0,79, 4.399 pixels do peixe sem máscara e 68 com máscara; z=1,13, 8.977 pixels com/sem máscara. Valores não são métricas de FPS.
- WebGL em GPU física, validação visual, desempenho e regressão biológica prolongada ainda pendentes.

## 0.33.3 — critérios de homologação
1. Raízes fixas, plantas com fases e rigidez distintas, sem cortes visíveis.
2. Corrente altera suavemente amplitude e repouso.
3. Passagem próxima de Zeus/Ares causa deslocamento amortecido, restrito à profundidade e velocidade.
4. Oclusão acompanha a silhueta animada sem halos ou atravessamentos.
5. Troncos, pedras, cascalho, cores e óptica permanecem estáveis.
6. Controle Vegetação permite comparação exata com a 0.33.2; respeita redução de movimento inicial.
7. WebGL, Canvas Worker e Canvas 3D mantêm consistência visual e FPS aceitável; verificar desktop e mobile.
8. Alimentação, respiração, personalidade, observação, cenário e controles sem regressões.

## Especificações permanentes
Ver [índice de especificações](specifications/README.md). Nenhuma entrega futura deve omitir atualização de requisitos, decisões, pendências e evidências de homologação. Living Driftwood depende da recuperação de fluidez, não especificamente da versão 0.33.4.

### Gate de lançamento: Performance Recovery
ADR-009: diagnóstico e vertical slice de renderizador único antes de 0.33.7C/D e Living Driftwood. 0.33.7B.1 ainda não homologada por performance; não substituir baseline até prova comparativa.

P1 candidate: opt-in unified raw renderer, P0 physical benchmark still open. P2 batching/Three.js decision and launch gate pending.
