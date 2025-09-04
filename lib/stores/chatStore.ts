import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { enableMapSet } from 'immer'

// Habilitar suporte para Map e Set no Immer
enableMapSet()

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: {
    input?: number
    output?: number
  }
  cost?: number
  tools?: string[]
}

export interface Session {
  id: string
  title: string
  messages: Message[]
  config: SessionConfig
  metrics: {
    totalTokens: number
    totalCost: number
    messageCount: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface SessionConfig {
  systemPrompt?: string
  allowedTools?: string[]
  maxTurns?: number
  permissionMode?: 'acceptEdits' | 'ask' | 'deny'
  cwd?: string
}

const defaultSessionConfig: SessionConfig = {
  systemPrompt: '',
  allowedTools: [],
  maxTurns: 20,
  permissionMode: 'acceptEdits',
  cwd: undefined
}

interface ChatStore {
  // Estado
  sessions: Map<string, Session>
  activeSessionId: string | null
  isStreaming: boolean
  streamingContent: string
  isProcessing: boolean
  
  // Ações de sessão
  createSession: (config?: SessionConfig) => string
  deleteSession: (sessionId: string) => void
  setActiveSession: (sessionId: string) => void
  updateSessionConfig: (sessionId: string, config: SessionConfig) => void
  migrateToRealSession: (realSessionId: string) => void
  
  // Ações de mensagem
  addMessage: (sessionId: string, message: Omit<Message, 'id'>) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void
  deleteMessage: (sessionId: string, messageId: string) => void
  
  // Ações de streaming
  setStreaming: (streaming: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (content: string) => void
  setProcessing: (processing: boolean) => void
  
  // Ações de métricas
  updateMetrics: (sessionId: string, tokens: { input?: number; output?: number }, cost?: number) => void
  
  // Utilidades
  getActiveSession: () => Session | null
  clearSession: (sessionId: string) => void
  exportSession: (sessionId: string) => Session | null
  importSession: (session: Session) => void
  loadExternalSession: (sessionData: any) => void
  loadCrossSessionHistory: (primarySessionId: string) => Promise<void>
}

const useChatStore = create<ChatStore>()(
  immer((set, get) => ({
    sessions: new Map(),
    activeSessionId: null,
    isStreaming: false,
    streamingContent: '',
    isProcessing: false,
    
    createSession: (config = {}) => {
      // Cria sessão temporária que será migrada automaticamente
      const sessionId = `temp-${Date.now()}`
      set((state) => {
        const session: Session = {
          id: sessionId,
          title: 'Nova Conversa',
          messages: [],
          config: { ...defaultSessionConfig, ...config },
          createdAt: new Date(),
          updatedAt: new Date(),
          metrics: {
            totalTokens: 0,
            totalCost: 0,
            messageCount: 0
          }
        }
        state.sessions.set(sessionId, session)
        state.activeSessionId = sessionId
      })
      return sessionId
    },
    
    deleteSession: (sessionId) => {
      set((state) => {
        state.sessions.delete(sessionId)
        if (state.activeSessionId === sessionId) {
          const remaining = Array.from(state.sessions.keys())
          state.activeSessionId = remaining[0] || null
        }
      })
    },
    
    setActiveSession: (sessionId) => {
      set((state) => {
        if (state.sessions.has(sessionId)) {
          state.activeSessionId = sessionId
        }
      })
    },

    migrateToRealSession: (realSessionId) => {
      set((state) => {
        console.log('╔════════════════════════════════════════╗')
        console.log('║   🔄 INICIANDO MIGRAÇÃO NO STORE       ║')
        console.log('╚════════════════════════════════════════╝')
        console.log(`├─ realSessionId recebido: ${realSessionId}`)
        console.log(`├─ activeSessionId atual: ${state.activeSessionId}`)
        console.log(`├─ Total de sessões: ${state.sessions.size}`)
        console.log(`└─ Sessões existentes: ${Array.from(state.sessions.keys()).join(', ')}`)
        
        // 🔥 PROTEÇÃO ADICIONAL: Validação prévia antes da migração
        
        // Valida formato UUID do session_id real
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(realSessionId)) {
          console.error(`❌ Session ID inválido (não é UUID): ${realSessionId}`)
          return // Aborta migração
        }
        
        console.log('✅ UUID válido, procurando sessão temporária...')
        
        // ✅ CORREÇÃO: Migra qualquer sessão temporária para sessão real do SDK
        let tempSession = null
        let tempSessionId = null
        
        // Encontra a sessão temporária atual (pode ter qualquer ID temp-*)
        for (const [sessionId, session] of Array.from(state.sessions)) {
          console.log(`   Verificando: ${sessionId} (temp? ${sessionId.startsWith('temp-')})`)
          if (sessionId.startsWith('temp-') || sessionId === 'awaiting-real-session') {
            tempSession = session
            tempSessionId = sessionId
            console.log(`   ✅ Sessão temporária encontrada: ${sessionId}`)
            break
          }
        }
        
        if (tempSession && tempSessionId) {
          // 🔒 PROTEÇÃO: Verifica se não há sessão real com esse ID já existente
          if (state.sessions.has(realSessionId)) {
            console.log(`ℹ️ Sessão real ${realSessionId} já existe - apenas atualizando ativa`)
            state.activeSessionId = realSessionId
            state.sessions.delete(tempSessionId) // Remove temporária
            return
          }
          
          // Cria nova sessão com ID real do SDK, mantendo dados da temporária
          const realSession: Session = {
            ...tempSession,
            id: realSessionId,
            title: `💬 Sessão ${realSessionId.slice(-8)}`,
            updatedAt: new Date()
          }
          
          console.log('\n📦 EXECUTANDO MIGRAÇÃO:')
          console.log(`   ├─ ID antigo: ${tempSessionId}`)
          console.log(`   ├─ ID novo: ${realSessionId}`)
          console.log(`   ├─ Título: ${realSession.title}`)
          console.log(`   └─ Mensagens: ${realSession.messages.length}`)
          
          // Adiciona a sessão real
          state.sessions.set(realSessionId, realSession)
          console.log(`   ✅ Sessão real adicionada ao Map`)
          
          // Remove sessão temporária
          state.sessions.delete(tempSessionId)
          console.log(`   ✅ Sessão temporária removida`)
          
          // Atualiza sessão ativa
          state.activeSessionId = realSessionId
          console.log(`   ✅ activeSessionId atualizado: ${state.activeSessionId}`)
          
          console.log(`\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!`)
          console.log(`   Nova sessão ativa: ${state.activeSessionId}`)
          console.log('╚════════════════════════════════════════╝\n')
        } else {
          console.warn(`⚠️ Nenhuma sessão temporária encontrada para migrar para: ${realSessionId}`)
          
          // 🔄 FALLBACK: Se não há sessão temporária mas session_id é válido,
          // cria sessão diretamente (caso de carregamento direto via URL)
          if (!state.sessions.has(realSessionId)) {
            console.log(`🆕 Criando sessão real diretamente: ${realSessionId}`)
            const newRealSession: Session = {
              id: realSessionId,
              title: `💬 Sessão ${realSessionId.slice(-8)}`,
              messages: [],
              config: {
                systemPrompt: 'Sessão restaurada do Claude Code',
                allowedTools: [],
                maxTurns: 20,
                permissionMode: 'acceptEdits',
                cwd: undefined
              },
              metrics: {
                totalTokens: 0,
                totalCost: 0,
                messageCount: 0
              },
              createdAt: new Date(),
              updatedAt: new Date()
            }
            
            state.sessions.set(realSessionId, newRealSession)
            state.activeSessionId = realSessionId
          } else {
            // Sessão já existe, apenas ativa
            state.activeSessionId = realSessionId
          }
        }
      })
    },
    
    updateSessionConfig: (sessionId, config) => {
      set((state) => {
        const session = state.sessions.get(sessionId)
        if (session) {
          session.config = { ...session.config, ...config }
          session.updatedAt = new Date()
        }
      })
    },
    
    addMessage: (sessionId, message) => {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const fullMessage: Message = {
        ...message,
        id: messageId,
        timestamp: message.timestamp || new Date()
      }
      
      set((state) => {
        const session = state.sessions.get(sessionId)
        if (session) {
          session.messages.push(fullMessage)
          session.metrics.messageCount++
          session.updatedAt = new Date()
        }
      })
    },
    
    updateMessage: (sessionId, messageId, updates) => {
      set((state) => {
        const session = state.sessions.get(sessionId)
        if (session) {
          const message = session.messages.find(m => m.id === messageId)
          if (message) {
            Object.assign(message, updates)
            session.updatedAt = new Date()
          }
        }
      })
    },
    
    deleteMessage: (sessionId, messageId) => {
      set((state) => {
        const session = state.sessions.get(sessionId)
        if (session) {
          session.messages = session.messages.filter(m => m.id !== messageId)
          session.metrics.messageCount = session.messages.length
          session.updatedAt = new Date()
        }
      })
    },
    
    setStreaming: (streaming) => {
      set((state) => {
        state.isStreaming = streaming
        if (!streaming) {
          state.streamingContent = ''
          state.isProcessing = false
        }
      })
    },
    
    setStreamingContent: (content) => {
      set((state) => {
        state.streamingContent = content
      })
    },
    
    appendStreamingContent: (content) => {
      set((state) => {
        state.streamingContent += content
      })
    },
    
    setProcessing: (processing) => {
      set((state) => {
        state.isProcessing = processing
      })
    },
    
    updateMetrics: (sessionId, tokens, cost) => {
      set((state) => {
        const session = state.sessions.get(sessionId)
        if (session) {
          if (tokens.input) session.metrics.totalTokens += tokens.input
          if (tokens.output) session.metrics.totalTokens += tokens.output
          if (cost) session.metrics.totalCost += cost
          session.updatedAt = new Date()
        }
      })
    },
    
    getActiveSession: () => {
      const { sessions, activeSessionId } = get()
      return activeSessionId ? sessions.get(activeSessionId) || null : null
    },
    
    clearSession: (sessionId) => {
      set((state) => {
        const session = state.sessions.get(sessionId)
        if (session) {
          session.messages = []
          session.metrics = {
            totalTokens: 0,
            totalCost: 0,
            messageCount: 0
          }
          session.updatedAt = new Date()
        }
      })
    },
    
    exportSession: (sessionId) => {
      const session = get().sessions.get(sessionId)
      return session ? { ...session } : null
    },
    
    importSession: (session) => {
      set((state) => {
        state.sessions.set(session.id, session)
      })
    },
    
    loadExternalSession: (sessionData) => {
      set((state) => {
        const sessionId = sessionData.id
        // Detecta se é uma sessão do Claude Code (terminal)
        const isClaudeCodeSession = sessionData.origin === 'Terminal' || 
                                    sessionData.origin === 'Claude Code' ||
                                    sessionData.title?.includes('Terminal') ||
                                    sessionData.title?.includes('Claude Code');
        
        const sessionTitle = isClaudeCodeSession 
          ? `Agente SutHub • Claude`
          : sessionData.title || `Sessão ${sessionId.slice(-8)}`;
        
        const newSession: Session = {
          id: sessionId,
          title: sessionTitle,
          messages: sessionData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          config: {
            systemPrompt: 'Sessão restaurada do Claude Code',
            allowedTools: [],
            maxTurns: 20,
            permissionMode: 'acceptEdits',
            cwd: undefined
          },
          metrics: {
            totalTokens: sessionData.messages.reduce((total: number, msg: any) => 
              total + (msg.tokens?.input || 0) + (msg.tokens?.output || 0), 0),
            totalCost: sessionData.messages.reduce((total: number, msg: any) => 
              total + (msg.cost || 0), 0),
            messageCount: sessionData.messages.length
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        state.sessions.set(sessionId, newSession)
        state.activeSessionId = sessionId
      })
    },

    loadCrossSessionHistory: async (primarySessionId: string) => {
      const projectPath = '/home/suthub/.claude/projects/-home-suthub--claude-api-claude-code-app-cc-sdk-chat'
      
      try {
        // Lista todos os arquivos JSONL do projeto
        const response = await fetch('/api/load-project-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            projectPath,
            primarySessionId 
          })
        })
        
        if (!response.ok) return
        
        const { sessions, isSingleSession, continuationMode } = await response.json()
        
        set((state) => {
          // SEMPRE CARREGA TODAS AS SESSÕES DO PROJETO
          // Cria uma visualização unificada independente do número de sessões
          
          // Primeiro, cria uma sessão especial "PROJETO UNIFICADO"
          const unifiedSessionId = `project-${primarySessionId}`
          
          // Combina todas as mensagens de todas as sessões em ordem cronológica
          const allMessages: any[] = []
          
          sessions.forEach((sessionData: any) => {
            sessionData.messages.forEach((msg: any) => {
              allMessages.push({
                ...msg,
                sessionOrigin: sessionData.id,
                sessionTitle: sessionData.origin || 'Claude Code',
                timestamp: new Date(msg.timestamp)
              })
            })
          })
          
          // Ordena todas as mensagens por timestamp
          allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          
          // Cria sessão unificada com timeline completa
          const unifiedSession: Session = {
            id: unifiedSessionId,
            title: `📋 Timeline Unificada (${sessions.length} sessões)`,
            messages: allMessages,
            config: {
              systemPrompt: `Timeline unificada do projeto - ${sessions.length} sessões combinadas`,
              allowedTools: [],
              maxTurns: 100,
              permissionMode: 'acceptEdits',
              cwd: sessions[0]?.cwd
            },
            metrics: {
              totalTokens: allMessages.reduce((total, msg) => 
                total + (msg.tokens?.input || 0) + (msg.tokens?.output || 0), 0),
              totalCost: allMessages.reduce((total, msg) => 
                total + (msg.cost || 0), 0),
              messageCount: allMessages.length
            },
            createdAt: new Date(sessions[0]?.createdAt || Date.now()),
            updatedAt: new Date()
          }
          
          // NÃO adiciona mais a sessão unificada - removido por solicitação
          // state.sessions.set(unifiedSessionId, unifiedSession)
          
          // Carrega APENAS cada sessão individual como abas separadas
          sessions.forEach((sessionData: any) => {
            if (!state.sessions.has(sessionData.id)) {
              const session: Session = {
                id: sessionData.id,
                title: `${sessionData.origin === 'SDK Web' ? '🌐' : '🖥️'} ${sessionData.origin || 'Terminal'} (${sessionData.id.slice(-8)})`,
                messages: sessionData.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                })),
                config: {
                  systemPrompt: `Sessão individual - ${sessionData.origin || 'Claude Code'}`,
                  allowedTools: [],
                  maxTurns: 20,
                  permissionMode: 'acceptEdits',
                  cwd: sessionData.cwd
                },
                metrics: {
                  totalTokens: sessionData.messages.reduce((total: number, msg: any) => 
                    total + (msg.tokens?.input || 0) + (msg.tokens?.output || 0), 0),
                  totalCost: sessionData.messages.reduce((total: number, msg: any) => 
                    total + (msg.cost || 0), 0),
                  messageCount: sessionData.messages.length
                },
                createdAt: new Date(sessionData.createdAt || Date.now()),
                updatedAt: new Date()
              }
              
              state.sessions.set(sessionData.id, session)
            }
          })
          
          // Não muda a sessão ativa - mantém na sessão específica
          // A sessão unificada fica disponível nas abas, mas não força mudança
        })
      } catch (error) {
        console.error('Erro ao carregar histórico cruzado:', error)
      }
    }
  }))
)

export default useChatStore