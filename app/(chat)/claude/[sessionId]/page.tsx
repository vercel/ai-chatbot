import { ClaudeChat } from '@/components/claude-chat';

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default async function ClaudeSessionPage(props: PageProps) {
  const params = await props.params;
  const { sessionId } = params;

  // Para URLs curtas (8 caracteres), verifica se é um shortId
  const isShortId = sessionId.length === 8;
  
  if (isShortId) {
    // Esta lógica já está sendo tratada em [shortId]/page.tsx
    // mas vamos manter aqui como fallback
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Carregando sessão...</p>
          <p className="text-sm text-gray-500">ID curto: {sessionId}</p>
        </div>
      </div>
    );
  }

  // Para IDs completos, carrega o chat com a sessão específica
  return (
    <div className="h-screen">
      <ClaudeChat sessionId={sessionId} />
    </div>
  );
}