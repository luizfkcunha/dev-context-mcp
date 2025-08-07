# DevContext - Contexto de Desenvolvimento

## Sobre o Projeto

DevContext é um sistema abrangente de engenharia de contexto para desenvolvimento de aplicações JavaScript/TypeScript. Fornece padrões estruturados, boas práticas e contextos para agentes de IA desenvolverem projetos seguindo padrões consistentes, com foco em segurança, escalabilidade e facilidade de manutenção.

## Stack Tecnológica

### Frontend
- **NextJS** (App Router) - Framework React para produção
- **Vite + React** - Build tool moderna com React  
- **Tailwind CSS** - Framework CSS utilitário
- **TypeScript** - Tipagem estática para JavaScript

### Backend
- **Node.js + Express** - Servidor web robusto
- **NextAuth.js** - Autenticação para NextJS
- **Supabase Auth** - Backend-as-a-Service com auth

### Banco de Dados & Cache
- **PostgreSQL** com Prisma ORM
- **MongoDB** com Mongoose ODM
- **Redis** - Cache, sessões e rate limiting

### Autenticação & Segurança
- **Multi-Factor Authentication** (TOTP, SMS, Email)
- **JWT** com refresh tokens seguros
- **Rate Limiting** inteligente e progressivo
- **Criptografia** AES-256-GCM para dados sensíveis
- **Validação** rigorosa com Zod e sanitização
- **Compliance** LGPD/GDPR ready

## Estrutura do Projeto

```
DevContext/
├── contexts/                    # Contextos principais organizados por domínio
│   ├── architecture/           # Padrões de arquitetura frontend/backend
│   │   ├── frontend.md         # NextJS, Vite, React patterns
│   │   └── backend.md          # Express, layered architecture
│   ├── components/             # Padrões de componentes UI e formulários
│   │   ├── ui-patterns.md      # Button, Card, Modal components
│   │   └── form-patterns.md    # Validação, hooks, estado
│   ├── auth/                   # Padrões de autenticação completos
│   │   ├── nextjs-auth.md      # NextAuth.js configuration  
│   │   ├── supabase-auth.md    # Supabase auth patterns
│   │   ├── advanced-patterns.md # OTP, 2FA, security layers
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

## Padrões Implementados

### 1. Arquitetura Avançada
- **Frontend**: NextJS App Router, Vite+React, server components
- **Backend**: Express layered (controllers/services/models)
- **Estado**: Context API, hooks customizados, SWR/TanStack Query
- **Componentes**: Composição, HOCs, render props, compound components

### 2. Sistema de Design Robusto
- **Componentes**: Variants, sizes, estados (loading/error/success)
- **Composição**: Card.Header, Card.Content, Modal.Trigger
- **Formulários**: React Hook Form + Zod, validação real-time
- **Responsividade**: Mobile-first, acessibilidade WCAG
- **Temas**: Dark/light mode, CSS variables

### 3. Autenticação Empresarial
- **NextAuth.js**: Providers (Google, GitHub, Custom), JWT/Database sessions
- **Supabase**: Row Level Security, middleware, hooks
- **Multi-Factor**: TOTP (Google Authenticator), SMS OTP, Email OTP
- **Segurança**: Rate limiting progressivo, account lockout, audit logs
- **Compliance**: LGPD/GDPR, data anonymization, export tools

### 4. Convenções Profissionais
- **Arquivos**: kebab-case, feature folders, barrel exports
- **Componentes**: PascalCase, props interfaces, forwardRef
- **Funções**: camelCase, pure functions, error boundaries
- **CSS**: BEM methodology, Tailwind utilities, design tokens
- **APIs**: RESTful, consistent naming, versioning

### 5. Observabilidade Completa
- **Logging**: Winston structured logs, correlation IDs
- **Monitoramento**: Health checks, metrics collection, alerting  
- **Auditoria**: User actions, data changes, security events
- **Performance**: Request timing, memory usage, database queries
- **Errors**: Centralized handling, stack traces, user context

### 6. APIs de Produção
- **Cliente**: Axios interceptors, retry logic, offline support
- **Servidor**: Express security, CORS, rate limiting
- **Validação**: Input sanitization, schema validation, type safety
- **Upload**: Multer/Sharp, file validation, S3 integration
- **Cache**: Redis layers, CDN integration, cache invalidation

## Como Usar como Agente de IA

### 1. Configuração MCP (Model Context Protocol)
```bash
# Instalar dependências
npm install

# Iniciar servidor MCP  
npm start
```

Adicione ao `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "devcontext": {
      "command": "node", 
      "args": ["C:/path/to/DevContext/mcp/server.js"],
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

### 2. Comandos MCP Disponíveis

#### `get-pattern <categoria> <padrão>`
Obter implementação específica com código completo:
```
get-pattern auth advanced-patterns
get-pattern components ui-patterns  
get-pattern architecture frontend
```

#### `list-patterns <categoria>`
Listar todos os padrões disponíveis:
```
list-patterns auth         # nextjs-auth, supabase-auth, advanced-patterns
list-patterns components   # ui-patterns, form-patterns
list-patterns architecture # frontend, backend
```

#### `search-patterns <palavra-chave>`
Buscar por funcionalidade específica:
```
search-patterns authentication  # Todos padrões de auth
search-patterns validation     # Validação de formulários
search-patterns rate-limiting  # Rate limiting patterns
```

#### `get-project-template <tipo>`
Obter template completo para início rápido:
```
get-project-template nextjs-auth    # NextJS com auth completa
get-project-template express-api    # Express API robusta  
get-project-template react-spa      # React SPA com Context
```

### 3. Categorias de Contextos

#### 🏗️ `architecture`
- **frontend.md**: NextJS App Router, Vite+React, componentes
- **backend.md**: Express layered, controllers, middleware

#### 🎨 `components`  
- **ui-patterns.md**: Button, Card, Modal, design system
- **form-patterns.md**: Validação, hooks, estados

#### 🔐 `auth`
- **nextjs-auth.md**: NextAuth.js completo
- **supabase-auth.md**: Supabase auth patterns
- **advanced-patterns.md**: OTP, 2FA, segurança avançada
- **implementation-guidelines.md**: Deploy, manutenção, CI/CD

#### 📁 `naming`
- **conventions.md**: Arquivos, variáveis, estrutura de projeto

#### 📝 `logging`
- **patterns.md**: Winston, correlation, auditoria, métricas

#### 🌐 `api`
- **client-patterns.md**: Axios, hooks, error handling
- **server-patterns.md**: Express, CRUD, upload, rate limiting

## Diretrizes para Agentes de IA

### ✅ **Sempre Implementar**
- **Código Completo**: Nunca fornecer pseudo-código, sempre implementações funcionais
- **Segurança por Design**: Validação, sanitização, autenticação em todas as features
- **Error Handling**: Try/catch, error boundaries, fallbacks graceful
- **TypeScript**: Tipagem forte, interfaces, generic types onde aplicável
- **Testes**: Incluir exemplos de testes unitários e integração
- **Acessibilidade**: ARIA labels, keyboard navigation, screen readers

### 🎯 **Padrões de Qualidade**
- **Performance**: Lazy loading, memoization, bundle splitting
- **SEO**: Meta tags, structured data, server-side rendering
- **Mobile**: Responsive design, touch interactions, PWA features
- **Monitoring**: Logs estruturados, métricas, health checks
- **Deploy**: Docker, CI/CD, environment configs

### 🚫 **Evitar**
- Código sem validação ou tratamento de erros
- Implementações sem considerações de segurança
- Componentes sem acessibilidade básica
- APIs sem rate limiting ou validação
- Senhas em texto plano ou criptografia fraca

## Implementando Novos Contextos

### 1. Estrutura Padrão
Cada contexto deve conter:

```markdown
# Nome do Padrão

## 1. Visão Geral
Descrição clara do que o padrão resolve

## 2. Casos de Uso
- Quando usar este padrão
- Cenários ideais de aplicação
- Limitações e trade-offs

## 3. Implementação Completa
Código funcional pronto para uso

## 4. Configuração & Setup
- Dependências necessárias
- Variáveis de ambiente
- Scripts de instalação

## 5. Segurança & Validação
- Vulnerabilidades conhecidas
- Mitigações implementadas  
- Boas práticas de segurança

## 6. Testes & Validação
- Testes unitários
- Testes de integração
- Cenários de edge cases

## 7. Deploy & Manutenção
- Scripts de deployment
- Monitoramento
- Troubleshooting comum
```

### 2. Processo de Adição

1. **Criar arquivo**: `contexts/categoria/novo-padrao.md`
2. **Seguir estrutura padrão** com código completo
3. **Atualizar MCP server**: Adicionar referência em `mcp/server.js`
4. **Testar implementação**: Verificar via comandos MCP
5. **Documentar no README**: Adicionar à lista de padrões

### 3. Critérios de Qualidade

- ✅ Código totalmente funcional (sem TODO ou pseudo-código)
- ✅ Segurança implementada (validação, sanitização, auth)
- ✅ Error handling robusto (try/catch, fallbacks)
- ✅ Testes incluídos (unit, integration, edge cases)
- ✅ TypeScript quando aplicável (types, interfaces)
- ✅ Documentação clara (casos de uso, configuração)

## Princípios Fundamentais

### 1. Segurança por Design
- Validação rigorosa de todas as entradas
- Sanitização de dados antes do processamento
- Autenticação e autorização em camadas
- Princípio do menor privilégio
- Logs de auditoria para ações sensíveis

### 2. Escalabilidade
- Arquitetura em camadas desacopladas
- Cache inteligente em múltiplas camadas  
- Rate limiting para proteção de recursos
- Otimizações de performance (lazy loading, memoization)
- Preparação para crescimento horizontal

### 3. Manutenibilidade
- Código limpo e autodocumentado
- Separação clara de responsabilidades
- Testes abrangentes automatizados
- Monitoramento proativo de saúde
- Documentação atualizada e precisa

### 4. Experiência do Desenvolvedor
- Setup automatizado com scripts
- Templates prontos para uso imediato
- Documentação com exemplos práticos
- Error messages claros e acionáveis
- Ferramentas de debug e profiling

### 5. Produção Ready
- Docker containers otimizados
- CI/CD pipelines automatizados
- Monitoramento e alertas configurados
- Backup e disaster recovery
- Compliance com regulamentações (LGPD/GDPR)

O objetivo é fornecer contextos ricos, seguros e prontos para produção que permitam aos agentes de IA criarem aplicações robustas, escaláveis e bem arquitetadas seguindo as melhores práticas da indústria.