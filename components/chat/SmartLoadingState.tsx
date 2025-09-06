'use client';

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Brain, Sparkles, Clock, TrendingUp, Search } from 'lucide-react';

interface SmartLoadingStateProps {
  isLoading: boolean;
  estimatedTime?: number; // em segundos
  currentQuery?: string;
}

export function SmartLoadingState({ 
  isLoading, 
  estimatedTime = 10,
  currentQuery 
}: SmartLoadingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loadingTip, setLoadingTip] = useState(0);
  const [dots, setDots] = useState('');
  
  // Dicas rotativas durante o loading
  const tips = [
    "💡 Você sabia que pode abrir múltiplas abas para fazer várias consultas?",
    "🚀 Processando com Claude 4.1 Opus, o melhor modelo do mundo para programar...",
    "📚 Analisando informações em tempo real para sua resposta...",
    "🧠 Conectando com servidores MCP Exa para buscar as informações mais recentes...",
    "⚡ Quase lá! Preparando uma resposta personalizada para você...",
    "🌍 Buscando dados globais e locais relevantes para sua consulta...",
    "🔍 Verificando múltiplas fontes para garantir precisão...",
    "✨ Utilizando IA generativa para criar a melhor resposta possível..."
  ];

  // Sugestões de consultas rápidas
  const quickSuggestions = [
    { icon: "📈", text: "Tendências de Insurtech 2025", query: "Tendências de Insurtech 2025" },
    { icon: "👤", text: "CEO da SUTHUB LinkedIn", query: "CEO da SUTHUB Renato Ferreira LinkedIn" },
    { icon: "📰", text: "Notícias de Hoje", query: "Notícias do Brasil e do Mundo Hoje" }
  ];

  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      setDots('');
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    const tipTimer = setInterval(() => {
      setLoadingTip(prev => (prev + 1) % tips.length);
    }, 3000);

    const dotsTimer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
      clearInterval(dotsTimer);
    };
  }, [isLoading, tips.length]);

  if (!isLoading) return null;

  const progress = Math.min((elapsedTime / estimatedTime) * 100, 90);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Card Principal de Loading */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 mb-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          {/* Ícone Animado */}
          <div className="relative">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            <div className="absolute -inset-1">
              <div className="w-10 h-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              Processando{dots}
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            </h3>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 animate-pulse"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Query Atual */}
            {currentQuery && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                Consultando: "{currentQuery.substring(0, 50)}{currentQuery.length > 50 ? '...' : ''}"
              </div>
            )}

            {/* Tempo Decorrido */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <Clock className="w-4 h-4" />
              <span>{elapsedTime}s decorridos</span>
              {estimatedTime && (
                <span className="text-gray-400 dark:text-gray-500">
                  • Estimativa: ~{estimatedTime}s
                </span>
              )}
            </div>

            {/* Dica Rotativa */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 mb-4 border border-blue-100 dark:border-blue-900">
              <p className="text-sm text-gray-700 dark:text-gray-300 animate-in fade-in duration-500" key={loadingTip}>
                {tips[loadingTip]}
              </p>
            </div>

            {/* CTA para Nova Consulta */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                🎯 Enquanto aguarda, que tal escrever uma nova pergunta?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const newWindow = window.open(window.location.href, '_blank');
                    newWindow?.focus();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em Nova Aba
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Sugestões */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quickSuggestions.map((suggestion, index) => (
          <QuickActionCard 
            key={index}
            icon={suggestion.icon}
            title={suggestion.text}
            description="Clique para consultar em nova aba"
            onClick={() => {
              const url = `${window.location.origin}?q=${encodeURIComponent(suggestion.query)}`;
              window.open(url, '_blank');
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Componente de Card de Ação Rápida
interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickActionCard({ icon, title, description, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md
        transition-all transform hover:-translate-y-1
        text-left group
      "
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </button>
  );
}