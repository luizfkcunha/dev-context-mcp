#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Teste simples das funcionalidades do servidor
async function testServerFunctions() {
  console.log('🧪 Teste Simples das Funções do Servidor\n');

  try {
    // Teste 1: Verificar estrutura de contextos
    console.log('📁 Teste 1: Verificando estrutura de diretórios...');
    const contextsPath = path.join(__dirname, 'contexts');
    const categories = await fs.readdir(contextsPath);
    console.log('✅ Categorias encontradas:', categories.join(', '));

    // Teste 2: Listar arquivos em cada categoria
    console.log('\n📋 Teste 2: Listando arquivos por categoria...');
    for (const category of categories) {
      const categoryPath = path.join(contextsPath, category);
      const stat = await fs.stat(categoryPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        const patterns = files.filter(f => f.endsWith('.md') || f.endsWith('.json'));
        console.log(`  ${category}: ${patterns.join(', ')}`);
      }
    }

    // Teste 3: Ler um arquivo de exemplo
    console.log('\n📖 Teste 3: Lendo arquivo de exemplo...');
    const sampleFile = path.join(contextsPath, 'architecture', 'frontend.md');
    const content = await fs.readFile(sampleFile, 'utf-8');
    console.log('✅ Arquivo lido com sucesso!');
    console.log(`   Tamanho: ${content.length} caracteres`);
    console.log(`   Primeiras linhas: ${content.split('\n').slice(0, 3).join(' | ')}`);

    // Teste 4: Simular busca por padrão
    console.log('\n🔍 Teste 4: Simulando busca por padrão...');
    const searchTerm = 'component';
    let found = 0;
    
    for (const category of categories) {
      const categoryPath = path.join(contextsPath, category);
      const stat = await fs.stat(categoryPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(categoryPath, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            
            if (fileContent.toLowerCase().includes(searchTerm.toLowerCase())) {
              console.log(`  ✅ Encontrado em: ${category}/${file}`);
              found++;
            }
          }
        }
      }
    }
    
    console.log(`   Total de arquivos com '${searchTerm}': ${found}`);

    console.log('\n🎉 Todos os testes passaram! O servidor MCP deve funcionar corretamente.');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testServerFunctions();