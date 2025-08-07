# DevContext - Engenharia de Contexto para Desenvolvimento JavaScript/TypeScript

Sistema abrangente de padrões, boas práticas e contextos para desenvolvimento de aplicações modernas usando JavaScript e TypeScript.

## Objetivo

Fornecer contextos estruturados para agentes de IA desenvolverem projetos seguindo padrões consistentes e boas práticas de desenvolvimento, com foco em:

- **Consistência**: Padrões uniformes em todo o código
- **Segurança**: Implementações robustas e validadas
- **Escalabilidade**: Arquiteturas preparadas para crescimento  
- **Manutenibilidade**: Código limpo e bem documentado
- **Facilidade de Uso**: Templates e scripts automatizados

## Stack Suportada

### Frontend
- **NextJS** (App Router) - Framework React para produção
- **Vite + React** - Build tool moderna com React
- **Tailwind CSS** - Framework CSS utilitário
- **TypeScript** - Tipagem estática para JavaScript

### Backend
- **Node.js + Express** - Servidor web robusto
- **NextAuth.js** - Autenticação para NextJS
- **Supabase Auth** - Backend-as-a-Service com auth

### Banco de Dados
- **PostgreSQL** com Prisma ORM
- **MongoDB** com Mongoose ODM
- **Redis** - Cache e sessões

### Autenticação & Segurança
- **Multi-Factor Authentication** (TOTP, SMS, Email)
- **JWT** com refresh tokens
- **Rate Limiting** inteligente
- **Criptografia** de dados sensíveis

## Estrutura do Projeto

```
DevContext/
├── contexts/                    # Contextos principais organizados por domínio
│   ├── architecture/           # Padrões de arquitetura frontend/backend
│   │   ├── frontend.md         # NextJS, Vite, React patterns
│   │   └── backend.md          # Express, API design patterns
│   ├── components/             # Padrões de componentes UI e formulários
│   │   ├── ui-patterns.md      # Button, Card, Modal, etc.
│   │   └── form-patterns.md    # Validação, hooks, estado
│   ├── auth/                   # Padrões de autenticação completos
│   │   ├── nextjs-auth.md      # NextAuth.js configuration
│   │   ├── supabase-auth.md    # Supabase auth patterns
│   │   ├── advanced-patterns.md # OTP, 2FA, security
│   │   └── implementation-guidelines.md # Deploy & maintenance
│   ├── naming/                 # Convenções de nomenclatura e estrutura
│   │   └── conventions.md      # Arquivos, variáveis, funções
│   ├── logging/                # Padrões de logging e rastreabilidade
│   │   └── patterns.md         # Winston, correlation, audit
│   └── api/                    # Padrões de cliente e servidor API
│       ├── client-patterns.md  # Axios, hooks, error handling
│       └── server-patterns.md  # Express, controllers, middleware
├── templates/                  # Templates de código reutilizáveis
│   ├── nextjs-starter.md      # Template completo NextJS
│   └── auth-templates.md       # Templates de autenticação
├── configs/                    # Configurações padrão
└── mcp/                       # Servidor MCP para integração com IAs
    ├── server.js              # Servidor principal MCP
    └── config.json            # Configuração Claude Desktop
```

## Funcionalidades Implementadas

### 🏗️ **Arquitetura**
- **Frontend**: NextJS App Router, Vite+React, componentes reutilizáveis
- **Backend**: Express layered architecture, controllers/services/models
- **Estado**: Context API, hooks customizados, SWR patterns

### 🎨 **Componentes UI**
- Sistema de design com variants (primary, secondary, etc.)
- Componentes compostos (Card.Header, Card.Content)
- Formulários com validação integrada (Zod, React Hook Form)
- Estados de loading, erro e sucesso
- Responsividade e acessibilidade

### 🔐 **Autenticação Avançada**
- **NextAuth.js**: Providers (Google, GitHub), JWT, sessions
- **Supabase**: RLS policies, middleware, hooks
- **Multi-Factor**: TOTP (Google Authenticator), SMS, Email OTP
- **Segurança**: Rate limiting, validation, encryption
- **Compliance**: LGPD/GDPR ready, audit logs

### 📝 **Logging & Monitoring**  
- Logger estruturado (Winston)
- Correlation IDs para tracing
- Audit trail completo
- Health checks automatizados
- Métricas de performance

### 🌐 **APIs Robustas**
- Cliente HTTP com interceptors
- Error handling padronizado
- Upload de arquivos
- Paginação e filtros
- Rate limiting por endpoint

## Como Usar

### 1. Como MCP Server (Recomendado)

Configure o servidor MCP para integração direta com Claude:

```bash
# Instalar dependências
npm install

# Iniciar servidor MCP
npm start
```

#### Configuração no Claude Desktop

Adicione ao seu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "devcontext": {
      "command": "node",
      "args": ["C:/caminho/para/DevContext/mcp/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 2. Comandos MCP Disponíveis

- **`get-pattern`**: Obter padrão específico
  ```
  Categoria: architecture, components, auth, naming, logging, api
  Padrão: frontend, ui-patterns, nextjs-auth, etc.
  ```

- **`list-patterns`**: Listar todos os padrões de uma categoria
  ```
  Categoria: architecture, components, auth, etc.
  ```

- **`search-patterns`**: Buscar padrões por palavra-chave
  ```
  Palavra-chave: react, authentication, validation, etc.
  ```

- **`get-project-template`**: Obter template de estrutura completa
  ```
  Tipo: nextjs-auth, express-api, react-spa
  ```

### 3. Uso Direto dos Contextos

Você também pode acessar diretamente os arquivos markdown para consulta manual:

- `contexts/auth/advanced-patterns.md` - Autenticação completa
- `templates/auth-templates.md` - Templates prontos
- `contexts/auth/implementation-guidelines.md` - Guias de deploy

## Como Implementar Novos Contextos

### 1. Estrutura de um Contexto

Cada contexto deve seguir esta estrutura padrão:

```markdown
# Nome do Contexto

## 1. Visão Geral
Breve descrição do que o contexto aborda

## 2. Casos de Uso
Quando e onde usar este padrão

## 3. Implementação
Código completo com exemplos práticos

## 4. Configuração
Setup necessário, dependências, variáveis

## 5. Boas Práticas
Dicas, armadilhas comuns, otimizações

## 6. Testes
Como testar e validar a implementação

## 7. Exemplos Avançados
Cenários complexos e integração com outros padrões
```

### 2. Adicionando um Novo Contexto

#### Passo 1: Criar o arquivo
```bash
# Para um novo padrão de componente
touch contexts/components/novo-padrao.md

# Para um novo padrão de arquitetura  
touch contexts/architecture/nova-arquitetura.md

# Para um novo template
touch templates/novo-template.md
```

#### Passo 2: Seguir o padrão de documentação
```markdown
# Novo Padrão de Componente

## 1. Visão Geral
Este padrão implementa...

## 2. Casos de Uso
- Quando você precisa de...
- Para situações onde...
- Ideal para projetos que...

## 3. Implementação

### 3.1 Código Base
```javascript
// Exemplo completo funcional
export function NovoComponente({ variant = 'default', ...props }) {
  // Implementação detalhada
}
```

### 3.2 Hooks Relacionados
```javascript
// Hooks customizados se necessário
export function useNovoComportamento() {
  // Lógica do hook
}
```

## 4. Configuração

### 4.1 Dependências
```json
{
  "dependencies": {
    "biblioteca-necessaria": "^1.0.0"
  }
}
```

### 4.2 Setup
```bash
npm install biblioteca-necessaria
```

## 5. Boas Práticas
- ✅ Sempre fazer...
- ❌ Evitar...
- 🔧 Para otimizar...

## 6. Testes
```javascript
// Exemplos de testes
describe('NovoComponente', () => {
  it('deve funcionar corretamente', () => {
    // Test implementation
  });
});
```
```

#### Passo 3: Atualizar o servidor MCP

Adicione o novo contexto ao `mcp/server.js`:

```javascript
// No método getPattern ou similar, adicionar referência ao novo arquivo
case 'novo-padrao':
  return await this.readContextFile('components/novo-padrao.md');
```

#### Passo 4: Testar o contexto
```bash
# Reiniciar o servidor MCP
npm start

# Testar via MCP
# get-pattern components novo-padrao
```

### 3. Diretrizes para Contextos de Qualidade

#### ✅ **Fazer**
- **Código Completo**: Sempre fornecer implementações funcionais
- **Casos Reais**: Usar exemplos práticos e aplicáveis  
- **Configuração Clara**: Incluir setup, dependências, variáveis
- **Boas Práticas**: Documentar o que fazer e evitar
- **Testes Incluídos**: Mostrar como validar a implementação
- **Segurança**: Considerar vulnerabilidades e mitigações

#### ❌ **Evitar**
- Código incompleto ou pseudo-código
- Exemplos muito abstratos ou teóricos
- Falta de instruções de setup
- Documentação apenas técnica sem contexto
- Padrões sem justificativa ou casos de uso

#### 🎯 **Qualidade**
- **Modularidade**: Cada contexto deve ser independente
- **Reutilização**: Padrões aplicáveis em múltiplos projetos
- **Atualização**: Manter compatibilidade com versões atuais
- **Clareza**: Documentação compreensível para diferentes níveis

## Testando o Sistema

### Testes Básicos
```bash
# Validar estrutura de arquivos
npm test

# Testar servidor MCP  
npm run test-mcp

# Verificar conectividade
npm run start
```

### Testes com Claude Desktop
1. Configure o MCP server no Claude Desktop
2. Reinicie o Claude Desktop
3. Digite comandos MCP para testar:
   - "get-pattern auth advanced-patterns"
   - "list-patterns components"  
   - "search-patterns authentication"