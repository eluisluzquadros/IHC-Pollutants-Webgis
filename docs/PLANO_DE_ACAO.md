# 🗺️ Plano de Ação — Envibase WebGIS Platform

**Versão**: 2.0  
**Data de início**: Abril 2026  
**Organização**: Instituto Hidrocarboneto (IHC)  
**Time**: Luis Luz Quadros + colaboradores IHC  

---

## Status Geral

| Fase | Status | Conclusão estimada |
|------|--------|-------------------|
| Fase 0 — Fundação & MVP | ✅ Concluído | Set/2025 |
| Fase 1 — Consolidação e Qualidade | 🔄 Em andamento | Mai/2026 |
| Fase 2 — Funcionalidades Avançadas | 📅 Planejado | Ago/2026 |
| Fase 3 — Monetização e Escala | 📅 Planejado | Dez/2026 |

---

## Fase 0 — Fundação & MVP ✅ Concluído

> **Objetivo**: Entregar uma plataforma WebGIS funcional com IA e gestão de dados básica.

### Entregáveis Concluídos

- [x] **Setup do projeto** — Vite + React + TypeScript + Tailwind CSS
- [x] **Layout WebGIS** — CSS Grid (25% sidebar / 75% mapa), AppBar responsiva
- [x] **Mapa Interativo** — Leaflet + leaflet.heat + leaflet.markercluster
- [x] **Filtro Espacial** — LeafletDraw (retângulo, polígono, círculo) + Turf.js
- [x] **Importação CSV** — Parser com mapeamento de colunas customizável
- [x] **Exportação CSV** — Download de dados filtrados
- [x] **Assistente de IA** — Multi-LLM: OpenAI, Anthropic, Gemini, DeepSeek, Zhipu, MiniMax
- [x] **Dashboard Analytics** — KPIs, gráficos Recharts, DuckDB-WASM
- [x] **Autenticação** — Migração completa para Local Auth (JWT + Postgres)
- [x] **Gestão de Projetos** — IndexedDB com separação por projeto
- [x] **Landing Page** — Hero, Funcionalidades, Preços (3 planos), FAQ, Footer
- [x] **Tema Claro/Escuro** — Glassmorphism, Tailwind dark mode
- [x] **Responsividade** — Drawer mobile, tablet, desktop
- [x] **Deploy Replit** — Configuração dual workflow (frontend + backend)
- [x] **Backend Express** — API Node.js com integração OpenAI e CORS

---

## Fase 1 — Consolidação e Qualidade 🔄 Em andamento

> **Objetivo**: Estabilizar o MVP, cobrir gaps de UX, adicionar testes e melhorar SEO.

### Sprint 1.1 — Qualidade de Código (Abril 2026)

- [ ] **Testes unitários** — Vitest + React Testing Library para hooks e utils (csvImporter, storageService)
- [ ] **Testes de integração** — Playwright para fluxos críticos (login → importar CSV → ver mapa → exportar)
- [x] **TypeScript strict** — `noImplicitAny`, `strictNullChecks` ativo
- [ ] **ESLint** — Configurar regras `react-hooks` e `no-unused-vars`
- [ ] **Error Boundary** — Wrapper global para recovery de erros sem crash total
- [ ] **Logs estruturados** — Remover `console.log` de produção; usar logger configurável

### Sprint 1.2 — Experiência do Usuário (Abril/Maio 2026)

- [ ] **Onboarding flow** — Wizard de primeiro acesso: criar projeto → importar dados → ver mapa
- [ ] **Empty states** — Telas de "sem dados" com calls-to-action (importar CSV ou usar dados de amostra)
- [ ] **Skeleton loading** — Substituir spinners por skeleton screens no dashboard e lista de projetos
- [x] **Tooltip de estação** — Hover com dados detalhados (pol_a, pol_b, data)
- [ ] **Feedback de erros** — Mensagens de erro mais descritivas no painel de importação
- [ ] **Acessibilidade (a11y)** — Audit WCAG 2.1 AA: aria-labels, focus management, contraste

### Sprint 1.3 — Performance (Maio 2026)

- [ ] **Code splitting** — Verificar e otimizar chunks do Vite (bundle analyzer)
- [ ] **DuckDB paginação** — Para datasets > 50k registros, paginar resultados no dashboard
- [ ] **Memoização** — Revisar `useMemo`/`useCallback` em componentes pesados (MapContainer, PollutionDashboard)
- [ ] **Service Worker** — Cache de assets estáticos para acesso offline básico
- [ ] **Lighthouse CI** — Meta LCP ≥ 90 em build de produção

### Sprint 1.4 — Documentação Técnica (Abril/Maio 2026)

- [x] **README.md** — Atualizado com arquitetura, instalação e stack
- [x] **PRD.md** — Documento de requisitos do produto
- [x] **PLANO_DE_ACAO.md** — Este documento
- [ ] **CONTRIBUTING.md** — Guia de contribuição, convenções de commit (Conventional Commits)
- [ ] **CHANGELOG.md** — Histórico de releases semânticos
- [ ] **Storybook** — Documentar componentes UI isolados (Button, Card, etc.)
- [ ] **OpenAPI spec** — Documentar endpoints do backend Express (Swagger)

---

## Fase 2 — Funcionalidades Avançadas 📅 Jun–Ago 2026

> **Objetivo**: Adicionar diferenciadores competitivos e funcionalidades de high-value para conversão de planos pagos.

### 2.1 — Envibase Discovery

- [ ] **Motor de busca** — Interface para descobrir datasets públicos por tema/área geográfica
- [ ] **Integração IBGE** — Dados censitários e de setores censitários via API
- [ ] **Integração INPE** — Focos de queimadas, desmatamento via TerraBrasilis API
- [ ] **Integração ANA** — Dados de qualidade de água e hidrologia
- [ ] **Favoritos** — Salvar datasets descobertos em projetos

### 2.2 — Analytics Avançado

- [ ] **Série Temporal** — Gráfico de linha animado mostrando evolução temporal dos poluentes
- [ ] **Box Plot** — Distribuição estatística por estação e por período
- [ ] **Correlação** — Cross-plot pol_a × pol_b com linha de tendência
- [ ] **Clustering espacial** — DBSCAN para identificação de hot-spots automaticamente
- [ ] **Previsão simples** — ARIMA/Prophet para forecast de curto prazo

### 2.3 — Relatórios e Exportação

- [ ] **Relatório PDF** — Template profissional com mapas, gráficos, tabelas e metadados do projeto
- [ ] **Exportação GeoJSON** — Para integração com outras ferramentas GIS (QGIS, etc.)
- [ ] **Exportação Shapefile** — Via `shpwrite` ou similar
- [ ] **Compartilhamento de projeto** — Link público/privado para visualização de resultado

### 2.4 — Alertas e Monitoramento

- [ ] **Thresholds configuráveis** — Definir limites por poluente por projeto
- [ ] **Alertas in-app** — Notificação quando novos dados ultrapassam threshold
- [ ] **Email alerts** — Integração SendGrid para notificações fora da plataforma

### 2.5 — Colaboração

- [ ] **Compartilhamento de projeto com equipe** — Permissões: viewer / editor / admin
- [ ] **Comentários em estações** — Anotações contextuais no mapa
- [ ] **Audit log** — Histórico de ações por usuário no projeto

---

## Fase 3 — Monetização e Escala 📅 Set–Dez 2026

> **Objetivo**: Ativar modelo de receita, escalar infraestrutura e expandir integrações.

### 3.1 — Modelo de Negócios

- [ ] **Stripe integration** — Checkout de planos Profissional e Corporativo
- [ ] **Portal de faturamento** — Gestão de assinatura, notas fiscais, downgrade/upgrade
- [ ] **Limites por plano** — Enforcement de quota: projetos, armazenamento, usuários
- [ ] **Trial gratuito** — 14 dias do plano Profissional sem cartão

### 3.2 — Infraestrutura

- [ ] **Escalar storage** — Otimizar queries PostgreSQL e suporte a S3 para planos pagos
- [ ] **CDN de tiles** — Cache de tiles de mapa para performance global
- [ ] **Rate limiting** — Proteção das APIs públicas
- [ ] **Monitoramento** — Sentry (erros), PostHog (analytics) e Uptime Robot (disponibilidade)

### 3.3 — API Pública

- [ ] **REST API** — Endpoints autenticados para integração com sistemas externos
- [ ] **Webhooks** — Notificações de eventos (nova importação, threshold atingido)
- [ ] **SDK JavaScript** — Pacote npm para embedding do mapa em outras aplicações

### 3.4 — Expansão

- [ ] **App mobile** — React Native (iOS + Android) com versão offline
- [ ] **Integração IoT** — Conectar sensores em tempo real via MQTT/WebSocket
- [ ] **Marketplace de datasets** — Compartilhamento de datasets entre organizações

---

## Critérios de Pronto (Definition of Done)

Para cada item ser marcado como concluído, deve atender:

1. ✅ **Funcional**: feature funciona conforme especificado
2. ✅ **Testado**: ao menos um teste unitário ou E2E cobre o fluxo principal
3. ✅ **Revisado**: PR revisado por ao menos outro membro (quando aplicável)
4. ✅ **Documentado**: README ou Storybook atualizado se for componente/API
5. ✅ **Acessível**: sem regressões de acessibilidade (verificado via axe)
6. ✅ **Performance**: sem regressão de LCP > 200ms

---

## Convenções de Desenvolvimento

### Branches

```
main          → produção estável
develop       → integração de features
feature/xyz   → novas funcionalidades
fix/xyz       → correções de bugs
docs/xyz      → atualizações de documentação
```

### Commits (Conventional Commits)

```
feat(map): add polygon spatial filter with turf.js
fix(import): handle BOM in UTF-8 CSV files
docs(readme): update architecture section
perf(dashboard): memoize recharts data transformation
test(csv): add unit tests for column mapping
```

### Pull Requests

- Título no formato Conventional Commits
- Descrição: **O quê** mudou, **Por quê** e **Como testar**
- Screenshots/vídeo para mudanças de UI
- Linked issue (quando aplicável)

---

## Ferramentas e Processos

| Ferramenta | Uso |
|-----------|-----|
| Vite | Build e dev server |
| Vitest | Testes unitários |
| Playwright | Testes E2E |
| ESLint + Prettier | Linting e formatação |
| Husky + lint-staged | Pre-commit hooks |
| GitHub Actions | CI/CD |
| Sentry | Monitoramento de erros |
| PostHog | Product analytics |
| Figma | Design de UI/UX |

---

> **Responsável**: Luis Luz Quadros  
> **Revisão**: IHC Research Labs  
> **Última atualização**: Abril 2026  
> **Próxima revisão**: Junho 2026
