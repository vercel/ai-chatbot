import { Button } from "@/components/ui/button";

export function LoadingState() {
  return <div className="p-4 text-sm">Carregando...</div>;
}

export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="p-4 space-y-2 text-sm">
      <p>Algo deu errado.</p>
      {retry && (
        <Button variant="outline" onClick={retry} className="text-sm">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function SuccessState({ children }: { children?: React.ReactNode }) {
  return <div className="p-4 space-y-2 text-sm">{children}</div>;
}

export function EmptyState({ message }: { message: string }) {
  return <div className="p-4 text-sm text-muted-foreground">{message}</div>;
}
