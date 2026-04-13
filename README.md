# 🌱 Envibase — Plataforma de Inteligência Ambiental

**Sistema de Gerenciamento de Dados Ambientais (SGDA) de próxima geração**, combinando mapeamento interativo WebGIS, análise por IA e visualização profissional de dados de poluição.

[![Envibase Platform](https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80)](https://github.com/eluisluzquadros/IHC-Pollutants-Webgis)

🔗 **Repositório GitHub**: [github.com/eluisluzquadros/IHC-Pollutants-Webgis](https://github.com/eluisluzquadros/IHC-Pollutants-Webgis)

🔗 **Repositório Bitbucket (desafio técnico)**: [bitbucket.org/ihc-background/desafio_tecnico](https://bitbucket.org/ihc-background/desafio_tecnico/src/main/)

🔗 **Demo Replit**: [ihc-pollutants-webgis-eluzquadros.replit.app](https://ihc-pollutants-webgis-eluzquadros.replit.app)

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Formato dos Dados](#-formato-dos-dados)
- [Stack Tecnológica](#️-stack-tecnológica)
- [Sistema de Design](#-sistema-de-design)
- [Deploy](#-deploy)
- [Contribuição](#-contribuição)

---

## 🌍 Visão Geral

A **Envibase** é uma plataforma SGDA nativa na nuvem desenvolvida pelo **Instituto Hidrocarboneto (IHC)**. Ela consolida dados geoespaciais, medições de sensores e relatórios ambientais em uma única interface moderna e colaborativa.

### Rotas da Aplicação

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `LandingPage` | Página institucional com planos, FAQ e CTA |
| `/platform` | `ProfessionalWebGISApp` | Plataforma WebGIS completa (requer login) |
| `/discovery` | `EnvibaseDiscovery` | Motor de descoberta de dados ambientais |

---

## 🚀 Funcionalidades

### 🤖 Assistente de IA (Multi-LLM)
- **Consulta em Linguagem Natural**: "Mostre estações com poluição acima de 5 µg/m³"
- **Análise de Dados Inteligente**: Interpretação contextual de dados ambientais
- **Multi-provider**: Suporte a OpenAI, Anthropic, Google Gemini, DeepSeek, Zhipu e MiniMax
- **Configuração via UI**: Troca de provedor e modelo em tempo real (sem reinicialização)

### 🗺️ Interface WebGIS Profissional
- **Layout CSS Grid**: Proporcão padrão da indústria — 25% sidebar + 75% canvas de mapa
- **Controles de Camada**: Marcadores, heatmaps, clustering e contagem de registros
- **Heatmap Interpolado**: Gradiente suave (verde → amarelo → laranja → vermelho) via `leaflet.heat`
- **Clustering Real**: Agrupamento circular numerado via `leaflet.markercluster`
- **Filtro Espacial**: Seleção por retângulo, polígono e círculo (LeafletDraw + Turf.js)
- **Responsivo**: Drawer mobile + layout desktop completo

### 📊 Dashboard de Analytics
- **KPIs em Tempo Real**: Total de estações, registros, médias de poluição
- **Gráficos Interativos**: Barras, tendências e distribuição via Recharts
- **Análise SQL via DuckDB-WASM**: Filtragem analítica in-browser sem servidor
- **Exportação CSV**: Dados filtrados exportáveis em um clique

### 📁 Gestão de Dados e Projetos
- **Importação Flexível**: CSV com mapeamento de colunas customizável
- **Projetos Isolados**: Separação de datasets por projeto (IndexedDB local)
- **Autenticação Google**: Login com conta Google via Firebase Auth
- **Armazenamento Local**: Dados persistidos no browser via `idb`

### 🎨 Design Premium
- **Tema Claro/Escuro**: Alternância sem reinicialização com `prefers-color-scheme`
- **Glassmorphism**: Efeitos de vidro fosco no sidebar e modais
- **Micro-animações**: Transições suaves e estados de loading profissionais
- **Acessibilidade**: Contraste adequado e navegação por teclado

---

## 🏗️ Arquitetura

```
IHC-Pollutants-Webgis/
├── src/                          # Frontend React + TypeScript
│   ├── components/               # Componentes React
│   │   ├── LandingPage.tsx       # Página inicial / marketing
│   │   ├── ProfessionalWebGISApp.tsx  # App principal WebGIS
│   │   ├── MapContainer.tsx      # Mapa interativo (Leaflet)
│   │   ├── ChatBot.tsx           # Interface do assistente IA
│   │   ├── PollutionDashboard.tsx # Dashboard de analytics
│   │   ├── DataImportPanel.tsx   # Importação e mapeamento de CSV
│   │   ├── EnvibaseFilterPanel.tsx # Filtros avançados de dados
│   │   ├── EnvibaseDiscovery.tsx # Módulo de descoberta de dados
│   │   ├── LLMSettings.tsx       # Configuração de provedores IA
│   │   ├── SlimSidebar.tsx       # Navegação lateral compacta
│   │   ├── StatisticsPanel.tsx   # Estatísticas descritivas
│   │   ├── ProjectManagerPanel.tsx # Gestão de projetos
│   │   └── ui/                   # Componentes ShadCN/UI
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Estado de autenticação (Firebase)
│   │   ├── DuckDBContext.tsx      # Engine SQL in-browser (DuckDB-WASM)
│   │   └── MapCommandContext.tsx  # Comandos de mapa via IA
│   ├── hooks/
│   │   └── useDuckDBAnalytics.ts  # Hook para análises SQL
│   ├── services/
│   │   ├── aiService.ts           # Integração multi-LLM
│   │   └── storageService.ts      # Persistência IndexedDB
│   ├── utils/
│   │   └── csvImporter.ts         # Parser e validador de CSV
│   └── types/                     # Tipos TypeScript globais
├── server/                        # Backend Node.js + Express
│   ├── server.js                  # API Express com integração OpenAI
│   ├── db.js                      # Configuração do banco de dados
│   └── services/                  # Serviços do backend
├── maps/                          # Demo offline estático
│   └── mapa.html                  # Versão HTML pura para consulta offline
├── data-sample/                   # Dados de exemplo para testes
├── docs/                          # Recursos de documentação
├── public/                        # Assets estáticos
├── .env.example                   # Template de variáveis de ambiente
├── firebase.json                  # Configuração Firebase Hosting
├── firestore.rules                # Regras de segurança Firestore
└── vite.config.ts                 # Configuração do Vite (porta 5000, proxy)
```

---

## ⚡ Instalação

### Pré-requisitos
- **Node.js** v18+
- **npm** 9+
- Pelo menos **uma** chave de API de LLM (OpenAI recomendado)

### 1. Clone o repositório

```bash
# GitHub
git clone https://github.com/eluisluzquadros/IHC-Pollutants-Webgis.git

# Bitbucket (desafio técnico)
git clone https://bitbucket.org/ihc-background/desafio_tecnico.git

cd IHC-Pollutants-Webgis
```

### 2. Instale as dependências

```bash
# Frontend
npm install

# Backend (IA)
cd server && npm install && cd ..
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas chaves:

```bash
# Obrigatório — ao menos um provedor LLM
OPENAI_API_KEY=sk-...

# Opcional — outros provedores
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
DEEPSEEK_API_KEY=

# Provedor e modelo padrão
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
```

### 4. Inicie os servidores

```bash
# Terminal 1: Backend IA (porta 3001)
cd server && npm start

# Terminal 2: Frontend (porta 5000)
npm run dev
```

Acesse: **http://localhost:5000**

---

## 📊 Formato dos Dados

A plataforma aceita arquivos CSV com o seguinte esquema padrão:

```csv
station_id,station_name,lat,lon,sample_dt,pol_a,pol_b,unit
ST001,Estação Alpha,-23.5505,-46.6333,2024-01-15,4.2,3.8,µg/m³
ST002,Estação Beta,-23.5489,-46.6388,2024-01-15,6.1,5.4,µg/m³
```

### Colunas Obrigatórias

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `station_id` | string | Identificador único da estação |
| `station_name` | string | Nome de exibição da estação |
| `lat` | float | Latitude (graus decimais) |
| `lon` | float | Longitude (graus decimais) |
| `sample_dt` | string | Data da amostra (ISO 8601) |
| `pol_a` | float | Nível de poluente A (numérico) |
| `pol_b` | float | Nível de poluente B (numérico) |
| `unit` | string | Unidade (ex: `µg/m³`, `ppm`) |

> **Dica**: O painel de importação suporta mapeamento customizado de colunas — você pode usar nomes diferentes dos padrão.

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 18.2 | Framework UI |
| TypeScript | 5.8 | Tipagem estática |
| Vite | 6.2 | Build tool e dev server |
| Tailwind CSS | 3.4 | Estilização utilitária |
| ShadCN/UI | latest | Componentes acessíveis |
| Leaflet | 1.9 | Mapeamento interativo |
| MapLibre GL JS | 5.7 | Renderização de camadas vetoriais |
| Recharts | 3.2 | Gráficos interativos |
| DuckDB-WASM | 1.33 | Analytics SQL in-browser |
| Framer Motion | 11 | Animações |
| Firebase | 12 | Auth + Firestore |
| Turf.js | 7.3 | Análise geoespacial |
| React Router | 6.23 | Roteamento SPA |

### Backend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Node.js | 18+ | Runtime |
| Express.js | 4 | Framework HTTP |
| OpenAI SDK | 5.23 | Integração GPT |
| CORS | — | Comunicação cross-origin |

---

## 🎨 Sistema de Design

### Paleta de Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `landing-primary` | `#2E5BFF` | Azul principal, CTAs |
| `landing-navy` | `#0A192F` | Texto e fundo escuro |
| `landing-emerald` | `#00C853` | Plano recomendado, success |
| `landing-vibrant` | `#00E676` | Destaques, gradientes |
| `landing-paper` | `#F8F9FA` | Fundo claro |

### Indicadores de Poluição

| Nível | Faixa | Cor |
|-------|-------|-----|
| Baixo | < 3 | Verde (`#10B981`) |
| Médio | 3–7 | Amarelo/Laranja (`#F59E0B`) |
| Alto | > 7 | Vermelho (`#EF4444`) |

### Breakpoints Responsivos

| Dispositivo | Faixa | Layout |
|-------------|-------|--------|
| Mobile | < 1024px | Drawer + overlay |
| Tablet | 1024–1279px | Collapsible sidebar |
| Desktop | ≥ 1280px | Sidebar fixa + mapa em tela cheia |

---

## 🚀 Deploy

### Build de Produção

```bash
npm run build
# Saída em ./dist/
```

### Replit (configurado)
- **Porta**: 5000 (frontend Vite)
- **Proxy**: `/api/*` → backend Express
- **Secrets**: `OPENAI_API_KEY` injetado automaticamente
- **Comando de build**: `npm run build`
- **Comando de start**: `npm run preview`

### Firebase Hosting

```bash
npm run build
firebase deploy
```

### Auto-hospedado

```bash
# Frontend (pasta dist/ → CDN/static hosting)
npm run build

# Backend
cd server && npm install --production && node server.js
```

### Demo Offline

```bash
# Servir versão estática
cd maps && python -m http.server 8000
# Acesse: http://localhost:8000/mapa.html
```

---

## 🤝 Contribuição

1. **Fork** do repositório
2. Crie uma branch: `git checkout -b feature/minha-funcionalidade`
3. Configure as variáveis de ambiente localmente
4. Faça suas alterações e teste (frontend + backend + IA)
5. Commit com mensagem descritiva: `git commit -m "feat(map): add polygon spatial filter"`
6. Push e abra um Pull Request

### Áreas prioritárias para contribuição
- 🤖 Novos provedores LLM e prompts contextuais
- 🗺️ Novos tipos de visualização (isócronas, choropleth)
- 📊 Análises estatísticas avançadas (box-plot, série temporal)
- 🌐 Integração com catálogos de dados públicos (IBGE, INPE, ANA)
- ♿ Melhorias de acessibilidade (WCAG 2.1 AA)

---

## 📄 Licença

MIT License — consulte o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- **OpenAI / Anthropic / Google** — Motores de IA
- **Leaflet + MapLibre** — Ecossistema de mapeamento
- **ShadCN/UI** — Biblioteca de componentes
- **DuckDB** — Analytics in-browser
- **Firebase** — Auth e infraestrutura
- **OpenStreetMap** — Tiles de mapa base
- **Instituto Hidrocarboneto (IHC)** — Patrocinador e contexto de uso

---

> **Desenvolvido com ❤️ para monitoramento ambiental e inteligência de dados geoespaciais**
>
> Instituto Hidrocarboneto (IHC) · © 2026
