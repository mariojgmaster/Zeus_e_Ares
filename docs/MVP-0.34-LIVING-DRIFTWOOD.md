# MVP 0.34 — Living Driftwood (planejamento; não implementada)
Dependência: homologação da recuperação de performance (0.33.5 ou sucessora; 0.33.4 reprovada). Preservar Water Physics como 0.34.1.

## Geometria authored
O recurso wood.webp já contém silhueta e áreas visualmente escuras. Escuro não implica abertura. Mapear manualmente o asset original (coordenadas locais, antes de recorte/câmera), diferenciando madeira sólida, cavidade interna, abertura efetiva e sombra decorativa. A captura anotada pelo usuário mostra uma trajetória aproximada da extremidade direita para a abertura à esquerda; não comprova uma cavidade contínua. Criar máscaras frontal/traseira e grafo de corredores somente onde for visualmente plausível. Revisar todas as aberturas com a imagem original e manter o cenário existente. Não perfurar pixels arbitrariamente.
## Navegação
- Cada portal tem ID, centro, orientação, largura e altura úteis, profundidade, corredor conectado e margem de segurança.
- Cada corredor declara comprimento, raio/altura mínima, pontos de controle e capacidade.
- Calcular envelope conservador do peixe a partir da escala corporal, projeção e nadadeiras; só permitir entrada se houver rota de saída compatível. Não encolher o peixe nem atravessar madeira.
- Usar broad phase e grafo pequeno, não pathfinding por pixel a cada frame. Reservar corredor para evitar sobreposição dos dois peixes; liberar reserva na saída.
- Estados: aproximar, inspecionar, entrar, explorar, esconder, espiar, sair. Usar aceleração, frenagem e curvas já homologadas; sem teleporte.
- Garantir saída antes de respiração obrigatória; alimentação e susto podem antecipar saída mas não quebrar a colisão. Se não houver portal elegível, permanecer fora. Não representar recinto real para dois bettas.
## Renderização
A transição entre dentro e fora deve ser contínua, com oclusão frontal, visibilidade apenas pelas aberturas, atenuação de luz interna e ordenação coerente. Máscaras estáticas cacheadas; nenhuma reconstrução global por frame. Coordenadas consistentes em WebGL e Canvas Worker/3D, recorte responsivo e câmera.
## Gates
1. Portais e interior claramente distinguíveis.
2. Entrada e saída somente por abertura de tamanho suficiente; bloqueio de portal pequeno e de madeira sólida.
3. Saída sempre alcançável, inclusive para respirar.
4. Oclusão sem salto, halo ou peixe visível através da madeira.
5. Curvas orgânicas e variação de comportamento; coexistência sem interpenetração.
6. Sem regressão no FPS em relação à versão de recuperação de performance homologada.
7. Cobertura de testes determinísticos de grafo, clearance, estados, saída e regressão visual.
