# Templates de Implementação de Autenticação

## 1. Template NextJS com NextAuth.js

### 1.1 Estrutura de Projeto
```
my-nextjs-auth-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── verify-email/route.ts
│   │   │   └── user/
│   │   │       └── profile/route.ts
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   └── error/page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── EmailVerificationForm.tsx
│   │   │   └── PasswordResetForm.tsx
│   │   └── providers/
│   │       ├── SessionProvider.tsx
│   │       └── Providers.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── email.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useLocalStorage.ts
│   └── types/
│       ├── auth.ts
│       └── user.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

### 1.2 Dependências do package.json
```json
{
  "name": "nextjs-auth-template",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next-auth": "^4.24.0",
    "@next-auth/prisma-adapter": "^1.0.7",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "react-hook-form": "@hookform/resolvers/zod",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.300.0",
    "nodemailer": "^6.9.0",
    "jsonwebtoken": "^9.0.0",
    "otplib": "^12.0.0",
    "qrcode": "^1.5.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/nodemailer": "^6.4.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/qrcode": "^1.5.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "prisma": "^5.0.0"
  }
}
```

### 1.3 Configuração de Ambiente (.env.example)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/myapp"

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourapp.com"

# Redis (for OTP and rate limiting)
REDIS_URL="redis://localhost:6379"

# App Configuration
NEXT_PUBLIC_APP_NAME="MyApp"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="your-32-char-encryption-key-here"

# File Upload
MAX_FILE_SIZE="5242880" # 5MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"
```

### 1.4 Script de Setup Automático
```bash
#!/bin/bash
# setup.sh - Script de configuração inicial

echo "🚀 Configurando template de autenticação NextJS..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Configurar banco de dados
echo "🗄️ Configurando banco de dados..."
npx prisma generate
npx prisma db push

# Criar diretórios necessários
echo "📁 Criando estrutura de diretórios..."
mkdir -p logs
mkdir -p uploads/avatars
mkdir -p uploads/documents

# Copiar arquivo de ambiente
if [ ! -f .env.local ]; then
  echo "⚙️ Criando arquivo de ambiente..."
  cp .env.example .env.local
  echo "❗ Configure as variáveis de ambiente em .env.local"
fi

# Gerar chave de criptografia
echo "🔐 Gerando chave de criptografia..."
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"" >> .env.local

# Gerar secret do NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"" >> .env.local

echo "✅ Setup concluído!"
echo "📋 Próximos passos:"
echo "   1. Configure as variáveis de ambiente em .env.local"
echo "   2. Configure seu provedor de email (SMTP)"
echo "   3. Configure Redis para OTP e rate limiting"
echo "   4. Execute 'npm run dev' para iniciar o servidor"
```

## 2. Template Express.js com Autenticação Completa

### 2.1 Estrutura de Projeto
```
express-auth-api/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── rateLimiting.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── uploads.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   ├── otpService.js
│   │   └── uploadService.js
│   ├── utils/
│   │   ├── crypto.js
│   │   ├── validation.js
│   │   ├── rateLimiter.js
│   │   └── logger.js
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   ├── email.js
│   │   └── upload.js
│   └── app.js
├── tests/
│   ├── auth.test.js
│   ├── user.test.js
│   └── setup.js
├── logs/
├── uploads/
├── .env
├── .env.example
├── package.json
├── server.js
└── README.md
```

### 2.2 Dependências do package.json
```json
{
  "name": "express-auth-api",
  "version": "1.0.0",
  "description": "API de autenticação completa com Express.js",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "seed": "node scripts/seed.js",
    "migrate": "node scripts/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "express-rate-limit": "^7.1.0",
    "express-validator": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^8.0.0",
    "ioredis": "^5.3.0",
    "nodemailer": "^6.9.0",
    "multer": "^1.4.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "zod": "^3.22.0",
    "otplib": "^12.0.0",
    "qrcode": "^1.5.0",
    "winston": "^3.11.0",
    "sharp": "^0.32.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "nodemon": "^3.0.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### 2.3 Configuração Principal (server.js)
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { connectDatabase } from './src/config/database.js';
import { connectRedis } from './src/config/redis.js';
import { logger } from './src/utils/logger.js';

// Routes
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import uploadRoutes from './src/routes/uploads.js';

// Middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { securityLogger } from './src/middleware/security.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(securityLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📖 Documentação: http://localhost:${PORT}/api/docs`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Encerrando servidor...');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

startServer();
```

## 3. Template React SPA com Context API

### 3.1 Estrutura de Projeto
```
react-auth-spa/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   ├── ForgotPasswordForm.jsx
│   │   │   └── AuthLayout.jsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Settings.jsx
│   │   └── layout/
│   │       ├── Header.jsx
│   │       ├── Sidebar.jsx
│   │       └── Layout.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   ├── useLocalStorage.js
│   │   └── useDebounce.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── userService.js
│   │   └── uploadService.js
│   ├── utils/
│   │   ├── validation.js
│   │   ├── crypto.js
│   │   ├── storage.js
│   │   └── constants.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   └── NotFound.jsx
│   ├── styles/
│   │   ├── index.css
│   │   ├── components.css
│   │   └── utilities.css
│   ├── App.jsx
│   ├── index.js
│   └── setupTests.js
├── package.json
├── tailwind.config.js
├── vite.config.js
└── .env.example
```

### 3.2 Context de Autenticação
```jsx
// src/contexts/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    const token = storage.getToken();
    if (token) {
      authService.verifyToken(token)
        .then(user => {
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { user, token } 
          });
        })
        .catch(() => {
          storage.removeToken();
        });
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authService.login(credentials);
      
      storage.setToken(response.token);
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: response 
      });
      
      return response;
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_ERROR', 
        payload: error.message 
      });
      throw error;
    }
  };

  const signup = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authService.signup(userData);
      return response;
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_ERROR', 
        payload: error.message 
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      storage.removeToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    signup,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
```

## 4. Template de Configuração Docker

### 4.1 Dockerfile para NextJS
```dockerfile
# Dockerfile.nextjs
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 4.2 Docker Compose para Stack Completa
```yaml
# docker-compose.yml
version: '3.8'

services:
  # NextJS Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.nextjs
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
    networks:
      - app-network

  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    networks:
      - app-network

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

  # Express API (optional)
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - db
      - redis
    networks:
      - app-network

  # Nginx as reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
      - api
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 4.3 Script de Deploy Automatizado
```bash
#!/bin/bash
# deploy.sh - Script de deploy automático

set -e

echo "🚀 Iniciando deploy da aplicação..."

# Configurações
APP_NAME="myapp"
DOCKER_REGISTRY="your-registry.com"
VERSION=$(git rev-parse --short HEAD)

# Build das imagens
echo "🏗️ Construindo imagens Docker..."
docker build -t $DOCKER_REGISTRY/$APP_NAME:$VERSION .
docker build -t $DOCKER_REGISTRY/$APP_NAME:latest .

# Push para registry
echo "📤 Enviando imagens para registry..."
docker push $DOCKER_REGISTRY/$APP_NAME:$VERSION
docker push $DOCKER_REGISTRY/$APP_NAME:latest

# Deploy para produção
echo "🚢 Fazendo deploy para produção..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Verificar saúde da aplicação
echo "🏥 Verificando saúde da aplicação..."
sleep 30

if curl -f http://localhost/health; then
    echo "✅ Deploy concluído com sucesso!"
else
    echo "❌ Deploy falhou - verificando logs..."
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Cleanup de imagens antigas
echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "🎉 Deploy finalizado!"
```

## 5. Template de Testes Automatizados

### 5.1 Configuração do Jest
```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### 5.2 Testes de Autenticação
```javascript
// tests/auth.test.js
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { connectTestDB, cleanupTestDB } from './setup.js';

describe('Authentication', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      name: 'João Silva',
      email: 'joao@exemplo.com',
      password: 'MinhaSenh@123',
      confirmPassword: 'MinhaSenh@123',
      acceptTerms: true,
      acceptPrivacy: true
    };

    it('deve registrar um novo usuário com dados válidos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('tempId');
      expect(response.body.message).toContain('verificação');
    });

    it('deve rejeitar email duplicado', async () => {
      // Criar usuário primeiro
      await User.create({
        ...validUserData,
        emailVerified: new Date()
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.error).toContain('já está em uso');
    });

    it('deve rejeitar senha fraca', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: '123456',
          confirmPassword: '123456'
        })
        .expect(400);

      expect(response.body.errors).toHaveProperty('password');
    });

    it('deve rejeitar email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'email-invalido'
        })
        .expect(400);

      expect(response.body.errors).toHaveProperty('email');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Teste User',
        email: 'teste@exemplo.com',
        password: 'hashedPassword123',
        emailVerified: new Date()
      });
    });

    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste@exemplo.com',
          password: 'MinhaSenh@123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('deve rejeitar credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste@exemplo.com',
          password: 'senhaErrada'
        })
        .expect(401);

      expect(response.body.error).toContain('incorretos');
    });

    it('deve implementar rate limiting', async () => {
      const promises = [];
      
      // Fazer muitas tentativas de login
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'teste@exemplo.com',
              password: 'senhaErrada'
            })
        );
      }

      await Promise.all(promises);

      // A próxima tentativa deve ser bloqueada
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste@exemplo.com',
          password: 'senhaErrada'
        })
        .expect(429);

      expect(response.body.error).toContain('tentativas');
    });
  });
});
```

### 5.3 Scripts de Automação
```json
{
  "scripts": {
    "setup:dev": "npm install && npm run db:setup && npm run seed:dev",
    "setup:prod": "./scripts/setup-prod.sh",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress run",
    "lint": "eslint src/ --fix",
    "format": "prettier --write src/",
    "db:setup": "npx prisma generate && npx prisma db push",
    "db:seed": "node scripts/seed.js",
    "build": "npm run lint && npm run test && next build",
    "deploy:staging": "./scripts/deploy-staging.sh",
    "deploy:prod": "./scripts/deploy-prod.sh"
  }
}
```