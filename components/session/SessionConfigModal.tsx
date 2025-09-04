import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Code, 
  Database, 
  Globe, 
  Terminal, 
  FileText,
  FolderOpen,
  Shield,
  Zap
} from 'lucide-react'
import { SessionConfig } from '@/stores/chatStore'

interface SessionConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (config: SessionConfig) => void
  initialConfig?: SessionConfig
}

const TOOL_OPTIONS = [
  { id: 'Read', label: 'Ler Arquivos', icon: FileText },
  { id: 'Write', label: 'Escrever Arquivos', icon: FileText },
  { id: 'Edit', label: 'Editar Arquivos', icon: FileText },
  { id: 'Bash', label: 'Terminal Bash', icon: Terminal },
  { id: 'Grep', label: 'Buscar em Arquivos', icon: Database },
  { id: 'LS', label: 'Listar Diretórios', icon: FolderOpen },
  { id: 'WebFetch', label: 'Buscar na Web', icon: Globe },
  { id: 'TodoWrite', label: 'Gerenciar Tarefas', icon: Zap }
]

const TEMPLATES = [
  {
    id: 'web-dev',
    name: 'Desenvolvimento Web',
    icon: Globe,
    config: {
      systemPrompt: 'Você é um especialista em desenvolvimento web com React, Next.js e TypeScript.',
      allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Grep'],
      maxTurns: 20,
      permissionMode: 'acceptEdits' as const
    }
  },
  {
    id: 'data-science',
    name: 'Data Science',
    icon: Database,
    config: {
      systemPrompt: 'Você é um cientista de dados especializado em Python, pandas e machine learning.',
      allowedTools: ['Read', 'Write', 'Bash'],
      maxTurns: 30,
      permissionMode: 'acceptEdits' as const
    }
  },
  {
    id: 'devops',
    name: 'DevOps',
    icon: Terminal,
    config: {
      systemPrompt: 'Você é um engenheiro DevOps especializado em Docker, Kubernetes e CI/CD.',
      allowedTools: ['Read', 'Write', 'Bash', 'Grep', 'LS'],
      maxTurns: 25,
      permissionMode: 'acceptEdits' as const
    }
  },
  {
    id: 'general',
    name: 'Assistente Geral',
    icon: Code,
    config: {
      systemPrompt: 'Você é um assistente útil e versátil.',
      allowedTools: [],
      maxTurns: 20,
      permissionMode: 'ask' as const
    }
  }
]

export function SessionConfigModal({
  open,
  onOpenChange,
  onConfirm,
  initialConfig
}: SessionConfigModalProps) {
  const [config, setConfig] = React.useState<SessionConfig>(
    initialConfig || {
      systemPrompt: '',
      allowedTools: [],
      maxTurns: 20,
      permissionMode: 'acceptEdits',
      cwd: ''
    }
  )

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setConfig(template.config)
  }

  const handleToolToggle = (toolId: string) => {
    setConfig(prev => ({
      ...prev,
      allowedTools: prev.allowedTools?.includes(toolId)
        ? prev.allowedTools.filter(t => t !== toolId)
        : [...(prev.allowedTools || []), toolId]
    }))
  }

  const handleConfirm = () => {
    onConfirm(config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Nova Sessão</DialogTitle>
          <DialogDescription>
            Personalize como o Claude irá se comportar nesta sessão
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="template" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template">Templates</TabsTrigger>
            <TabsTrigger value="basic">Configurações</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {TEMPLATES.map((template) => {
                const Icon = template.icon
                return (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="h-auto flex-col gap-2 p-4"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <Icon className="h-8 w-8" />
                    <span className="text-sm font-medium">{template.name}</span>
                  </Button>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <textarea
                id="system-prompt"
                className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Defina o comportamento e personalidade do assistente..."
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ferramentas Permitidas</Label>
              <div className="grid grid-cols-2 gap-2">
                {TOOL_OPTIONS.map((tool) => {
                  const Icon = tool.icon
                  const isSelected = config.allowedTools?.includes(tool.id)
                  return (
                    <Button
                      key={tool.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => handleToolToggle(tool.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {tool.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-turns">Máximo de Turnos</Label>
              <Input
                id="max-turns"
                type="number"
                min={1}
                max={100}
                value={config.maxTurns}
                onChange={(e) => setConfig({ ...config, maxTurns: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cwd">Diretório de Trabalho</Label>
              <Input
                id="cwd"
                placeholder="/home/user/projeto"
                value={config.cwd}
                onChange={(e) => setConfig({ ...config, cwd: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Modo de Permissão</Label>
              <div className="flex gap-2">
                <Button
                  variant={config.permissionMode === 'acceptEdits' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConfig({ ...config, permissionMode: 'acceptEdits' })}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Aceitar Edições
                </Button>
                <Button
                  variant={config.permissionMode === 'ask' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConfig({ ...config, permissionMode: 'ask' })}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Perguntar
                </Button>
                <Button
                  variant={config.permissionMode === 'deny' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConfig({ ...config, permissionMode: 'deny' })}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Negar
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Criar Sessão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}