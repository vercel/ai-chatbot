'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Tipos de etapas na instalação solar
type InstallationStep = {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'progress' | 'completed';
  date?: Date;
};

interface InstallationProgressProps {
  steps: InstallationStep[];
  currentStep: number;
  estimatedCompletionDate?: Date;
  className?: string;
}

export function InstallationProgress({
  steps,
  currentStep,
  estimatedCompletionDate,
  className,
}: Readonly<InstallationProgressProps>) {
  // Calcular o progresso geral
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalProgress = Math.round((completedSteps / steps.length) * 100);
  
  // Formatar data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <Card variant="solar-panel" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Progresso da Instalação</CardTitle>
          <Badge variant="installation">{totalProgress}% Concluído</Badge>
        </div>
        {estimatedCompletionDate && (
          <CardDescription>
            Previsão de conclusão: {formatDate(estimatedCompletionDate)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative mb-6 mt-4">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] rounded-full transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.id} className="relative">
              {/* Linha de conexão vertical entre etapas */}
              {step.id !== steps.length && (
                <div className="absolute left-3.5 top-10 h-full w-0.5 bg-muted"></div>
              )}
              
              <div className="flex items-start gap-4">
                {/* Círculo indicador de status */}
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full shrink-0",
                  step.status === 'completed' && "bg-[hsl(var(--brand))]",
                  step.status === 'progress' && "bg-blue-500",
                  step.status === 'pending' && "bg-muted",
                  step.id === currentStep && "ring-2 ring-[hsl(var(--brand))] ring-offset-2"
                )}>
                  {step.status === 'completed' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  {step.status === 'progress' && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{step.title}</h4>
                    <Badge variant={
                      step.status === 'completed' ? 'status.completed' : 
                      step.status === 'progress' ? 'status.progress' : 
                      'status.pending'
                    }>
                      {step.status === 'completed' ? 'Concluído' : 
                       step.status === 'progress' ? 'Em andamento' : 
                       'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.date && step.status === 'completed' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Concluído em {formatDate(step.date)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}