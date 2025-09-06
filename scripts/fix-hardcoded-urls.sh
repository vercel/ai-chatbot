#!/bin/bash

# Script para substituir todas as ocorrências de localhost:3033 hardcoded
# por chamadas para a função getBaseUrl()

echo "🔍 Encontrando arquivos com localhost:3033..."

# Contador de arquivos modificados
modified=0

# Encontra todos os arquivos TypeScript/JavaScript com localhost:3033
# Exclui node_modules, .next e arquivos de teste
files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./tests/*" \
  -not -path "./test/*" \
  -not -path "./*test*" \
  -exec grep -l "localhost:3033" {} \;)

if [ -z "$files" ]; then
  echo "✅ Nenhum arquivo com localhost:3033 hardcoded encontrado!"
  exit 0
fi

echo "📋 Arquivos encontrados:"
echo "$files"
echo ""

# Cria backup
backup_dir="../backup-url-fix-$(date +%Y%m%d-%H%M%S)"
echo "💾 Criando backup em: $backup_dir"
mkdir -p "$backup_dir"
cp -r . "$backup_dir"

# Processa cada arquivo
for file in $files; do
  echo "📝 Processando: $file"
  
  # Verifica se já importa getBaseUrl
  if ! grep -q "import.*getBaseUrl" "$file"; then
    # Adiciona import no início do arquivo (após outros imports)
    # Primeiro, tenta encontrar o último import
    last_import_line=$(grep -n "^import " "$file" | tail -1 | cut -d: -f1)
    
    if [ -n "$last_import_line" ]; then
      # Adiciona após o último import
      sed -i "${last_import_line}a\\import { getBaseUrl } from '@/lib/get-url';" "$file"
      echo "   ➕ Import adicionado"
    fi
  fi
  
  # Substitui diferentes padrões de localhost:3033
  # Padrão 1: 'http://localhost:3033'
  sed -i "s|'http://localhost:3033'|getBaseUrl()|g" "$file"
  
  # Padrão 2: "http://localhost:3033"
  sed -i "s|\"http://localhost:3033\"|getBaseUrl()|g" "$file"
  
  # Padrão 3: template strings com localhost:3033
  sed -i "s|\\\`http://localhost:3033|\\\`\${getBaseUrl()}|g" "$file"
  
  # Padrão 4: localhost:3033 sem protocolo
  sed -i "s|'localhost:3033'|getBaseUrl().replace('http://', '').replace('https://', '')|g" "$file"
  sed -i "s|\"localhost:3033\"|getBaseUrl().replace('http://', '').replace('https://', '')|g" "$file"
  
  ((modified++))
done

echo ""
echo "✅ Concluído!"
echo "📊 Total de arquivos modificados: $modified"
echo "💾 Backup salvo em: $backup_dir"
echo ""
echo "⚠️  Lembre-se de:"
echo "   1. Revisar as mudanças com: git diff"
echo "   2. Testar a aplicação"
echo "   3. Fazer commit das mudanças"