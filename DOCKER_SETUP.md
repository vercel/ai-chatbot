# Setup FOSS via Docker para ai-ysh

Este guia explica como configurar e executar a aplicação usando soluções Free and Open Source Software (FOSS) via Docker.

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js e pnpm (para desenvolvimento local)

## Serviços FOSS Utilizados

- **PostgreSQL**: Banco de dados relacional
- **Redis**: Cache e armazenamento de sessões
- **MinIO**: Armazenamento de objetos (S3-compatible)
- **Ollama**: Modelos de IA locais

## Configuração

1. **Clone o repositório e navegue para o diretório:**

   ```bash
   git clone <repo-url>
   cd ai-ysh
   ```

2. **Copie o arquivo de exemplo de ambiente:**

   ```bash
   cp .env.example .env.local
   ```

3. **Edite o .env.local com suas configurações:**

   - Gere um AUTH_SECRET aleatório
   - As outras variáveis já estão configuradas para os serviços locais

4. **Execute o Docker Compose:**

   ```bash
   docker-compose up -d
   ```

   Isso iniciará todos os serviços em background.

5. **Configure o Ollama (opcional, para IA local):**

   - Acesse <http://localhost:11434> para o Ollama
   - Baixe modelos como `ollama pull llama2`

6. **Execute as migrações do banco de dados:**

   ```bash
   docker-compose exec app pnpm db:migrate
   ```

7. **Acesse a aplicação:**
   - Frontend: <http://localhost:3000>
   - MinIO Console: <http://localhost:9001> (usuário: minioadmin, senha: minioadmin)

## Comandos Úteis

- **Parar os serviços:**

  ```bash
  docker-compose down
  ```

- **Ver logs:**

  ```bash
  docker-compose logs -f
  ```

- **Reiniciar um serviço específico:**

  ```bash
  docker-compose restart <service-name>
  ```

- **Executar comandos na aplicação:**

  ```bash
  docker-compose exec app <command>
  ```

## Desenvolvimento

Para desenvolvimento, você pode executar a aplicação localmente enquanto os serviços rodam no Docker:

```bash
pnpm dev
```

Certifique-se de que as variáveis de ambiente no .env.local apontem para os serviços Docker (localhost:porta).

## Notas

- Os dados dos serviços são persistidos em volumes Docker nomeados.
- Para produção, ajuste as senhas e configurações de segurança.
- Para IA, você pode usar modelos locais via Ollama ou configurar um gateway para APIs externas.
