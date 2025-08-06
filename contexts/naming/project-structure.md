# Estrutura de Projeto Padrão

## NextJS App Router

### Estrutura Base
```
my-nextjs-app/
├── .env.local                 # Variáveis de ambiente locais
├── .env.example               # Template de variáveis de ambiente
├── .gitignore                 # Arquivos ignorados pelo Git
├── next.config.js             # Configuração do NextJS
├── package.json               # Dependências e scripts
├── tailwind.config.js         # Configuração do Tailwind
├── tsconfig.json              # Configuração TypeScript
├── CLAUDE.md                  # Contexto para IA
├── README.md                  # Documentação do projeto
│
├── public/                    # Assets estáticos
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── src/                       # Código fonte
│   ├── app/                   # App Router (NextJS 13+)
│   │   ├── (auth)/           # Grupo de rotas
│   │   │   ├── login/
│   │   │   │   └── page.jsx
│   │   │   └── register/
│   │   │       └── page.jsx
│   │   │
│   │   ├── (dashboard)/      # Grupo de rotas protegidas
│   │   │   ├── dashboard/
│   │   │   │   ├── page.jsx
│   │   │   │   └── loading.jsx
│   │   │   └── profile/
│   │   │       └── page.jsx
│   │   │
│   │   ├── api/              # API routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.js
│   │   │   │   └── register/
│   │   │   │       └── route.js
│   │   │   └── users/
│   │   │       ├── route.js
│   │   │       └── [id]/
│   │   │           └── route.js
│   │   │
│   │   ├── globals.css       # Estilos globais
│   │   ├── layout.jsx        # Layout raiz
│   │   ├── loading.jsx       # Loading global
│   │   ├── error.jsx         # Error boundary global
│   │   ├── not-found.jsx     # Página 404
│   │   └── page.jsx          # Página inicial
│   │
│   ├── components/           # Componentes React
│   │   ├── ui/              # Componentes básicos
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── index.js     # Barrel exports
│   │   │
│   │   ├── forms/           # Componentes de formulário
│   │   │   ├── LoginForm.jsx
│   │   │   ├── UserForm.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── layout/          # Componentes de layout
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── index.js
│   │   │
│   │   └── providers/       # Context providers
│   │       ├── AuthProvider.jsx
│   │       ├── ThemeProvider.jsx
│   │       └── index.js
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useLocalStorage.js
│   │   ├── useDebounce.js
│   │   └── index.js
│   │
│   ├── lib/                 # Utilitários e configurações
│   │   ├── auth.js          # Configuração NextAuth
│   │   ├── prisma.js        # Cliente Prisma
│   │   ├── supabase.js      # Cliente Supabase
│   │   ├── utils.js         # Funções utilitárias
│   │   └── validations.js   # Esquemas de validação
│   │
│   ├── services/            # Serviços de API
│   │   ├── apiClient.js     # Cliente HTTP base
│   │   ├── authService.js   # Serviços de autenticação
│   │   ├── userService.js   # Serviços de usuário
│   │   └── index.js
│   │
│   ├── stores/              # Gerenciamento de estado
│   │   ├── useAuthStore.js  # Store de autenticação
│   │   ├── useUserStore.js  # Store de usuários
│   │   └── index.js
│   │
│   ├── types/               # Definições TypeScript
│   │   ├── api.types.ts     # Tipos da API
│   │   ├── auth.types.ts    # Tipos de autenticação
│   │   ├── user.types.ts    # Tipos de usuário
│   │   └── index.ts
│   │
│   └── constants/           # Constantes
│       ├── apiEndpoints.js  # Endpoints da API
│       ├── appConstants.js  # Constantes da aplicação
│       └── index.js
│
├── prisma/                  # Prisma schema e migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
│
├── tests/                   # Testes
│   ├── __mocks__/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── setup.js
│
└── docs/                    # Documentação
    ├── api.md
    ├── deployment.md
    └── development.md
```

## React + Vite

### Estrutura Base
```
my-vite-app/
├── .env                      # Variáveis de ambiente
├── .env.example             # Template de variáveis
├── index.html               # HTML template
├── package.json             # Dependências e scripts
├── vite.config.js           # Configuração do Vite
├── tailwind.config.js       # Configuração do Tailwind
├── tsconfig.json            # Configuração TypeScript
├── CLAUDE.md                # Contexto para IA
├── README.md                # Documentação
│
├── public/                  # Assets públicos
│   ├── images/
│   └── favicon.ico
│
├── src/                     # Código fonte
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes básicos
│   │   ├── forms/          # Componentes de formulário
│   │   ├── layout/         # Componentes de layout
│   │   └── providers/      # Context providers
│   │
│   ├── pages/              # Páginas/Views
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── hooks/              # Custom hooks
│   ├── services/           # Serviços de API
│   ├── stores/             # Gerenciamento de estado
│   ├── utils/              # Funções utilitárias
│   ├── types/              # Definições TypeScript
│   ├── constants/          # Constantes
│   │
│   ├── styles/             # Estilos
│   │   ├── globals.css     # Estilos globais
│   │   ├── components.css  # Estilos de componentes
│   │   └── utilities.css   # Utilitários CSS
│   │
│   ├── App.jsx             # Componente principal
│   ├── main.jsx            # Entry point
│   └── Router.jsx          # Configuração de rotas
│
├── tests/                  # Testes
└── docs/                   # Documentação
```

## Node.js + Express

### Estrutura Base
```
my-express-api/
├── .env                     # Variáveis de ambiente
├── .env.example            # Template de variáveis
├── .gitignore              # Arquivos ignorados
├── package.json            # Dependências e scripts
├── nodemon.json            # Configuração nodemon
├── jest.config.js          # Configuração Jest
├── CLAUDE.md               # Contexto para IA
├── README.md               # Documentação
│
├── src/                    # Código fonte
│   ├── controllers/        # Controladores
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── index.js
│   │
│   ├── middleware/         # Middlewares
│   │   ├── auth.js         # Middleware de autenticação
│   │   ├── validation.js   # Middleware de validação
│   │   ├── errorHandler.js # Handler de erros
│   │   └── index.js
│   │
│   ├── models/             # Modelos de dados
│   │   ├── User.js         # Model de usuário (Mongoose)
│   │   ├── Post.js         # Model de post
│   │   └── index.js
│   │
│   ├── routes/             # Definição de rotas
│   │   ├── authRoutes.js   # Rotas de autenticação
│   │   ├── userRoutes.js   # Rotas de usuário
│   │   ├── index.js        # Agregador de rotas
│   │   └── v1/             # Versionamento de API
│   │       ├── index.js
│   │       ├── auth.js
│   │       └── users.js
│   │
│   ├── services/           # Lógica de negócio
│   │   ├── authService.js  # Serviços de autenticação
│   │   ├── userService.js  # Serviços de usuário
│   │   ├── emailService.js # Serviços de email
│   │   └── index.js
│   │
│   ├── utils/              # Funções utilitárias
│   │   ├── helpers.js      # Funções auxiliares
│   │   ├── validators.js   # Validadores
│   │   ├── constants.js    # Constantes
│   │   └── index.js
│   │
│   ├── config/             # Configurações
│   │   ├── database.js     # Configuração do banco
│   │   ├── auth.js         # Configuração de auth
│   │   ├── email.js        # Configuração de email
│   │   └── index.js
│   │
│   ├── types/              # Definições TypeScript
│   │   ├── user.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   │
│   ├── app.js              # Configuração da aplicação
│   └── server.js           # Entry point
│
├── prisma/                 # Prisma (se usando)
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
│
├── tests/                  # Testes
│   ├── unit/              # Testes unitários
│   ├── integration/       # Testes de integração
│   ├── fixtures/          # Dados de teste
│   └── setup.js
│
├── docs/                  # Documentação
│   ├── api/              # Documentação da API
│   ├── deployment.md     # Deploy
│   └── development.md    # Desenvolvimento
│
└── scripts/               # Scripts utilitários
    ├── migrate.js        # Scripts de migração
    ├── seed.js          # Scripts de seed
    └── deploy.js        # Scripts de deploy
```

## Organização por Feature

### Estrutura Alternativa (Domain-Driven)
```
src/
├── shared/                 # Código compartilhado
│   ├── components/         # Componentes genéricos
│   ├── hooks/             # Hooks compartilhados
│   ├── services/          # Serviços base
│   ├── utils/             # Utilitários
│   └── types/             # Tipos compartilhados
│
├── features/              # Features específicas
│   ├── authentication/    # Feature de autenticação
│   │   ├── components/    # Componentes específicos
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── hooks/         # Hooks específicos
│   │   │   └── useAuth.js
│   │   ├── services/      # Serviços específicos
│   │   │   └── authService.js
│   │   ├── types/         # Tipos específicos
│   │   │   └── auth.types.ts
│   │   └── index.js       # Exports públicos
│   │
│   ├── user-management/   # Feature de gerenciamento
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.js
│   │
│   └── dashboard/         # Feature de dashboard
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── index.js
│
├── app/                   # Configuração da aplicação
│   ├── providers/         # Providers globais
│   ├── store/            # Store global
│   └── router/           # Configuração de rotas
│
└── pages/                 # Páginas que usam features
    ├── HomePage.jsx
    ├── LoginPage.jsx
    └── DashboardPage.jsx
```

## Arquivos de Configuração Essenciais

### 1. package.json
```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

### 2. CLAUDE.md (Contexto para IA)
```markdown
# Projeto Context

## Stack Técnica
- Next.js 14 com App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js

## Estrutura
- Componentes organizados por tipo em /src/components
- Páginas usando App Router em /src/app
- Hooks personalizados em /src/hooks
- Serviços de API em /src/services

## Convenções
- Componentes em PascalCase
- Hooks com prefixo "use"
- Arquivos de configuração em /src/lib
- Tipos TypeScript em /src/types

## Scripts Principais
- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run test` - Executar testes
```

### 3. .env.example
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Supabase (se usando)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Email (se usando)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## Boas Práticas de Organização

### 1. Barrel Exports (index.js)
```javascript
// components/ui/index.js
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Modal } from './Modal';

// Uso:
import { Button, Input, Modal } from '@/components/ui';
```

### 2. Absolute Imports (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

### 3. Separação de Responsabilidades
```javascript
// ✅ Separação clara
// services/userService.js - Lógica de negócio
// components/UserList.jsx - Apresentação
// hooks/useUsers.js - Estado e side effects
// types/user.types.ts - Definições de tipos
```