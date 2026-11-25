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
