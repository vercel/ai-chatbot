import { Input } from "./shadcn/input";
import { Label } from "./shadcn/label";

export function Form({
  action,
  children,
}: {
  action: any;
  children: React.ReactNode;
}) {
  return (
    <form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-zinc-600 font-normal">
          Email Address
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
        />

        <Label htmlFor="password" className="text-zinc-600 font-normal">
          Password
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted"
          type="password"
          required
        />
      </div>

      {children}
    </form>
  );
}
