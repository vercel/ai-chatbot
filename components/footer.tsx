'use client';

import { useState, type FC } from 'react';
import { Button } from './ui/button';
import { AccessibilitySettings } from './accessibility-settings';

interface FooterProps {
  className?: string;
}

export const Footer: FC<FooterProps> = ({ className = '' }) => {
  const [accessibilitySettingsOpen, setAccessibilitySettingsOpen] =
    useState(false);

  return (
    <footer className={`py-6 border-t ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Coluna 1 - Sobre */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sobre a YSH</h3>
            <p className="text-muted-foreground">
              A Yello Solar Hub revoluciona o mercado solar, oferecendo uma
              experiência 100% digital e sob demanda para instalação e
              monitoramento de painéis solares.
            </p>
          </div>

          {/* Coluna 2 - Links Úteis */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="hover:underline">
                  Sobre nós
                </a>
              </li>
              <li>
                <a href="/" className="hover:underline">
                  Nossos serviços
                </a>
              </li>
              <li>
                <a href="/" className="hover:underline">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/" className="hover:underline">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Contato */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li>
                <span className="font-medium">Email:</span> contato@ysh.com.br
              </li>
              <li>
                <span className="font-medium">Telefone:</span> (11) 9999-9999
              </li>
              <li>
                <span className="font-medium">Endereço:</span> Av. Paulista,
                1000 - São Paulo
              </li>
            </ul>
          </div>

          {/* Coluna 4 - Acessibilidade */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Acessibilidade</h3>
            <p className="text-muted-foreground mb-2">
              Estamos comprometidos em tornar nosso site acessível para todos.
            </p>
            <Button
              variant="outline"
              onClick={() => setAccessibilitySettingsOpen(true)}
              className="mt-2"
            >
              Configurações de Acessibilidade
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Yello Solar Hub. Todos os direitos
            reservados.
          </p>
        </div>
      </div>

      <AccessibilitySettings
        open={accessibilitySettingsOpen}
        onOpenChange={setAccessibilitySettingsOpen}
      />
    </footer>
  );
};
