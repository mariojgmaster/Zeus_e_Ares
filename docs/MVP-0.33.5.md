# MVP 0.33.5 — Fluid Engine
Reprovada pelo usuário em 25/11/2026: FPS aproximadamente dobrou, porém cenário quebrou. 0.33.4 reprovada por travamentos. Em vez de só reduzir o mapa, retirar composição e leitura de pixels da thread de interface.
## Implementação
- Worker dedicado de vegetação (OffscreenCanvas), carregamento por fetch/bitmap, um frame em voo, descarte de resultado obsoleto com epoch, transferência de propriedade dos bitmaps e RGBA, encerramento na desmontagem.
- Scene principal preserva baseline estática e prepara sprites/lotes somente se fallback local precisar. Mapa e planos atualizados juntos. Worker dos peixes mantém bitmap e mapa sincronizados e rejeita chave obsoleta; não chama rasterizador local durante espera normal, evitando trabalho duplicado. Pode haver breve ausência dos peixes durante startup/trocas até chegar frame compatível.
- Cache de cobertura por pixel e por peixe no software; reutiliza resultado entre triângulos. Sem alterar malhas, atlas, shaders ou biologia. Modo de compatibilidade síncrono ainda existe se Worker indisponível; não presumir mesma performance.
- Diagnóstico FPS: p95/p99 e intervalos >50ms (janela até 240 amostras), além dos custos e modo da vegetação. Medidas são intervalos requestAnimationFrame, não tempo GPU ou FPS de peixes.
## Gates
Comparar com 0.33.2, 0.33.3 e 0.33.4; 10s aquecimento, 30s amostra, mesmo hardware e configurações; metas em specifications/ENGINE.md. Validar nado, folhas, resposta, A/B, óptica, profundidade, alimentação, respiração, resize, observação e fallback. CI verde não substitui aceitação. Não promover nem iniciar Living Driftwood enquanto travamentos persistirem.

## Resultado e rollback
PR #8 rejeitada; preservar histórico e especificações. Runtime restaurado da 0.33.4, que ainda não está homologada por desempenho. Não atribuir a quebra a um mecanismo específico sem evidência visual ou trace. Ver [ADR-008](ADR-008-GPU-NATIVE-HABITAT.md).
