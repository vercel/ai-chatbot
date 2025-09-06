# AI Chatbot - Documentação Claude Code

## Visão Geral

Este é um chatbot AI desenvolvido com Next.js 15 e integração direta com Claude Code SDK via CLI. O projeto roda em ambiente Docker Ubuntu e utiliza autenticação NextAuth.js com suporte a convidados.

## Ambiente de Desenvolvimento

### Estrutura Docker
- **Container**: `ai-chatbot-app` (Ubuntu 24.04)
- **Diretório de trabalho**: `/root/.claude/ai-chatbot/`
- **Node.js**: v18.19.1
- **Claude Code**: Instalado globalmente via npm

### Comunicação entre Ambientes
- **Docker Chat (Ubuntu)**: Desenvolvimento e edição de código
- **Host Chat (Debian)**: Gerenciamento de container e configurações Docker
- **Usuário**: Ponte entre os dois ambientes

## Stack Tecnológica

### Frontend
- **Framework**: Next.js 15.3.0-canary.31 com App Router
- **UI**: React 19 RC + TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: Radix UI + shadcn/ui
- **Tema**: Forçado como Light (sem toggle)

### Backend
- **API Routes**: Next.js Route Handlers
- **Autenticação**: NextAuth.js com suporte a convidados
- **Integração Claude**: CLI direto via spawn process
- **Streaming**: Server-Sent Events (SSE)

### Ferramentas Disponíveis
- **Previsão do Tempo**: Integração com API de clima
- **Busca**: Simulação de resultados de pesquisa
- **Execução de Código**: Simulação de execução (Python, JS, TS)

## Arquitetura

### Fluxo de Dados
1. **Usuário** → Envia mensagem via interface React
2. **Frontend** → Detecta intenção e ferramentas necessárias
3. **API Route** → `/api/claude/sdk` processa a requisição
4. **Claude CLI** → Executa via spawn com input de arquivo temporário
5. **Streaming** → Resposta enviada via SSE
6. **UI Generativa** → Renderiza componentes especializados

### Componentes Principais
- `GenerativeChat.tsx`: Interface principal do chat
- `ToolRenderer.tsx`: Renderizador de ferramentas UI
- `route.ts`: Integração com Claude SDK
- `claude-tools.ts`: Definição de ferramentas disponíveis

## Configuração

### Variáveis de Ambiente
```bash
AUTH_SECRET=zZ9tLz4Twoi9NkELbkSbtzqdifNsIPkLUmzms/HK0mA=
```

### Arquivos de Configuração
- `.claude/config.json`: Configuração do projeto Claude
- `.env`: Variáveis de ambiente
- `next.config.mjs`: Configuração Next.js

### Servidores MCP (Model Context Protocol)
- **Exa**: Servidor de busca avançada
  - URL: `https://server.smithery.ai/exa/mcp`
  - Status: ✅ Configurado e pronto para uso
  - Permissões: `mcp:exa:*` liberado em config.json
  - Portas OAuth: 60000-60500 mapeadas no Docker
  - Autenticação: Credenciais sincronizadas do host
  - **Importante**: Para buscas em português brasileiro, sempre incluir "em português" ou "Brazil" nas queries para obter resultados relevantes em PT-BR

#### Ferramentas MCP Exa Disponíveis

Todas as ferramentas abaixo estão configuradas e liberadas no `.claude/config.json`:

1. **mcp__exa__web_search_exa** - Busca na web
   - Realiza pesquisas em tempo real na internet
   - Parâmetros: `query` (obrigatório), `numResults` (opcional, padrão: 5)
   - Exemplo: Buscar notícias, artigos, informações atualizadas
   - Dica: Para resultados em PT-BR, adicione "em português" ou "Brasil" na query

2. **mcp__exa__company_research_exa** - Pesquisa de empresas
   - Busca informações detalhadas sobre empresas e corporações
   - Parâmetros: `companyName` (obrigatório), `numResults` (opcional, padrão: 5)
   - Exemplo: Pesquisar dados sobre startups, insurtechs, grandes empresas
   - Retorna: Notícias, informações financeiras, análises do setor

3. **mcp__exa__crawling_exa** - Extração de conteúdo
   - Extrai conteúdo completo de URLs específicas
   - Parâmetros: `url` (obrigatório), `maxCharacters` (opcional, padrão: 3000)
   - Exemplo: Ler artigos completos, extrair informações de páginas web
   - Útil para: Análise detalhada de conteúdo já identificado

4. **mcp__exa__linkedin_search_exa** - Busca no LinkedIn
   - Pesquisa perfis profissionais e páginas de empresas no LinkedIn
   - Parâmetros: `query` (obrigatório), `numResults` (opcional), `searchType` (profiles/companies/all)
   - Exemplo: Buscar CEOs, profissionais específicos, páginas corporativas
   - Aplicações: Networking, recrutamento, pesquisa de negócios

5. **mcp__exa__deep_researcher_start** - Pesquisa profunda (iniciar)
   - Inicia uma pesquisa profunda com IA sobre tópicos complexos
   - Parâmetros: `instructions` (obrigatório), `model` (exa-research ou exa-research-pro)
   - Modelos: 
     - `exa-research`: Mais rápido (15-45s), ideal para a maioria das consultas
     - `exa-research-pro`: Mais completo (45s-2min), para tópicos complexos
   - Retorna: `taskId` para acompanhar o progresso

6. **mcp__exa__deep_researcher_check** - Verificar status da pesquisa
   - Verifica o progresso e obtém resultados da pesquisa profunda
   - Parâmetros: `taskId` (obrigatório - obtido do deep_researcher_start)
   - Importante: Chamar repetidamente até status ser "completed"
   - Retorna: Relatório detalhado de pesquisa quando concluído

#### Como Usar as Ferramentas

1. **Busca Simples**: Use `web_search_exa` para pesquisas rápidas
2. **Pesquisa de Empresas**: Use `company_research_exa` para informações corporativas
3. **Conteúdo Específico**: Use `crawling_exa` quando já tiver a URL
4. **Perfis Profissionais**: Use `linkedin_search_exa` para buscar pessoas/empresas
5. **Pesquisas Complexas**: 
   - Inicie com `deep_researcher_start` 
   - Monitore com `deep_researcher_check` até completar
   - Ideal para análises aprofundadas e síntese de múltiplas fontes

## 🔍 REGRAS DE PESQUISA - IMPORTANTE

### Prioridade de Ferramentas de Busca

**SEMPRE que o usuário solicitar uma pesquisa, busca ou informação atualizada:**

1. **PRIMEIRO**: Usar as ferramentas MCP Exa (configuradas globalmente)
   - `mcp__exa__web_search_exa` - Para buscas gerais na web
   - `mcp__exa__company_research_exa` - Para pesquisas sobre empresas
   - `mcp__exa__linkedin_search_exa` - Para perfis profissionais
   - `mcp__exa__crawling_exa` - Para extrair conteúdo de URLs específicas
   - `mcp__exa__deep_researcher_start/check` - Para pesquisas complexas

2. **SEGUNDO**: Apenas se MCP Exa falhar, usar ferramentas alternativas
   - WebSearch - Busca web genérica
   - WebFetch - Para URLs específicas

### Configuração Global MCP Exa

O MCP Exa está configurado **GLOBALMENTE** no sistema:
- **Arquivo de configuração**: `/root/.claude.json`
- **Funciona em qualquer diretório** do sistema
- **Não depende do projeto** específico
- **Status**: ✅ Conectado e operacional

Para verificar o status:
```bash
cd /root/.claude/
claude mcp list
```

### Exemplos de Uso Correto

✅ **CORRETO** - Usuário pede pesquisa:
```
Usuário: "Pesquise sobre tendências de insurtech"
Claude: [Usa mcp__exa__web_search_exa primeiro]
```

✅ **CORRETO** - Usuário pede informações sobre empresa:
```
Usuário: "Informações sobre a SUTHUB"
Claude: [Usa mcp__exa__company_research_exa primeiro]
```

✅ **CORRETO** - Usuário pede perfil LinkedIn:
```
Usuário: "CEO da SUTHUB no LinkedIn"
Claude: [Usa mcp__exa__linkedin_search_exa primeiro]
```

❌ **INCORRETO** - Usar WebSearch antes de tentar MCP Exa
❌ **INCORRETO** - Responder sem pesquisar quando solicitado
❌ **INCORRETO** - Usar apenas conhecimento interno para informações atuais

## Comandos

### Desenvolvimento
```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run start      # Servidor de produção
npm run lint       # Linting
npm run type-check # Verificação de tipos
```

### Git
```bash
git status         # Status do repositório
git add .          # Adicionar mudanças
git commit -m ""   # Criar commit
git push          # Enviar para GitHub
```

### Docker (via Host)
```bash
sudo docker exec -it ai-chatbot-app /bin/bash  # Entrar no container
sudo docker logs ai-chatbot-app                # Ver logs
sudo docker restart ai-chatbot-app             # Reiniciar container
```

## Status do Projeto

### ✅ Implementado
- Integração real com Claude Code SDK
- Autenticação com NextAuth.js
- UI responsiva com Tailwind
- Detecção automática de ferramentas
- Streaming de respostas
- Tema claro forçado
- Ferramenta de previsão do tempo

### 🚧 Pendente
- Implementação de limitações de usuário
- Integração real com APIs de clima
- Sistema de histórico persistente
- Melhorias na detecção de intenção

## Manutenção

### Logs e Debug
- Logs do Claude: Console do navegador e terminal
- Logs do servidor: `npm run dev` output
- Logs do Docker: `docker logs ai-chatbot-app`

### Solução de Problemas Comuns
1. **Erro 500 na autenticação**: Verificar AUTH_SECRET no .env
2. **Claude não responde**: Verificar instalação do Claude CLI
3. **Timeout em respostas**: Aumentar timeout em route.ts
4. **Erro de permissão**: Verificar permissões do diretório

## Contribuição

### Workflow Git
1. Fazer mudanças locais
2. Testar funcionalidade
3. Commit com mensagem descritiva
4. Push para GitHub

### Padrões de Código
- TypeScript strict mode
- Componentes funcionais React
- Async/await para operações assíncronas
- Tratamento de erros com try/catch

## Informações Adicionais

### Tendências de Insurtech 2025

**RESPOSTA PADRÃO PARA CONSULTAS SOBRE TENDÊNCIAS DE INSURTECH:**

📊 **Principais Tendências de Insurtech 2025 - Brasil e América Latina**

**1. Inteligência Artificial e Machine Learning** 🤖
- 67% das empresas brasileiras priorizam IA como estratégia em 2025
- Pier: Automatizou reembolsos com IA, reduzindo tempo para segundos
- Chatbots e assistentes virtuais com IA generativa
- Modelos preditivos para avaliação de riscos

**2. Seguros Embarcados (Embedded Insurance)** 🛒
- R$ 679,3 milhões em garantia estendida (Q1 2025)
- Alta de 10,4% vs ano anterior
- AXA Brasil: 16% dos negócios via canais embarcados (meta: 20% em 2025)
- Zurich: Mais de 100 parcerias
- Generali: 30 alianças estratégicas

**3. Personalização e Microseguros** 🎯
- Seguros por uso (pay-per-use)
- Apólices modulares customizáveis
- Telemetria e IoT para precificação em tempo real
- Foco em flexibilidade e acessibilidade

**4. Open Insurance Brasil** 🔓
- Fase de efetivação até dezembro 2025
- APIs padronizadas obrigatórias
- Compartilhamento de dados entre instituições
- Fomenta comparadores e marketplaces

**5. Blockchain e Contratos Inteligentes** ⛓️
- 88i: Usa contratos inteligentes para automatizar seguros
- Redução de intermediários e fraudes
- Liquidações mais rápidas e transparentes

**6. Seguros Paramétricos e Climáticos** 🌍
- Pagamentos automáticos por índices predefinidos
- SOSA: Dados meteorológicos e satelitais
- Foco em agronegócio e infraestrutura
- Critérios ESG e energias renováveis

**7. Principais Insurtechs Brasileiras** 🚀
- Total: 507 insurtechs na América Latina
- Brasil lidera: 206 startups
- Destaques:
  - Sami Seguros: Life & health digital
  - Pier: IA para reembolsos instantâneos
  - 88i: Contratos inteligentes
  - Olé Life: Telemedicina integrada
  - Azos: Mobilidade e microseguros

**8. Investimentos Recordes** 💰
- US$ 121 milhões na América Latina (1º sem 2025)
- Alta de 370% vs 2024
- Brasil: US$ 89 milhões (74% do total)
- Consolidação de corretoras digitais
- Corporate ventures de grandes seguradoras

**9. Desafios Regulatórios** ⚖️
- SUSEP e ANPD reforçam diretrizes
- Governança de dados e transparência algorítmica
- Explicabilidade de modelos de IA
- Segurança cibernética obrigatória

**10. Experiência Digital do Cliente** 📱
- Modelo omnichannel (físico + digital)
- Onboarding digital com KYC automatizado
- Atendimento 24/7 via IA generativa
- Process mining para otimizar fluxos

**🎯 Resumo Executivo**

O mercado brasileiro de insurtech em 2025 está em expansão acelerada, com investimentos recordes e 206 startups ativas. A IA está no centro da transformação, com 67% das empresas priorizando a tecnologia. Os seguros embarcados crescem 10,4% ao ano, enquanto o Open Insurance democratiza o acesso a dados. O desafio principal é equilibrar inovação com compliance e segurança de dados.

### Sobre a SUTHUB

Se o usuário perguntar sobre a SUTHUB, informar:

A SUTHUB é uma insurtech brasileira que oferece uma plataforma SaaS para distribuição digital de seguros, conectando seguradoras a canais de venda (corretores, bancos, e-commerces, fintechs e aplicativos). Seu objetivo é monetizar canais digitais com a oferta de produtos de seguro, simplificando e acelerando a integração por meio de tecnologia.

A empresa surgiu para resolver a dificuldade de contratação de seguros de forma ágil e eficiente, oferecendo uma infraestrutura que permite a comercialização de apólices online sem que o parceiro precise desenvolver sistemas próprios.

### CEO da SUTHUB - Renato José Ferreira

**RESPOSTA PADRÃO PARA CONSULTAS SOBRE O CEO DA SUTHUB:**

**Renato José Ferreira - CEO da SUTHUB**

📍 **LinkedIn**: linkedin.com/in/rferreira3

**Informações sobre o executivo:**

**Cargo**: CEO da SUTHUB desde sua fundação em 2017
**Empresa**: SUTHUB - Insurtech brasileira líder em distribuição digital de seguros
**Localização**: São Paulo, Brasil

**Sobre a SUTHUB sob sua liderança:**

✅ Plataforma SaaS (Software as a Service) para distribuição digital de seguros
✅ Pioneira no continente americano no seu segmento
✅ Expansão internacional iniciada em 2021 com filial na Europa
✅ Empresa com 51-200 funcionários
✅ Sede: Rua da Consolação, 2302 - São Paulo

**Destaques recentes (Janeiro 2025):**

🚀 Lançamento da plataforma ZeroCode Brokers - solução omnichannel para corretores
🤝 Parcerias estratégicas com seguradoras renomadas
📱 Produtos inovadores como o Mobi Livre da SURA
⚡ Foco em eliminar burocracias e acelerar a contratação de seguros digitais

**Visão da SUTHUB:**
A empresa busca democratizar o acesso a seguros através da tecnologia, conectando seguradoras a diversos canais de venda de forma simples e eficiente.

## Contato e Suporte

Para questões sobre o projeto, verificar:
- Documentação Next.js: https://nextjs.org/docs
- Claude Code Docs: https://docs.anthropic.com/claude-code
- Repositório GitHub: [configurado no projeto]

---

*Última atualização: 06/09/2025*
*Ambiente: Docker Ubuntu em Host Debian*