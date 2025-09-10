# YSH AI Chatbot

Este é um chatbot de IA para pré-vendas de energia solar, construído com Next.js 15, React 19, TypeScript e Vercel AI SDK.

## Documentação

Toda a documentação do projeto está organizada na pasta [`docs/`](./docs/):

- [README Principal](./docs/README.md) - Visão geral e guia de instalação
- [AI Gateways](./docs/AI_GATEWAYS_README.md) - Configuração de provedores de IA
- [Docker Setup](./docs/DOCKER_SETUP.md) - Configuração com Docker/FOSS
- [Load Balancing](./docs/LOAD_BALANCING_README.md) - Sistema de balanceamento de carga
- [Personas Blueprint](./docs/PERSONAS_BLUEPRINT.md) - Sistema de personas do usuário
- [UI Components](./docs/UI_COMPONENTS_MAPPING.md) - Mapeamento de componentes
- [Microcopy Library](./docs/MICROCOPY_LIBRARY.md) - Biblioteca de microcopies reutilizáveis
- [Environment Variables](./docs/env.md) - Configuração de variáveis de ambiente

## Estrutura do Projeto

```text
├── app/                 # Next.js App Router
├── components/          # Componentes React reutilizáveis
├── lib/                 # Lógica de negócio e utilitários
├── config/              # Configurações organizadas
│   ├── docker/         # Configurações Docker
│   └── playwright/     # Configurações Playwright
├── docs/                # Documentação completa
├── tests/               # Testes automatizados
└── scripts/             # Scripts utilitários
```

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Executar em modo desenvolvimento
pnpm dev

# Executar testes
pnpm test

# Build para produção
pnpm build
```

Para mais informações detalhadas, consulte a [documentação completa](./docs/README.md).
