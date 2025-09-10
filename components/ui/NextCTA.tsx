import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface NextCTAProps {
  primary: Action;
  secondary?: Action;
}

export function NextCTA({ primary, secondary }: NextCTAProps) {
  const PrimaryComponent = primary.href ? (
    <Button asChild>
      <Link href={primary.href}>{primary.label}</Link>
    </Button>
  ) : (
    <Button onClick={primary.onClick}>{primary.label}</Button>
  );

  const SecondaryComponent = secondary ? (
    secondary.href ? (
      <Button variant="outline" asChild>
        <Link href={secondary.href}>{secondary.label}</Link>
      </Button>
    ) : (
      <Button variant="outline" onClick={secondary.onClick}>
        {secondary.label}
      </Button>
    )
  ) : null;

  return (
    <div className="flex gap-2 mt-4">
      {PrimaryComponent}
      {SecondaryComponent}
    </div>
  );
}

export default NextCTA;
