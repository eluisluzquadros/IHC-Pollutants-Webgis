# Especificação Técnica — Painel de Filtros (Envibase)

## 1) Objetivo
Implementar no projeto Django (já existente) um **painel lateral de filtragem** para pesquisa de dados ambientais. O painel deve:
- Forçar o usuário a definir o **universo** de busca via **Escopo(s) + Projeto(s)** antes de habilitar os demais filtros.
- Permitir **seleção múltipla** de escopos e projetos.
- Gerar um **payload estruturado** e disparar uma busca no backend.
- Atualizar os resultados do app (mapa/tabela) com base nos filtros selecionados.

---

## 2) UX/Fluxo (Estados)

### 2.1 Estado “Travado” (default)
- **Condição**: `selected_scopes.length === 0` **OU** `selected_projects.length === 0`
- **Efeito**:
  - bloco de filtros (Região/Período/Ambiente/Ecossistema/Matriz/Parâmetros) fica **desabilitado** (opacidade + sem clique)
  - mensagem: “Selecione um escopo e um ou mais projetos…”

### 2.2 Estado “Liberado”
- **Condição**: `selected_scopes.length >= 1` **E** `selected_projects.length >= 1`
- **Efeito**:
  - filtros ficam habilitados
  - `lockNote`: “Escopos: X • Projetos: Y”

---

## 3) Componentes do painel (regras)

### 3.1 Escopo (não numerado) — Cards Toggle Multi
- **Componentes**: 4 cards clicáveis:
  - `meus_projetos`, `compartilhados`, `favoridos`, `dados_publicos`
- **Regras**:
  - multi-select (toggle)
  - ao desmarcar um escopo, remover automaticamente projetos selecionados pertencentes a esse escopo

### 3.2 Projetos (lista + busca) — Multi-select
- **Lista**: mostra projetos dos escopos ativos, com:
  - `name`
  - `updated_at` (data de atualização)
  - `rating` (apenas para favoritos e dados públicos)
- **Busca**: filtra por `name` (e opcionalmente por escopo).
- **Seleção**: multi, usando id estável `scope::project_id` (ou `scope::slug`).

### 3.3 Região (Seção 1)
- Campos:
  - país, estado, cidade
- UI breadcrumb atualiza conforme seleção.

### 3.4 Período (Seção “Período”)
- `date_start` e `date_end` (`type="date"`)
- Validar: `date_start <= date_end` (frontend e backend)

### 3.5 Ambiente (Seção 2) — Chips Multi
- `continental`, `costeiro`, `oceanico`
- **Estado inicial**: nenhum selecionado
- **Regra**: Ecossistemas só aparece se `envs.length >= 1`

### 3.6 Ecossistema (Seção 3) — Lista Multi com busca
- Busca em: PT/EN/descrição/categoria (normalizar: lower + remove acento)
- Filtra por envs selecionados (inclui transição: item aparece se **ANY** env do item estiver ativo)

### 3.7 Matriz e Parâmetros (Seção 4)

**Matriz**
- Chips multi: `solo`, `sedimento`, `agua`, `agua_subterranea`, `biota`
- Se `biota` ativo, mostrar subchips multi: camarão, baleia, tartaruga, mexilhão, caranguejo, golfinho, pinguim.

**Parâmetros**
- Accordion por categoria
- Busca filtra categorias e itens
- Seleção multi

### 3.8 Filtros Selecionados (Seção 5)
- Chips removíveis para:
  - escopos selecionados
  - projetos selecionados
  - matriz/biota
  - env/ecossistemas
  - parâmetros
  - (opcional) período e região (pode virar chips também)
- Remover escopo remove seus projetos.

### 3.9 Botões
- **Limpar**: zera tudo e volta para estado “Travado”
- **Aplicar Filtros**: envia payload ao backend e atualiza resultados

---

## 4) Dados obrigatórios do “Escopo/Projetos”

### 4.1 Campos necessários por projeto (retorno backend)
- `id`
- `scope` (enum)
- `name`
- `updated_at` (exibir formatado dd/mm/yyyy)
- `rating` (somente se scope em `{favoridos, dados_publicos}`)
  - `stars` (1–5)
  - `count` (int)

### 4.2 Regra de avaliação
- Rating **só aparece** para:
  - favoritos
  - dados públicos

---

## 5) Payload (contrato frontend → backend)
Recomendação: **POST JSON** em `/api/search/`

```json
{
  "scopes": ["meus_projetos", "dados_publicos"],
  "projects": [
    {"scope": "dados_publicos", "project_id": 18},
    {"scope": "meus_projetos", "project_id": 2}
  ],
  "region": {
    "country": "Brasil",
    "state": "São Paulo",
    "city": "Santos"
  },
  "date_range": {
    "start": "2025-01-01",
    "end": "2026-12-31"
  },
  "envs": ["costeiro", "oceanico"],
  "ecosystems": ["estuário", "mar"],
  "matrices": ["agua", "biota"],
  "biota": ["mexilhao", "tartaruga"],
  "parameters": [
    {"category": "Metais Totais", "name": "Ferro (Fe)"},
    {"category": "HPAs", "name": "Benzo(a)pireno"}
  ]
}
```

**Observações de contrato**
- `scopes[]` e `projects[]` são **obrigatórios** para liberar a busca (ver regra de “travamento”).
- `projects[]` deve ser validado no backend com permissões por projeto/escopo (ver item 7).
- Recomenda-se que `projects[]` use `project_id` (inteiro/UUID) em vez de nome, para evitar colisões.
- `ecosystems[]`: pode ser lista de `ecosystem_id` (preferível) ou nomes padronizados, desde que o backend normalize.
- `parameters[]`: pode ser lista de `parameter_id` (preferível) ou `{category, name}` como no protótipo.

---

## 6) Endpoints recomendados (Django/DRF)

### 6.1 Catálogos / UI
- `GET /api/scopes/`
  - Retorna os 4 escopos possíveis (`id`, `label`, `desc`)
- `GET /api/projects/?scopes=meus_projetos,dados_publicos&q=ana`
  - Retorna projetos filtrados por escopo(s) e busca
  - Campos por projeto:
    - `id`, `scope`, `name`, `updated_at`
    - `rating` somente para `favoridos` e `dados_publicos`:
      - `stars` (1–5), `count` (int)
- (Opcional) `GET /api/catalog/ecosystems?envs=costeiro,oceanico&q=estu`
- (Opcional) `GET /api/catalog/parameters?q=ferro`

**Notas**
- Catálogos podem ser cacheados (ex.: Redis) e expostos com paginação se necessário.

### 6.2 Busca
- `POST /api/search/`
  - Recebe o payload do item 5
  - Retorna:
    - resultados paginados (registros/amostras/estações, conforme seu domínio)
    - `total_count`
    - (opcional) agregações para UI (contagens por parâmetro/matriz/projeto, etc.)

**Resposta sugerida (exemplo)**
```json
{
  "total_count": 12543,
  "page": 1,
  "page_size": 50,
  "results": [
    {
      "id": 99123,
      "project_id": 18,
      "project_name": "Dados ANA",
      "sample_date": "2026-03-01",
      "matrix": "agua",
      "parameter": "Ferro (Fe)",
      "value": 0.12,
      "unit": "mg/L",
      "location": {"lat": -23.96, "lon": -46.33}
    }
  ],
  "facets": {
    "matrices": {"agua": 8021, "sedimento": 4522},
    "parameters": {"Ferro (Fe)": 1201, "Chumbo (Pb)": 988}
  }
}
```

---

## 7) Regras de permissão (backend)
Ao receber `projects[]`, validar projeto a projeto:

- `meus_projetos`: usuário é `owner`
- `compartilhados`: usuário consta em `ProjectShare` (ou regra equivalente)
- `favoridos`: usuário favoritou **e** possui acesso ao projeto (owner/share) **OU** favorito de dataset público (decidir regra do produto)
- `dados_publicos`: projeto/dataset marcado como público (`is_public=True`)

**Erro**
- Se qualquer projeto não for acessível:
  - retornar `403 Forbidden` (ou `400 Bad Request` com detalhes)
  - incluir lista dos `project_id` recusados e motivo (para debug)

---

## 8) Performance / Observações
- **Índices recomendados**
  - `project_id` (FK) indexado
  - campo de data (`sample_date`/`collected_at`) indexado
  - se existir tabela grande de resultados analíticos: índice composto `(project_id, sample_date)` e/ou `(project_id, parameter_id)`
- **Paginação**
  - sempre paginar `results` em `/api/search/`
- **Cache**
  - cache de catálogos (`/api/projects`, `/api/catalog/*`) com TTL
- **Debounce**
  - manter debounce (150–250ms) para inputs de busca no frontend
- **Normalização**
  - normalizar termos (lowercase, remover acento) para busca textual no frontend e no backend quando aplicável
- **Validações**
  - validar `date_start <= date_end`
  - se apenas um dos dois for enviado, aplicar filtro aberto (>= start) ou (<= end)

---

## 9) Critérios de aceite (QA)
1. Com `scopes=[]` **ou** `projects=[]`, filtros abaixo permanecem travados (UI e funcionalmente).
2. Multi-seleção funciona para escopos e projetos (toggle).
3. Ao remover um escopo, os projetos daquele escopo são automaticamente removidos da seleção.
4. Cada projeto exibe `updated_at` (dd/mm/aaaa) sempre que disponível.
5. Rating aparece **somente** em `favoridos` e `dados_publicos` (e somente quando houver rating).
6. Ambiente sem seleção → lista de ecossistemas não aparece (mensagem orientando).
7. “Limpar” retorna ao estado inicial travado.
8. “Aplicar Filtros” envia o payload do item 5; backend retorna resultados coerentes e respeita permissões.
