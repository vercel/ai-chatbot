import type { Phase } from './map';

export interface Node {
  id: string;
  type: 'input' | 'output';
  label: string;
  description: string;
}

export const blueprint: Partial<Record<Phase, Node[]>> = {
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
};
