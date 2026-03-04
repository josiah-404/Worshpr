"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <><Sun className="h-4 w-4" /><span>Light Mode</span></>
      ) : (
        <><Moon className="h-4 w-4" /><span>Dark Mode</span></>
      )}
    </Button>
  );
}
