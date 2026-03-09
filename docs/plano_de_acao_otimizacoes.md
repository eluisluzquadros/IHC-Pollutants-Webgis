# Plano de Ação e Otimizações

Este documento descreve as próximas etapas de melhoria (otimizações) planejadas para o IHC Pollutants WebGIS, divididas por horizonte de tempo.

## 1. Curto Prazo (Próximas Sprints)
- **Melhoria no Tratamento de Erros da IA**: Implementar retentativas (retries) silenciosas e fallbacks automáticos caso um provedor de LLM falhe ou atinja o limite de taxa (rate limit).
- **Filtros Avançados de Interface**: Adicionar controles finos de filtragem no Analytics Dashboard, permitindo seleções por raio de quilometragem e intervalo de datas customizados direto na UI.
- **Otimização de Renderização do Mapa**: Debounce e throttling em eventos do mapa (zoom, pan) para reagrupar clusters de forma mais leve, melhorando a experiência em dispositivos móveis.

## 2. Médio Prazo
- **Suporte a Múltiplos Formatos de Upload**: Permitir a importação fluida de arquivos `GeoJSON`, `KML` e planilhas Excel (`XLSX`), convertendo nativamente para a estrutura interna padronizada.
- **Adoção do Banco de Dados Relacional**: Finalizar a integração com PostgreSQL (via Drizzle ORM, já parcialmente implementado) permitindo o armazenamento de dados centralizado no servidor.
- **Autenticação, Automação e Deploy CI/CD**: Implementar sistema de contas de usuários, assim como pipelines automatizados de lint e testes no GitHub Actions.

## 3. Longo Prazo
- **Integração IoT em Tempo Real**: Habilitar via WebSockets a conexão de sensores na infraestrutura para alimentar visualizações do WebGIS de modo push live (streaming de dados ambientais).
- **RAG + Vector DB Integrado a Documentos OFICIAIS**: Conectar o AI Assistant a uma base de dados vetorial de Leis Ambientais Regionais e Relatórios Governamentais em PDF, criando um analista AI completo.
- **Exportação de Dossiês**: Geração automática de relatórios gerenciais profissionais exportados em PDF e DOCX, orquestrando gráficos interativos, views de mapas e o sumário discursivo gerado pela IA.
