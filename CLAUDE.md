# DevContext - Contexto de Desenvolvimento

## Sobre o Projeto

DevContext é um sistema abrangente de engenharia de contexto para desenvolvimento de aplicações JavaScript/TypeScript. Fornece padrões estruturados, boas práticas e contextos para agentes de IA desenvolverem projetos seguindo padrões consistentes.

## Stack Tecnológica

- **Frontend**: NextJS (App Router), Vite + React
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL, MongoDB
- **ORMs**: Prisma, Mongoose
- **Autenticação**: NextAuth.js, Supabase Auth
- **Linguagens**: JavaScript, TypeScript
- **Estilização**: Tailwind CSS

## Estrutura do Projeto

```
DevContext/
├── contexts/              # Contextos principais organizados por domínio
│   ├── architecture/      # Padrões de arquitetura frontend/backend
│   ├── components/        # Padrões de componentes UI e formulários
│   ├── auth/             # Padrões de autenticação (NextAuth, Supabase)
│   ├── naming/           # Convenções de nomenclatura e estrutura
│   ├── logging/          # Padrões de logging e rastreabilidade
│   └── api/              # Padrões de cliente e servidor API
├── templates/            # Templates de código reutilizáveis
├── configs/              # Configurações padrão
└── mcp/                  # Servidor MCP para integração com IAs
```

## Padrões Implementados

### 1. Arquitetura
- **Frontend**: Estruturas NextJS App Router e Vite+React
- **Backend**: APIs RESTful com Express, arquitetura em camadas
- **Componentes**: Padrões de composição, HOCs, render props
- **Estado**: Context API, hooks customizados, SWR

### 2. Componentes UI
- Sistema de design consistente com variants
- Componentes compostos (Card.Header, Card.Content)
- Formulários com validação integrada
- Estados de loading, erro e sucesso
- Responsividade e acessibilidade

### 3. Autenticação
- **NextAuth.js**: Configuração completa com providers
- **Supabase**: Auth com RLS, middleware, hooks
- Proteção de rotas no frontend e backend
- Gerenciamento de sessão e tokens

### 4. Nomenclatura
- Convenções para arquivos, componentes, funções
- Estrutura de projeto padronizada
- Padrões de nomenclatura de CSS, APIs, banco de dados
- Organização por feature vs por tipo

### 5. Logging
- Logger estruturado com Winston
- Correlação de requests
- Audit trail e métricas
- Error tracking e performance monitoring

### 6. APIs
- Cliente HTTP configurado com interceptors
- Padrões de service layer e hooks
- CRUD controllers com validação
- Upload de arquivos, paginação, rate limiting

## Como Usar

### 1. Como MCP Server
Configure o servidor MCP para integração com Claude:

```bash
npm install
npm start
```

### 2. Comandos Disponíveis via MCP
- `get-pattern`: Obter padrão específico por categoria
- `list-patterns`: Listar padrões em uma categoria  
- `search-patterns`: Buscar padrões por palavra-chave
- `get-project-template`: Obter template de estrutura de projeto

### 3. Categorias de Contextos
- `architecture`: Padrões de arquitetura
- `components`: Componentes UI e formulários
- `auth`: Autenticação e autorização
- `naming`: Convenções e estrutura
- `logging`: Logging e monitoramento
- `api`: Cliente e servidor API

## Princípios e Boas Práticas

### 1. Consistência
- Padrões uniformes em todo o código
- Nomenclatura consistente e descritiva
- Estrutura de projeto padronizada

### 2. Reutilização
- Componentes modulares e composáveis
- Hooks customizados para lógica compartilhada
- Services e utilitários reutilizáveis

### 3. Manutenibilidade
- Separação clara de responsabilidades
- Código autodocumentado
- Tratamento de erros abrangente

### 4. Performance
- Code splitting e lazy loading
- Memoização e otimizações
- Rate limiting e cache

### 5. Segurança
- Validação de entrada rigorosa
- Autenticação e autorização robustas
- Sanitização de dados

## Instalação e Setup

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure o servidor MCP: `npm start`
4. Use os padrões nos seus projetos seguindo a documentação

## Contribuição

Cada contexto segue a estrutura:
- Explicação do padrão
- Exemplo de código completo
- Casos de uso específicos
- Boas práticas e anti-padrões

O objetivo é fornecer contextos ricos e estruturados para agentes de IA criarem aplicações consistentes e bem arquitetadas.