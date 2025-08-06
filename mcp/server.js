#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DevContextServer {
  constructor() {
    this.server = new Server(
      {
        name: 'devcontext-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.contextsPath = path.join(__dirname, '..', 'contexts');
    this.setupHandlers();
  }

  setupHandlers() {
    // Handler para listar recursos disponíveis
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [];
      
      try {
        const categories = await fs.readdir(this.contextsPath);
        
        for (const category of categories) {
          const categoryPath = path.join(this.contextsPath, category);
          const stat = await fs.stat(categoryPath);
          
          if (stat.isDirectory()) {
            const files = await fs.readdir(categoryPath);
            
            for (const file of files) {
              if (file.endsWith('.md') || file.endsWith('.json')) {
                resources.push({
                  uri: `devcontext://${category}/${file}`,
                  name: `${category}/${file}`,
                  description: `Context pattern for ${category} - ${file.replace(/\.(md|json)$/, '')}`,
                  mimeType: file.endsWith('.md') ? 'text/markdown' : 'application/json',
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error listing resources:', error);
      }

      return { resources };
    });

    // Handler para ler recursos específicos
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      if (!uri.startsWith('devcontext://')) {
        throw new Error(`Invalid URI: ${uri}`);
      }

      const resourcePath = uri.replace('devcontext://', '');
      const fullPath = path.join(this.contextsPath, resourcePath);

      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const mimeType = resourcePath.endsWith('.md') ? 'text/markdown' : 'application/json';
        
        return {
          contents: [{
            uri,
            mimeType,
            text: content,
          }],
        };
      } catch (error) {
        throw new Error(`Failed to read resource: ${error.message}`);
      }
    });

    // Handler para listar ferramentas disponíveis
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get-pattern',
            description: 'Get a specific development pattern by category and name',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Pattern category (architecture, components, auth, naming, logging, api)',
                  enum: ['architecture', 'components', 'auth', 'naming', 'logging', 'api'],
                },
                pattern: {
                  type: 'string',
                  description: 'Specific pattern name',
                },
              },
              required: ['category', 'pattern'],
            },
          },
          {
            name: 'list-patterns',
            description: 'List all available patterns in a category',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Pattern category to list',
                  enum: ['architecture', 'components', 'auth', 'naming', 'logging', 'api'],
                },
              },
              required: ['category'],
            },
          },
          {
            name: 'search-patterns',
            description: 'Search for patterns containing specific keywords',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get-project-template',
            description: 'Get project structure template for a specific stack',
            inputSchema: {
              type: 'object',
              properties: {
                stack: {
                  type: 'string',
                  description: 'Technology stack',
                  enum: ['nextjs', 'vite-react', 'express-api'],
                },
              },
              required: ['stack'],
            },
          },
        ],
      };
    });

    // Handler para executar ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get-pattern':
          return await this.getPattern(args.category, args.pattern);
        
        case 'list-patterns':
          return await this.listPatterns(args.category);
        
        case 'search-patterns':
          return await this.searchPatterns(args.query);
        
        case 'get-project-template':
          return await this.getProjectTemplate(args.stack);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async getPattern(category, pattern) {
    try {
      const categoryPath = path.join(this.contextsPath, category);
      const files = await fs.readdir(categoryPath);
      
      // Tentar encontrar o arquivo exato ou similar
      const matchingFile = files.find(file => 
        file.replace(/\.(md|json)$/, '') === pattern ||
        file.includes(pattern)
      );

      if (!matchingFile) {
        return {
          content: [{
            type: 'text',
            text: `Pattern '${pattern}' not found in category '${category}'. Available patterns: ${files.map(f => f.replace(/\.(md|json)$/, '')).join(', ')}`,
          }],
        };
      }

      const filePath = path.join(categoryPath, matchingFile);
      const content = await fs.readFile(filePath, 'utf-8');

      return {
        content: [{
          type: 'text',
          text: content,
        }],
      };
    } catch (error) {
      throw new Error(`Failed to get pattern: ${error.message}`);
    }
  }

  async listPatterns(category) {
    try {
      const categoryPath = path.join(this.contextsPath, category);
      const files = await fs.readdir(categoryPath);
      
      const patterns = files
        .filter(file => file.endsWith('.md') || file.endsWith('.json'))
        .map(file => file.replace(/\.(md|json)$/, ''));

      return {
        content: [{
          type: 'text',
          text: `Available patterns in '${category}':\n${patterns.map(p => `- ${p}`).join('\n')}`,
        }],
      };
    } catch (error) {
      throw new Error(`Failed to list patterns: ${error.message}`);
    }
  }

  async searchPatterns(query) {
    try {
      const results = [];
      const categories = await fs.readdir(this.contextsPath);

      for (const category of categories) {
        const categoryPath = path.join(this.contextsPath, category);
        const stat = await fs.stat(categoryPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(categoryPath);
          
          for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.json')) {
              const filePath = path.join(categoryPath, file);
              const content = await fs.readFile(filePath, 'utf-8');
              
              if (content.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                  category,
                  pattern: file.replace(/\.(md|json)$/, ''),
                  file,
                });
              }
            }
          }
        }
      }

      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No patterns found containing '${query}'`,
          }],
        };
      }

      const resultText = results
        .map(r => `- ${r.category}/${r.pattern}`)
        .join('\n');

      return {
        content: [{
          type: 'text',
          text: `Patterns containing '${query}':\n${resultText}`,
        }],
      };
    } catch (error) {
      throw new Error(`Failed to search patterns: ${error.message}`);
    }
  }

  async getProjectTemplate(stack) {
    const templates = {
      'nextjs': 'naming/project-structure.md',
      'vite-react': 'naming/project-structure.md',
      'express-api': 'naming/project-structure.md',
    };

    const templateFile = templates[stack];
    if (!templateFile) {
      throw new Error(`Template for stack '${stack}' not found`);
    }

    try {
      const filePath = path.join(this.contextsPath, templateFile);
      const content = await fs.readFile(filePath, 'utf-8');

      // Extrair apenas a seção relevante do template
      const lines = content.split('\n');
      const stackSectionStart = lines.findIndex(line => 
        line.toLowerCase().includes(stack.replace('-', ' '))
      );

      if (stackSectionStart === -1) {
        return {
          content: [{
            type: 'text',
            text: content, // Retorna todo o conteúdo se não encontrar seção específica
          }],
        };
      }

      // Encontra o fim da seção (próximo cabeçalho principal)
      let stackSectionEnd = lines.length;
      for (let i = stackSectionStart + 1; i < lines.length; i++) {
        if (lines[i].startsWith('## ') && !lines[i].toLowerCase().includes(stack.replace('-', ' '))) {
          stackSectionEnd = i;
          break;
        }
      }

      const sectionContent = lines.slice(stackSectionStart, stackSectionEnd).join('\n');

      return {
        content: [{
          type: 'text',
          text: sectionContent,
        }],
      };
    } catch (error) {
      throw new Error(`Failed to get project template: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DevContext MCP Server running on stdio');
  }
}

const server = new DevContextServer();
server.run().catch(console.error);