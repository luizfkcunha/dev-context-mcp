#!/usr/bin/env node

import { spawn } from 'child_process';

// Simular cliente MCP para teste
const testMCP = () => {
  console.log('🧪 Testando servidor MCP...\n');

  const server = spawn('node', ['mcp/server.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Teste 1: Listar recursos
  console.log('📋 Teste 1: Listando recursos...');
  const listResourcesRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'resources/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(listResourcesRequest) + '\n');

  // Teste 2: Listar ferramentas
  setTimeout(() => {
    console.log('🔧 Teste 2: Listando ferramentas...');
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  }, 1000);

  // Teste 3: Executar ferramenta
  setTimeout(() => {
    console.log('⚡ Teste 3: Executando ferramenta list-patterns...');
    const callToolRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list-patterns',
        arguments: {
          category: 'architecture'
        }
      }
    };
    
    server.stdin.write(JSON.stringify(callToolRequest) + '\n');
  }, 2000);

  // Capturar respostas
  server.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      console.log('✅ Resposta recebida:', JSON.stringify(response, null, 2));
    } catch (error) {
      console.log('📝 Output:', data.toString());
    }
  });

  server.on('error', (error) => {
    console.error('❌ Erro no servidor:', error);
  });

  server.on('close', (code) => {
    console.log(`🏁 Servidor finalizado com código ${code}`);
  });

  // Finalizar após 5 segundos
  setTimeout(() => {
    console.log('\n🔄 Finalizando teste...');
    server.kill();
  }, 5000);
};

testMCP();