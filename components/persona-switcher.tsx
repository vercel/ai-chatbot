"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePersona, type PersonaMode } from "@/lib/persona/context";

export function PersonaSwitcher() {
  const { mode, setMode } = usePersona();
  return (
    <div className="flex flex-col gap-2 w-48">
      <Label htmlFor="persona-mode">Persona Mode</Label>
      <Select
        value={mode}
        onValueChange={(val) => setMode(val as PersonaMode)}
      >
        <SelectTrigger id="persona-mode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">Owner</SelectItem>
          <SelectItem value="integrator">Integrator</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
