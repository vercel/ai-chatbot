# Melhorias de Segurança - Claude Chat API

## Visão Geral

Este documento descreve as melhorias de segurança implementadas na API cc-sdk-chat para proteger contra ataques comuns e garantir operação segura.

## 🔐 Melhorias Implementadas

### 1. Validação Robusta de Session ID

**Arquivo:** `security_models.py`, `session_validator.py`

**Características:**
- ✅ Validação de formato UUID rigorosa com regex
- ✅ Verificação de versão UUID (aceita v1, v3, v4, v5)
- ✅ Rejeição de UUIDs nulos ou templates
- ✅ Normalização automática de entrada
- ✅ Validação de existência no sistema
- ✅ Score de segurança baseado em múltiplos fatores

**Exemplo de Uso:**
```python
# Antes (inseguro)
session_id = request_data.get('session_id')  

# Depois (seguro)
secure_data = SecureChatMessage.parse_obj(request_data)
session_id = secure_data.session_id  # Validado e sanitizado
```

### 2. Sanitização de Mensagens

**Arquivo:** `security_models.py`

**Proteções:**
- ✅ Escape de HTML para prevenir XSS
- ✅ Remoção de caracteres de controle perigosos
- ✅ Detecção e remoção de scripts maliciosos
- ✅ Validação de tamanho máximo (50KB)
- ✅ Filtragem de padrões Javascript/VBScript

**Padrões Bloqueados:**
```
<script>, javascript:, data:text/html, vbscript:
onload=, onerror=, onclick=
```

### 3. Rate Limiting Avançado

**Arquivo:** `rate_limiter.py`, `security_middleware.py`

**Características:**
- ✅ Suporte Redis + fallback in-memory
- ✅ Limites por endpoint específico
- ✅ Detecção de rajadas (burst detection)
- ✅ Bloqueio temporário de IPs suspeitos
- ✅ Limpeza automática de dados antigos

**Limites Por Endpoint:**
```
/api/chat: 30 req/min (5 burst)
/api/session: 60 req/min (10 burst)  
/api/analytics: 20 req/min (5 burst)
Padrão: 100 req/min (20 burst)
```

### 4. Headers de Segurança

**Arquivo:** `security_models.py`, `security_middleware.py`

**Headers Aplicados:**
```
Content-Security-Policy: Configuração restritiva
X-Content-Type-Options: nosniff  
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: HSTS habilitado
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: Permissões mínimas
```

### 5. Validação CORS Segura

**Arquivo:** `security_middleware.py`

**Características:**
- ✅ Whitelist rigorosa de origens
- ✅ Validação de referer e origin
- ✅ Headers permitidos restritivos
- ✅ Bloqueio automático de origens não autorizadas

**Origens Permitidas:**
```
http://localhost:3082
http://localhost:3000  
http://127.0.0.1:3082
https://suthub.agentesintegrados.com
http://suthub.agentesintegrados.com
```

### 6. Detecção de Ataques

**Arquivo:** `security_middleware.py`

**Tipos Detectados:**
- ✅ **SQL Injection:** UNION, SELECT, DROP, etc.
- ✅ **XSS:** `<script>`, `javascript:`, handlers
- ✅ **Path Traversal:** `../`, `/etc/passwd`, etc.
- ✅ **Command Injection:** `;`, `|`, `bash`, `curl`, etc.

### 7. Middleware de Segurança

**Arquivo:** `security_middleware.py`

**Funcionalidades:**
- ✅ Validação de tamanho de request (max 50MB)
- ✅ Bloqueio de User-Agents suspeitos
- ✅ Limite no número de headers (max 50)
- ✅ Validação de Content-Type
- ✅ Log estruturado de violações

### 8. Validação de Entrada Robusta

**Arquivo:** `security_models.py`

**Modelos Seguros:**
- `SecureChatMessage`: Mensagens sanitizadas
- `SecureSessionAction`: Ações com UUID validado
- `SecureSessionConfigRequest`: Configurações validadas

## 🛠️ Configuração

### Variáveis de Ambiente

```bash
# Redis para Rate Limiting (opcional)
REDIS_URL=redis://localhost:6379

# Nível de Log
LOG_LEVEL=INFO

# Configuração da API
HOST=127.0.0.1
PORT=8989
```

### Inicialização

```python
# rate_limiter é inicializado automaticamente
# Usa Redis se disponível, senão fallback in-memory

# Middleware aplicado na ordem:
1. ErrorHandlingMiddleware
2. SecurityMiddleware  
3. CORSSecurityMiddleware
4. CORSMiddleware (fallback)
```

## 🔍 Endpoints de Segurança

### 1. Validação de Sessão

```http
GET /api/security/session-validation/{session_id}
```

Retorna score de segurança (0-100) e issues encontradas.

### 2. Scan de Sessões Suspeitas

```http
GET /api/security/suspicious-sessions
```

Identifica sessões com problemas:
- Formato UUID inválido
- Arquivos muito grandes (>50MB)
- Sessões antigas (>30 dias)
- Arquivos vazios ou corrompidos

### 3. Limpeza de Sessões

```http
POST /api/security/cleanup-sessions?execute=true
```

Remove sessões inválidas (dry-run por padrão).

### 4. Status Rate Limiting

```http
GET /api/security/rate-limit-status
```

Mostra status atual de rate limiting do cliente.

## 🔴 Bloqueios e Alertas

### Condições de Bloqueio

1. **Rate Limit Exceeded:** IP bloqueado por 5-60 minutos
2. **Attack Pattern:** Bloqueio imediato por padrões suspeitos  
3. **Invalid Origin:** CORS violation, request rejeitada
4. **Malformed Request:** Headers inválidos ou payload malicioso

### Logs de Segurança

```json
{
  "event": "security_violation",
  "client_ip": "192.168.1.100", 
  "violation_type": "xss_attempt",
  "risk_level": "high",
  "action": "blocked",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📊 Monitoramento

### Métricas Coletadas

- Requests bloqueadas por rate limiting
- Ataques detectados por tipo
- IPs bloqueados e duração
- Score médio de segurança das sessões
- Tamanho de payload por endpoint

### Health Checks

O endpoint `/health/detailed` inclui status de segurança:

```json
{
  "security": {
    "rate_limiter_backend": "redis|memory",
    "blocked_ips_count": 5,
    "suspicious_sessions": 12,
    "attack_blocks_last_hour": 3
  }
}
```

## ⚠️ Considerações de Performance

### Impacto Estimado

- **Rate Limiting:** +2-5ms por request
- **Validação de Entrada:** +1-3ms por request  
- **Detecção de Ataques:** +3-8ms por request
- **Headers de Segurança:** +0.5ms per request

### Otimizações

- Cache de validações UUID recentes
- Redis para rate limiting distribuído
- Regex compilados para detecção rápida
- Cleanup automático de dados antigos

## 🚀 Próximos Passos

### Melhorias Futuras

1. **Autenticação JWT:** Tokens seguros por usuário
2. **Audit Log:** Log detalhado de todas as ações
3. **Geolocation Blocking:** Bloqueio por região
4. **Machine Learning:** Detecção avançada de padrões
5. **Web Application Firewall:** Proteção adicional L7

### Monitoramento Avançado

- Integração com Prometheus/Grafana
- Alertas via webhook para ataques
- Dashboard de segurança em tempo real
- Relatórios automáticos de segurança

## 📝 Testes de Segurança

### Validação Manual

```bash
# Teste Rate Limiting
for i in {1..100}; do curl -X POST localhost:8989/api/chat; done

# Teste XSS
curl -X POST localhost:8989/api/chat \
  -d '{"message": "<script>alert(1)</script>", "session_id": "test"}'

# Teste SQL Injection  
curl -X POST localhost:8989/api/chat \
  -d '{"message": "test; DROP TABLE users--", "session_id": "test"}'

# Teste UUID inválido
curl -X POST localhost:8989/api/chat \
  -d '{"message": "test", "session_id": "invalid-uuid"}'
```

### Testes Automatizados

Execute os testes de segurança:

```bash
python -m pytest tests/test_security.py -v
```

---

**⚡ Resumo:** Implementadas validações robustas de UUID, sanitização XSS/injection, rate limiting com Redis, headers de segurança CSP, detecção de ataques e middleware de validação completo. Sistema agora resistente a ataques comuns web e possui monitoramento/limpeza automáticos.