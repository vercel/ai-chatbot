export type Channel = 'app' | 'web' | 'whatsapp' | 'push' | 'email' | 'chat';
export interface Step {
  stage:
    | 'descoberta'
    | 'onboarding'
    | 'ativacao'
    | 'conversao'
    | 'retencao'
    | 'reengajamento'
    | 'suporte';
  objective: string;
  trigger: string;
  channel: Channel;
  timing: string; // ex.: 'imediato' | '+5min' | 'D+1 09:00'
  short: string;
  long: string;
  cta: string;
  kpi: string;
}

export const pixParceladoCadence: Step[] = [
  {
    stage: 'descoberta',
    objective: 'apresentar o Pix Parcelado',
    trigger: 'visita tela de pagamentos',
    channel: 'app',
    timing: 'imediato',
    short: 'Parcelar Pix? T\u00e1 na m\u00e3o. \uD83D\uDCA5',
    long: 'Quer dividir seu Pix em at\u00e9 12x sem drama? Aqui rola. S\u00f3 ativar o Pix Parcelado.',
    cta: 'Conferir detalhes',
    kpi: 'banner_clicks',
  },
  {
    stage: 'onboarding',
    objective: 'explicar como funciona',
    trigger: 'in\u00edcio de cadastro',
    channel: 'web',
    timing: 'durante cadastro',
    short: '\u00c9 rapidinho, juro.',
    long: 'Preenche seus dados, mostra que \u00e9 voc\u00ea e pronto: cr\u00e9dito liberado pra parcelar Pix.',
    cta: 'Bora continuar',
    kpi: 'signup_completion',
  },
  {
    stage: 'ativacao',
    objective: 'finalizar contrato',
    trigger: 'cadastro aprovado',
    channel: 'whatsapp',
    timing: '+5min',
    short: 'Pix Parcelado pronto pra a\u00e7\u00e3o. \u26A1\uFE0F',
    long: 'Seu limite j\u00e1 t\u00e1 na conta. Assina o termo rapid\u00e3o e come\u00e7a a usar.',
    cta: 'Ativar agora',
    kpi: 'activation_rate',
  },
  {
    stage: 'conversao',
    objective: 'primeira opera\u00e7\u00e3o',
    trigger: '24h sem uso',
    channel: 'push',
    timing: 'D+1',
    short: 'Vai deixar o Pix Parcelado parado?',
    long: 'Primeira compra com Pix Parcelado tem zero tarifa. Aproveita e testa.',
    cta: 'Fechar pedido',
    kpi: 'first_tx_rate',
  },
  {
    stage: 'retencao',
    objective: 'uso recorrente',
    trigger: 'ciclo de fatura',
    channel: 'email',
    timing: '-3 dias vencimento',
    short: 'Fatura chegando, tudo sob controle.',
    long: 'Sua fatura do Pix Parcelado vence em 3 dias. Paga em dia, evita juros extras e libera limite pra pr\u00f3xima.',
    cta: 'Pagar agora',
    kpi: 'delinquency_rate',
  },
  {
    stage: 'reengajamento',
    objective: 'recuperar inativos',
    trigger: '30 dias sem uso',
    channel: 'whatsapp',
    timing: '+30d',
    short: 'Saudade do seu Pix Parcelado.',
    long: 'T\u00e1 sumido. Lembra que d\u00e1 pra parcelar qualquer boleto ou transfer\u00eancia. Volta pra jogada.',
    cta: 'Ativar agora',
    kpi: 'reactivation_rate',
  },
  {
    stage: 'suporte',
    objective: 'resolver d\u00favidas/erros',
    trigger: 'erro 500 ou ticket',
    channel: 'chat',
    timing: 'imediato',
    short: 'Deu ruim? A gente resolve.',
    long: 'Rolou erro no Pix Parcelado? Conta o que aconteceu que j\u00e1 desatamos.',
    cta: 'Chamar suporte',
    kpi: 'ttr',
  },
];

export type PixParceladoCadence = typeof pixParceladoCadence;
