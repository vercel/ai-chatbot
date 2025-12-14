# TiQ Bot Framework Blueprint

## Overview
The TiQ Bot Framework defines five core bots, each with a unique role, permissions, and integration points. These bots enable modular app building, analytics, security, and user-driven customization within TiQology OS v2.0.

## Bot Matrix
| Bot           | Role                                 | Permissions                        | Data Flow & Integration                | Deployment Order |
|---------------|--------------------------------------|-------------------------------------|----------------------------------------|-----------------|
| Architect     | Modular app builder, orchestrator    | System design, module creation      | Supabase, Cloudflare, Rendering OS     | 1               |
| Oracle        | Sports prediction, analytics         | Read analytics, write predictions   | Supabase, Cloudflare, Rendering OS     | 2               |
| Analyst       | Data analysis, reporting             | Read/write analytics, reports       | Supabase, Cloudflare, Rendering OS     | 3               |
| Guardian      | Security, privacy, compliance        | Security modules, audit logs        | Supabase, Cloudflare, Rendering OS     | 4               |
| Builder       | App assembly, deployment, UX         | Build, deploy, manage user apps     | Supabase, Cloudflare, Rendering OS     | 5               |

## Data Flow
- Bots communicate via secure APIs and event streams
- Supabase provides data/auth layer
- Cloudflare secures networking and edge functions
- Rendering OS handles UI/game rendering

## Permissions & Security
- Each bot is sandboxed with least-privilege access
- TiQGuardian enforces policy and compliance
- All actions are logged and auditable

## Deployment Order
1. Architect
2. Oracle
3. Analyst
4. Guardian
5. Builder

## Extensibility
- New bots can be added with defined roles and permissions
- Modular design supports future expansion

---

# File Map
- `/core/bots/TiQArchitect.ts`
- `/core/bots/TiQOracle.ts`
- `/core/bots/TiQAnalyst.ts`
- `/core/bots/TiQGuardian.ts`
- `/core/bots/TiQBuilder.ts`
