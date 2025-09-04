import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Switch } from '../components/ui/switch';
import { useAccessibility } from '../lib/accessibility/context';
import { useState, useEffect, type FC } from 'react';

interface AccessibilitySettingsProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export const AccessibilitySettings: FC<AccessibilitySettingsProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    highContrast,
    fontSize,
    reduceMotion,
    toggleHighContrast,
    setFontSize,
    toggleReduceMotion,
  } = useAccessibility();
  const [localSettings, setLocalSettings] = useState({
    highContrast,
    fontSize,
    reduceMotion,
  });

  // Atualiza estado local quando as props mudam
  useEffect(() => {
    setLocalSettings({
      highContrast,
      fontSize,
      reduceMotion,
    });
  }, [highContrast, fontSize, reduceMotion]);

  // Aplica as configurações quando o diálogo é fechado
  const handleClose = (open: boolean) => {
    if (!open) {
      toggleHighContrast();
      setFontSize(localSettings.fontSize);
      toggleReduceMotion();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações de Acessibilidade</DialogTitle>
          <DialogDescription>
            Personalize sua experiência para melhor atender às suas necessidades
            de acessibilidade.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast" className="text-left">
              Alto contraste
              <p className="text-sm text-muted-foreground">
                Aumenta o contraste de cores para melhorar a legibilidade.
              </p>
            </Label>
            <Switch
              id="high-contrast"
              checked={localSettings.highContrast}
              onCheckedChange={(checked: boolean) =>
                setLocalSettings({ ...localSettings, highContrast: checked })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="font-size" className="text-left">
              Tamanho da fonte
              <p className="text-sm text-muted-foreground">
                Ajuste o tamanho do texto para facilitar a leitura.
              </p>
            </Label>
            <RadioGroup
              id="font-size"
              value={localSettings.fontSize}
              onValueChange={(value: string) =>
                setLocalSettings({
                  ...localSettings,
                  fontSize: value as 'normal' | 'large' | 'x-large',
                })
              }
              className="grid grid-cols-3 gap-2"
            >
              <div>
                <RadioGroupItem
                  value="normal"
                  id="font-normal"
                  className="sr-only"
                />
                <Label
                  htmlFor="font-normal"
                  className={`flex h-12 items-center justify-center rounded-md border-2 ${
                    localSettings.fontSize === 'normal'
                      ? 'border-brand bg-brand/10'
                      : 'border-muted bg-transparent'
                  } px-3 py-2 hover:border-brand/30 hover:bg-brand/5`}
                >
                  Normal
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="large"
                  id="font-large"
                  className="sr-only"
                />
                <Label
                  htmlFor="font-large"
                  className={`flex h-12 items-center justify-center rounded-md border-2 ${
                    localSettings.fontSize === 'large'
                      ? 'border-brand bg-brand/10'
                      : 'border-muted bg-transparent'
                  } px-3 py-2 hover:border-brand/30 hover:bg-brand/5`}
                >
                  Grande
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="x-large"
                  id="font-x-large"
                  className="sr-only"
                />
                <Label
                  htmlFor="font-x-large"
                  className={`flex h-12 items-center justify-center rounded-md border-2 ${
                    localSettings.fontSize === 'x-large'
                      ? 'border-brand bg-brand/10'
                      : 'border-muted bg-transparent'
                  } px-3 py-2 hover:border-brand/30 hover:bg-brand/5 text-lg`}
                >
                  Extra grande
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reduce-motion" className="text-left">
              Reduzir movimento
              <p className="text-sm text-muted-foreground">
                Minimiza animações e transições para reduzir distrações.
              </p>
            </Label>
            <Switch
              id="reduce-motion"
              checked={localSettings.reduceMotion}
              onCheckedChange={(checked: boolean) =>
                setLocalSettings({ ...localSettings, reduceMotion: checked })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setLocalSettings({
                highContrast,
                fontSize,
                reduceMotion,
              });
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (localSettings.highContrast !== highContrast) {
                toggleHighContrast();
              }

              setFontSize(localSettings.fontSize);

              if (localSettings.reduceMotion !== reduceMotion) {
                toggleReduceMotion();
              }

              onOpenChange(false);
            }}
          >
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
