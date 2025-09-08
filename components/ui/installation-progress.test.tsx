import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InstallationProgress } from './installation-progress';

describe('InstallationProgress', () => {
  it('displays progress and step statuses', () => {
    const steps = [
      { id: 1, title: 'Visita Técnica', description: '', status: 'completed', date: new Date('2024-01-10') },
      { id: 2, title: 'Instalação', description: '', status: 'progress' },
      { id: 3, title: 'Conexão', description: '', status: 'pending' },
    ];
    render(
      <InstallationProgress
        steps={steps}
        currentStep={2}
        estimatedCompletionDate={new Date('2024-02-01')}
      />,
    );
    expect(screen.getByText(/33% Concluído/)).toBeInTheDocument();
    expect(screen.getByText('Visita Técnica')).toBeInTheDocument();
    expect(screen.getByText('Instalação')).toBeInTheDocument();
    expect(screen.getByText('Conexão')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });
});
