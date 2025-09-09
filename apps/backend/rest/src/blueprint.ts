export type Phase =
  | 'Investigation'
  | 'Detection'
  | 'Analysis'
  | 'Dimensioning'
  | 'Simulation'
  | 'Installation'
  | 'Monitoring'
  | 'Recommendation'
  | 'LeadMgmt';

export interface Node {
  id: string;
  type: 'input' | 'output';
  label: string;
  description: string;
}

export const blueprint: Partial<Record<Phase, Node[]>> = {
  Investigation: [
    {
      id: 'intent-data',
      type: 'input',
      label: 'Dados iniciais',
      description: 'Usuário fornece dados básicos e intenção.',
    },
    {
      id: 'lead-validation',
      type: 'output',
      label: 'Validação de lead',
      description: 'Sistema valida e classifica o lead.',
    },
  ],
  Detection: [
    {
      id: 'roof-images',
      type: 'input',
      label: 'Imagens do telhado',
      description: 'Usuário envia fotos ou endereço.',
    },
    {
      id: 'detection-report',
      type: 'output',
      label: 'Relatório de detecção',
      description: 'Sistema identifica oportunidades no telhado.',
    },
  ],
  Analysis: [
    {
      id: 'energy-data',
      type: 'input',
      label: 'Dados de consumo',
      description: 'Usuário informa histórico de consumo.',
    },
    {
      id: 'viability-analysis',
      type: 'output',
      label: 'Análise de viabilidade',
      description: 'Sistema calcula consumo e ROI.',
    },
  ],
  Dimensioning: [
    {
      id: 'site-data',
      type: 'input',
      label: 'Dados do local',
      description: 'Usuário informa parâmetros do local e consumo energético.',
    },
    {
      id: 'system-sizing',
      type: 'output',
      label: 'Dimensionamento do sistema',
      description: 'Sistema calcula a configuração ideal do sistema solar.',
    },
  ],
  Simulation: [
    {
      id: 'simulation-parameters',
      type: 'input',
      label: 'Parâmetros de simulação',
      description: 'Usuário ajusta dados de irradiação e performance.',
    },
    {
      id: 'performance-report',
      type: 'output',
      label: 'Relatório de desempenho',
      description: 'Sistema gera previsões de geração e economia.',
    },
  ],
  Installation: [
    {
      id: 'install-schedule',
      type: 'input',
      label: 'Agendamento da instalação',
      description: 'Usuário confirma cronograma e equipe responsável.',
    },
    {
      id: 'installation-plan',
      type: 'output',
      label: 'Plano de instalação',
      description: 'Sistema fornece instruções e lista de materiais.',
    },
  ],
  Monitoring: [
    {
      id: 'monitoring-prefs',
      type: 'input',
      label: 'Preferências de monitoramento',
      description: 'Usuário define métricas e alertas.',
    },
    {
      id: 'dashboard',
      type: 'output',
      label: 'Painel de monitoramento',
      description: 'Sistema exibe desempenho em tempo real.',
    },
  ],
  Recommendation: [
    {
      id: 'proposal-preferences',
      type: 'input',
      label: 'Preferências da proposta',
      description: 'Usuário define prioridades para a recomendação.',
    },
    {
      id: 'custom-proposal',
      type: 'output',
      label: 'Proposta personalizada',
      description: 'Sistema gera proposta e documentação.',
    },
  ],
  LeadMgmt: [
    {
      id: 'lead-status',
      type: 'input',
      label: 'Status do lead',
      description: 'Integrador atualiza estágio do lead.',
    },
    {
      id: 'next-steps',
      type: 'output',
      label: 'Próximos passos',
      description: 'Sistema sugere ações para fechamento.',
    },
  ],
};
