import { bankoxPixCopy } from '../lib/copy/bankoxPix';
import { pixParceladoCadence } from '../lib/cadence/pixParcelado';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

const allCTAs = new Set<string>([
  ...bankoxPixCopy.ctas.primary,
  ...bankoxPixCopy.ctas.secondary,
  ...bankoxPixCopy.ctas.destructive,
]);

pixParceladoCadence.forEach((step) =>
  assert(allCTAs.has(step.cta), `CTA n\u00e3o encontrado: ${step.cta}`),
);

['empty', 'invalid', 'network', 'unauthorized', 'notFound', 'server'].forEach(
  (key) =>
    assert(
      !!bankoxPixCopy.errors[key as keyof typeof bankoxPixCopy.errors],
      `Erro faltando: ${key}`,
    ),
);

bankoxPixCopy.placeholders.phone.forEach((p) =>
  assert(/\(\d{2}\)/.test(p), `Placeholder telefone inv\u00e1lido: ${p}`),
);

console.log('QA Pix Parcelado: \u2705 passou em todas as checagens.');
