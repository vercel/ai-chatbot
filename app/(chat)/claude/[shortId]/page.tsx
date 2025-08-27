import { redirect } from 'next/navigation';
import { ClaudeChat } from '@/components/claude-chat';

const CLAUDE_API = process.env.CLAUDE_SDK_API_URL || 'http://127.0.0.1:8002';

interface PageProps {
  params: Promise<{ shortId: string }>
}

export default async function ClaudeShortUrlPage(props: PageProps) {
  const params = await props.params;
  const { shortId } = params;
  
  // Valida o formato do shortId (8 caracteres alfanuméricos com hífen opcional)
  if (!/^[a-zA-Z0-9-]{8}$/.test(shortId)) {
    redirect('/claude');
  }

  // Se o shortId tem exatamente 8 caracteres, ele já É o início de uma sessão
  // Não precisa buscar no backend, apenas carrega o ClaudeChat com esse ID
  // O componente vai tentar recuperar a sessão completa se existir
  return (
    <div className="h-screen">
      <ClaudeChat sessionId={shortId} />
    </div>
  );
}