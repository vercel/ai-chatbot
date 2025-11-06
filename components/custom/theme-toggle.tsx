import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setmounted] = useState(false);

  useEffect(() => {
    setmounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button className="h-8 w-8" size="icon" variant="ghost">
        <SunIcon />
      </Button>
    );
  }

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
