import { removeSubscription } from "@/app/api/webhooks/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User } from "@/lib/types";
import { translatePlan } from '@/lib/utils';
import { useRouter } from "next/navigation";

export default function CancelDialog({ children, session }: { children: React.ReactNode, session: User }) {
  const router = useRouter();

  return (
     <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você deseja cancelar sua mensalidade atual?</AlertDialogTitle>
          <AlertDialogDescription>
            Seu plano atual é o {translatePlan[session.plan]}. Ao confirmar sua mensalidade voltará ao plano gratuito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={async () => { 
            await removeSubscription(session.email, session.stripeId);
            router.push('/checkout/result?session_id=cancel');
          }}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}