import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canvas - Workspace Interativo',
  description: 'Crie e edite documentos e código em tempo real',
};

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  );
}