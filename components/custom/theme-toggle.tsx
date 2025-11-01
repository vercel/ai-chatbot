import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";

export const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? SunIcon : MoonIcon;

  return (
    <Button
      className="h-8 w-8"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      size="icon"
      variant="ghost"
    >
      <Icon />
    </Button>
  );
};
