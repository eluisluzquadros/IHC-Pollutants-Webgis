# 📄 PRD — Envibase: Plataforma de Inteligência Ambiental

**Versão**: 2.0  
**Data**: Abril 2026  
**Organização**: Instituto Hidrocarboneto (IHC)  
**Repositório**: [bitbucket.org/ihc-background/desafio_tecnico](https://bitbucket.org/ihc-background/desafio_tecnico)  
**Status**: ✅ MVP Entregue | 🔄 Evolução Contínua

---

## 1. Visão do Produto

### 1.1 Problema

Profissionais de meio ambiente — consultores, pesquisadores e órgãos regulatórios — lidam diariamente com dados geoespaciais fragmentados em planilhas, softwares GIS proprietários e múltiplos aplicativos. Esse cenário gera:

- **Perda de produtividade**: horas gastas conciliando formatos e ferramentas
- **Erros de análise**: falta de rastreabilidade e validação centralizada
- **Custos elevados**: licenças de SIG, servidores dedicados, consultores de TI
- **Acesso restrito**: dados silos que impedem colaboração entre equipes

### 1.2 Solução — Envibase

A **Envibase** é um SGDA (Sistema de Gerenciamento de Dados Ambientais) nativo na nuvem que centraliza, processa e visualiza dados ambientais geoespaciais em uma interface WebGIS profissional, enriquecida por assistência de IA conversacional.

### 1.3 Proposta de Valor

| Para | A Envibase oferece | Ao contrário de |
|------|--------------------|-----------------|
| Consultores ambientais | Dashboard + mapa integrado com IA analítica | ArcGIS + Excel separados |
| Pesquisadores | Import de CSV com mapeamento flexível e SQL in-browser | Ferramentas específicas por formato |
| Órgãos públicos | Vizualização de monitoramento em tempo real + relatórios | Planilhas desconectadas |

---

## 2. Usuários-Alvo (Personas)

### Persona A — Consultor Ambiental Independente
- **Perfil**: Engenheiro/Biólogo, 28–45 anos, trabalha com estudos de impacto
- **Dores**: Gerencia 3–10 projetos simultâneos em ferramentas distintas
- **Necessidades**: Organização por projeto, exportação de relatórios, mapas profissionais
- **Plano**: Individual (Grátis) → Profissional

### Persona B — Analista de Dados Ambientais Corporativo
- **Perfil**: Cientista de dados, 25–40 anos, equipe de 5–20 pessoas
- **Dores**: Dados silos, falta de padronização, dificuldade de colaboração
- **Necessidades**: API, gestão de equipe, grande volume de dados
- **Plano**: Corporativo

### Persona C — Técnico de Órgão Regulatório
- **Perfil**: Servidor público, 30–55 anos, monitora estações de qualidade do ar/água
- **Dores**: Sistemas legados, relatórios manuais, sem visualização espacial
- **Necessidades**: Heatmaps, alertas de threshold, exportação padronizada
- **Plano**: Profissional ou Corporativo

---

## 3. Funcionalidades — Estado Atual (MVP)

### 3.1 ✅ Implementado

#### Autenticação e Gestão de Usuários
- Login social com Google (Firebase Auth)
- Perfil de usuário no header (avatar, nome, email)
- Modo visitante (acesso limitado sem login)

#### WebGIS e Mapeamento
- Mapa interativo via Leaflet (OpenStreetMap base)
- Marcadores de estação com indicadores visuais de poluição (pol_a / pol_b)
- **Heatmap** interpolado com controles de intensidade e raio
- **Station Clustering**: agrupamento circular numerado
- **Record Clustering**: agrupamento de leituras por estação
- **Filtro Espacial**: polígono, retângulo e círculo (LeafletDraw + Turf.js)
- Tooltip de estação ao hover com dados em tempo real
- Modo de visualização avançada (ícones com mini-gráficos)

#### Dados e Importação
- Importação de CSV com validação e mapeamento customizável de colunas
- Exportação de dados filtrados em CSV
- Persistência local por projeto via IndexedDB (`idb`)
- Sincronização automática ao trocar de projeto

#### Analytics e Dashboard
- KPIs em tempo real: total de estações, registros, últimas atualizações
- Gráficos de distribuição e tendência (Recharts)
- Análises SQL via DuckDB-WASM (in-browser, sem round-trip)
- Painel de estatísticas descritivas por poluente

#### Assistente de IA (Multi-LLM)
- Chat conversacional com contexto dos dados ambientais carregados
- Suporte a 6 provedores: OpenAI, Anthropic, Google Gemini, DeepSeek, Zhipu, MiniMax
- Configuração in-app sem restart (troca de provedor e modelo via UI)
- Histórico de conversa por sessão

#### Design e UX
- Tema claro/escuro com glassmorphism
- Layout responsivo: mobile (drawer), tablet, desktop
- Landing page com seções Hero, Funcionalidades, Preços e FAQ
- Micro-animações e transições suaves

#### Gestão de Projetos
- Criação e seleção de projetos
- Datasets vinculados por projeto
- Painel de gerenciamento com status de dados

### 3.2 🔄 Em Desenvolvimento

- **Envibase Discovery**: motor de busca de dados ambientais públicos (IBGE, INPE, ANA)
- **Relatórios PDF**: exportação automática de relatórios formatados
- **Séries Temporais**: análise de tendências ao longo do tempo com gráficos animados
- **Alertas**: notificações quando poluentes ultrapassam thresholds configurados

### 3.3 🗓️ Backlog (Próximas Versões)

- **Integração IBAMA/INPE** via APIs públicas
- **Colaboração em tempo real** (multi-usuário por projeto)
- **Modelo preditivo**: forecasting de qualidade do ar (ARIMA / ML)
- **App mobile nativo** (React Native)
- **Exportação GeoJSON/Shapefile**
- **Integração com sensores IoT** em tempo real (MQTT)

---

## 4. Requisitos Não-Funcionais

### 4.1 Performance
- **FCP (First Contentful Paint)**: < 1.5s
- **TTI (Time to Interactive)**: < 3s
- **Capacidade**: suporte a datasets de até 100.000 registros com DuckDB-WASM
- **Lazy loading**: todos os módulos pesados carregados sob demanda

### 4.2 Segurança
- Variáveis de ambiente para chaves de API (nunca expostas no bundle)
- Firebase Security Rules restringindo acesso a dados privados por UID
- CORS configurado no backend Express
- Nenhuma chave de API hardcoded no código-fonte

### 4.3 Compatibilidade
- **Browsers**: Chrome 110+, Firefox 115+, Safari 16+, Edge 110+
- **Dispositivos**: Desktop, Tablet, Mobile (≥ 320px)
- **Sistemas**: Windows, macOS, Linux, iOS 16+, Android 12+

### 4.4 Manutenibilidade
- TypeScript em 100% do frontend
- Componentes React com separação clara de responsabilidades
- Hooks customizados para lógica reutilizável
- Serviços desacoplados (aiService, storageService)

---

## 5. Métricas de Sucesso

| Métrica | Baseline | Meta (6 meses) |
|---------|----------|----------------|
| Usuários ativos mensais | — | 200 |
| Projetos criados | — | 500 |
| Datasets importados | — | 2.000 |
| NPS | — | > 50 |
| Taxa de churn | — | < 10%/mês |
| LCP no Lighthouse | — | ≥ 90 |

---

## 6. Premissas e Restrições

### Premissas
- Usuários possuem conhecimento básico de dados tabulares (CSV)
- Dados ambientais têm pelo menos coordenadas lat/lon e pelo menos um valor numérico
- Conectividade à internet disponível (app não é 100% offline)

### Restrições
- **Budget de IA**: custos por tokens controlados pelo próprio usuário (chaves próprias)
- **Armazenamento local**: IndexedDB limitado (~500MB por origem no Chrome)
- **WASM**: DuckDB-WASM requer browser com suporte a WebAssembly (todos modernos)

---

## 7. Dependências Externas

| Serviço | Propósito | Criticidade |
|---------|-----------|-------------|
| Firebase Auth/Firestore | Autenticação e metadados | Alta |
| OpenStreetMap Tile Server | Mapa base | Alta |
| OpenAI / Anthropic / Gemini | Assistente de IA | Média (opcional) |
| Replit | Ambiente de hospedagem demo | Baixa |

---

## 8. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Custo de tokens IA elevado | Médio | Médio | Chave própria do usuário; limites de sessão |
| Escalabilidade do IndexedDB | Médio | Alto | Migrar para Supabase/S3 em versão futura |
| Breaking changes em Leaflet | Baixo | Médio | Versão fixada; testes de regressão |
| Dependência de APIs externas | Médio | Médio | Fallback offline para funcionalidades core |

---

> **Documento mantido por**: Luis Luz Quadros (IHC Research Labs)  
> **Última atualização**: Abril 2026
