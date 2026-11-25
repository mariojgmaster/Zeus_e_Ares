# MVP 0.33.4 — Performance Recovery
Feedback: 0.33.3 com movimento aprovado e perda significativa de desempenho. Não homologada integralmente. CI anterior da PR 6 verde, mas não media FPS físico.

## Mudanças
- Máscara dinâmica: 1672×941 para 836×471, RGBA. 6.002 para 1.502 MiB por mapa, redução teórica de 74.97%. Visual continua nativo; referência estática usa mapa integral.
- Faixas 8→24 px, mesma função de deslocamento, fase por planta cacheada por desenho e compartilhamento de amostra na borda.
- Cache de lotes estáticos contíguos por plano; atualização adaptativa 75–160 ms, Worker mínimo 120 ms.
- WebGL redimensiona textura quando alterna modo; Worker evita reenviar mapa aceito; dimensões explícitas no rasterizador e na colisão.
- Guard de profundidade só consulta máscara quando cruzamento é proposto.
- Diagnóstico FPS: tela, peixes, simulação, ambiente, vegetação, máscara, bytes, qualidade.
## Protocolo de homologação
Mesmo navegador, GPU, viewport, resolução e controles. Usar cenário Parallax, óptica ligada, qualidade Máx, janela focada, sem outros programas pesados. Após 10 s de aquecimento, registrar 30 s em cada modo (0.33.2 estática, 0.33.3 viva, 0.33.4 viva e estática). Repetir 3 vezes se variação grande. Anotar FPS tela e peixes, custos no tooltip FPS, travamentos e contornos de folhas. Comparar também desktop e mobile quando possível. Meta proposta: FPS da 0.33.4 viva >=90% da 0.33.2 estática (ou 60 FPS quando baseline >=60 e monitor permite), e custo do ambiente menor que 0.33.3; sem reduzir qualidade dos peixes. Meta não é medição obtida.
## Critérios
1. FPS recuperado e ausência de travamentos. 2. Movimento orgânico preservado. 3. Reação local dos peixes. 4. Oclusão sem novos halos. 5. Raízes e sólidos estáveis. 6. Corrente e A/B funcionam. 7. Desktop/mobile e fallback sem erro. 8. Regressão funcional ausente.
CI valida build/integração; não substitui medição física. A redução do mapa pode suavizar contornos finos; se aparecer regressão visual, rever resolução/estratégia em vez de aprovar.

## Resultado
CI da PR #7 concluído com sucesso (run 45628162563); usuário reprovou a fluidez, com travamentos persistentes. Não homologada. Sucedida pela 0.33.5; não tratar redução teórica da máscara como ganho medido de FPS.
