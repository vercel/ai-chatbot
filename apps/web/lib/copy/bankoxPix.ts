export const bankoxPixCopy = {
  titles: [
    "Pix Parcelado na área.",
    "Divide o Pix e segue a vida.",
    "Crédito rápido, sem novela."
  ],
  subtitles: [
    "Até 12x, na hora, sem drama.",
    "Compra agora, paga com calma.",
    "Confere os números, depois é só usar."
  ],
  ctas: {
    primary: [
      "Bora continuar",
      "Ativar agora",
      "Fechar pedido",
      "Conferir detalhes",
      "Pagar agora",
      "Chamar suporte"
    ],
    secondary: ["Ver depois", "Ajustar mais tarde", "Voltar"],
    destructive: ["Cancelar tudo", "Remover isso", "Desistir por enquanto"]
  },
  placeholders: {
    search: ["Procura aí — sem medo", "Manda o nome do contato"],
    email: ["seunome@email.com", "nome.sobrenome@dominio.com"],
    phone: ["(11) 9XXXX-XXXX", "(21) 9XXXX-XXXX"]
  },
  errors: {
    empty: "Preenche isso aqui primeiro.",
    invalid: "Hum… isso não parece certo. Confere o formato.",
    network: "Caiu a conexão. Respira e tenta de novo.",
    unauthorized: "Você não tem acesso a isso (ainda).",
    notFound: "A gente procurou e não achou nada.",
    server: "Deu ruim do nosso lado. Já estamos em cima.",
    cpfInvalid: "Confere esse CPF. Tem número trocado.",
    overLimit: "Esse valor passa do seu limite atual."
  },
  emptyStates: {
    list: ["Nada por aqui… ainda.", "Tá vazio, mas logo enche."],
    noResults: [
      "Com esse filtro, nem o sol aparece. Tira a mão.",
      "Zero resultados. Ajusta o filtro e tenta de novo."
    ],
    noPermission: [
      "Você não tá autorizado a ver isso.",
      "Permissão negada. Fala com o admin."
    ]
  },
  toasts: {
    success: "Tudo certo! 💥",
    error: "Falhou agora, mas não desiste não.",
    warn: "Quase lá. Falta um detalhe.",
    info: (limite: string) => `Fica ligado: limite atual R$ ${limite}.`
  },
  tooltips: [
    "Taxa aplicada só se parcelar. À vista, zero custo.",
    "Limite aumenta conforme você paga em dia."
  ],
  a11y: {
    altCheck: "Ícone de check verde",
    ariaActivate: "Ativar Pix Parcelado"
  },
  lgpd: {
    consent: "Usaremos seus dados para avaliar limite do Pix Parcelado.",
    optoutWhatsapp: "Responda SAIR para parar."
  }
} as const;

export type BankoxPixCopy = typeof bankoxPixCopy;
