# Diretrizes de Implementação e Manutenção de Autenticação

## 1. Princípios Fundamentais

### 1.1 Facilidade de Implementação
- **Modularidade**: Cada funcionalidade deve ser independente e reutilizável
- **Configuração por Ambiente**: Variáveis de ambiente para diferentes contextos
- **Scripts de Automação**: Setup, deploy e manutenção automatizados
- **Documentação Clara**: Exemplos práticos e guias passo-a-passo
- **Templates Prontos**: Estruturas pré-configuradas para início rápido

### 1.2 Facilidade de Implantação
- **Containerização**: Docker para ambientes consistentes
- **CI/CD**: Pipelines automatizados de integração e deploy
- **Monitoramento**: Logs estruturados e métricas de performance
- **Reversibilidade**: Estratégias de rollback em caso de problemas
- **Escalabilidade**: Arquitetura preparada para crescimento

### 1.3 Facilidade de Manutenção
- **Código Limpo**: Padrões consistentes e bem documentados
- **Testes Automatizados**: Cobertura abrangente de funcionalidades
- **Versionamento**: Controle de mudanças e compatibilidade
- **Monitoramento Proativo**: Alertas e métricas de saúde
- **Atualizações Seguras**: Processo controlado de updates

## 2. Guia de Implementação Passo-a-Passo

### 2.1 Setup Inicial do Projeto

#### Passo 1: Escolha do Template
```bash
# Clonar template NextJS
git clone https://github.com/your-org/nextjs-auth-template.git my-app
cd my-app

# Ou usar create-next-app com template customizado
npx create-next-app@latest my-app --template nextjs-auth
```

#### Passo 2: Configuração do Ambiente
```bash
# Executar script de setup automático
chmod +x setup.sh
./setup.sh

# Ou configuração manual
npm install
cp .env.example .env.local
npm run db:setup
npm run db:seed
```

#### Passo 3: Personalização
```javascript
// config/app.js - Configurações específicas do app
export const appConfig = {
  name: 'Minha Aplicação',
  version: '1.0.0',
  features: {
    socialLogin: true,
    twoFactor: true,
    emailVerification: true,
    passwordReset: true
  },
  security: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000 // 15 minutos
  }
};
```

### 2.2 Configuração de Banco de Dados

#### PostgreSQL com Prisma
```bash
# 1. Configurar DATABASE_URL no .env
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# 2. Gerar e aplicar migrações
npx prisma generate
npx prisma db push

# 3. Seed inicial (opcional)
npx prisma db seed
```

#### MongoDB com Mongoose
```bash
# 1. Configurar MONGODB_URL no .env
MONGODB_URL="mongodb://localhost:27017/myapp"

# 2. Executar migrações
npm run migrate

# 3. Seed inicial
npm run seed
```

### 2.3 Configuração de Email

#### Nodemailer com SMTP
```javascript
// config/email.js
import nodemailer from 'nodemailer';

export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  },
  from: process.env.EMAIL_FROM,
  templates: {
    welcome: 'templates/welcome.html',
    verification: 'templates/verification.html',
    reset: 'templates/password-reset.html'
  }
};
```

#### Integração com Serviços de Email
```javascript
// Para SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Para Mailgun
import mailgun from 'mailgun-js';
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

// Para Amazon SES
import AWS from 'aws-sdk';
const ses = new AWS.SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
```

### 2.4 Configuração de Redis

#### Setup Local
```bash
# Instalação no Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Instalação no macOS
brew install redis

# Iniciar serviço
sudo systemctl start redis-server
```

#### Configuração da Aplicação
```javascript
// config/redis.js
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Health check
redis.on('connect', () => {
  console.log('✅ Redis conectado');
});

redis.on('error', (err) => {
  console.error('❌ Erro no Redis:', err);
});
```

## 3. Padrões de Deploy e CI/CD

### 3.1 GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/myapp
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 restart myapp
```

### 3.2 Docker Deployment
```dockerfile
# Dockerfile.prod - Otimizado para produção
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build app
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### 3.3 Docker Compose para Produção
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: myapp:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
      - redis
    networks:
      - app-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(\`myapp.com\`)"
      - "traefik.http.routers.app.tls=true"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network

  traefik:
    image: traefik:v3.0
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./acme.json:/acme.json
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

## 4. Monitoramento e Observabilidade

### 4.1 Estrutura de Logs
```javascript
// lib/logger.js - Logger estruturado
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: process.env.SERVICE_NAME || 'auth-service',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    
    // Combined logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 10
    })
  ],
});

// Console logs in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger };
```

### 4.2 Métricas de Performance
```javascript
// lib/metrics.js - Coleta de métricas
import { performance } from 'perf_hooks';

class MetricsCollector {
  constructor() {
    this.metrics = new Map();
  }

  // Registrar tempo de operação
  recordTiming(operation, duration) {
    const key = `timing.${operation}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key).push({
      duration,
      timestamp: Date.now()
    });
  }

  // Registrar contador
  recordCounter(metric, value = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  // Middleware para medir tempo de requisições
  requestTiming() {
    return (req, res, next) => {
      const start = performance.now();
      
      res.on('finish', () => {
        const duration = performance.now() - start;
        this.recordTiming('http.request', duration);
        this.recordCounter(`http.status.${res.statusCode}`);
      });
      
      next();
    };
  }

  // Obter métricas para export
  getMetrics() {
    const result = {};
    
    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith('timing.')) {
        const timings = Array.isArray(value) ? value : [];
        const recent = timings.filter(t => Date.now() - t.timestamp < 60000); // Últimos 60s
        
        if (recent.length > 0) {
          result[key] = {
            count: recent.length,
            avg: recent.reduce((sum, t) => sum + t.duration, 0) / recent.length,
            min: Math.min(...recent.map(t => t.duration)),
            max: Math.max(...recent.map(t => t.duration))
          };
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}

export const metrics = new MetricsCollector();
```

### 4.3 Health Checks
```javascript
// routes/health.js - Endpoint de saúde
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { metrics } from '../lib/metrics.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    checks: {}
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = { status: 'ok' };
  } catch (error) {
    health.checks.database = { 
      status: 'error', 
      error: error.message 
    };
    health.status = 'error';
  }

  // Check Redis
  try {
    await redis.ping();
    health.checks.redis = { status: 'ok' };
  } catch (error) {
    health.checks.redis = { 
      status: 'error', 
      error: error.message 
    };
    health.status = 'error';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    status: memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'ok' : 'warning',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/metrics', (req, res) => {
  res.json(metrics.getMetrics());
});

export default router;
```

## 5. Segurança e Compliance

### 5.1 Checklist de Segurança
```markdown
## Checklist de Segurança

### Autenticação
- [ ] Senhas hasheadas com bcrypt (custo >= 12)
- [ ] Rate limiting implementado
- [ ] 2FA disponível (TOTP/SMS)
- [ ] Bloqueio de conta após tentativas falhadas
- [ ] Verificação de email obrigatória

### Autorização
- [ ] JWT com expiração curta (15min)
- [ ] Refresh tokens seguros
- [ ] Role-based access control (RBAC)
- [ ] Princípio do menor privilégio aplicado

### Dados
- [ ] Validação de entrada rigorosa
- [ ] Sanitização de dados
- [ ] Criptografia de dados sensíveis
- [ ] Backup automático e criptografado

### Transporte
- [ ] HTTPS obrigatório
- [ ] HSTS habilitado
- [ ] Certificate pinning (mobile)
- [ ] Secure cookies

### Headers de Segurança
- [ ] Content Security Policy (CSP)
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy

### Monitoramento
- [ ] Logs de segurança estruturados
- [ ] Detecção de anomalias
- [ ] Alertas de segurança
- [ ] Audit trail completo
```

### 5.2 Compliance LGPD/GDPR
```javascript
// lib/privacy.js - Utilitários para compliance
class PrivacyManager {
  constructor() {
    this.dataRetentionPeriods = {
      audit_logs: 5 * 365 * 24 * 60 * 60 * 1000, // 5 anos
      user_data: 2 * 365 * 24 * 60 * 60 * 1000,  // 2 anos após inatividade
      session_data: 30 * 24 * 60 * 60 * 1000      // 30 dias
    };
  }

  // Anonizar dados do usuário
  async anonymizeUser(userId) {
    const anonymizedData = {
      name: 'Usuário Removido',
      email: `deleted_${userId}@removed.local`,
      phone: null,
      avatar: null,
      deletedAt: new Date()
    };

    // Manter apenas dados necessários para auditoria
    await prisma.user.update({
      where: { id: userId },
      data: anonymizedData
    });

    // Log da ação
    await this.logDataAction(userId, 'ANONYMIZED', {
      reason: 'user_request',
      timestamp: new Date()
    });
  }

  // Exportar dados do usuário
  async exportUserData(userId) {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        sessions: {
          select: {
            createdAt: true,
            ipAddress: true,
            userAgent: true
          }
        },
        auditLogs: {
          select: {
            action: true,
            timestamp: true,
            metadata: true
          }
        }
      }
    });

    // Remover dados sensíveis
    delete userData.password;
    delete userData.twoFactorSecret;

    return {
      exportDate: new Date().toISOString(),
      userData,
      dataTypes: [
        'profile_information',
        'session_history',
        'audit_logs'
      ]
    };
  }

  // Verificar consentimento
  async checkConsent(userId, consentType) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { consents: true }
    });

    return user?.consents?.[consentType] || false;
  }

  // Registrar ação relacionada aos dados
  async logDataAction(userId, action, metadata = {}) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: `DATA_${action}`,
        metadata: {
          ...metadata,
          ip: metadata.ip || 'system',
          userAgent: metadata.userAgent || 'system'
        },
        timestamp: new Date()
      }
    });
  }

  // Cleanup automático de dados antigos
  async cleanupOldData() {
    const now = Date.now();

    // Remover sessões expiradas
    await prisma.session.deleteMany({
      where: {
        expires: { lt: new Date(now - this.dataRetentionPeriods.session_data) }
      }
    });

    // Remover logs antigos
    await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: new Date(now - this.dataRetentionPeriods.audit_logs) }
      }
    });

    console.log('Cleanup de dados antigos concluído');
  }
}

export const privacyManager = new PrivacyManager();
```

## 6. Manutenção e Atualizações

### 6.1 Rotinas de Manutenção
```javascript
// scripts/maintenance.js - Script de manutenção automática
import cron from 'node-cron';
import { prisma } from '../src/lib/prisma.js';
import { redis } from '../src/lib/redis.js';
import { privacyManager } from '../src/lib/privacy.js';
import { logger } from '../src/lib/logger.js';

class MaintenanceManager {
  constructor() {
    this.scheduleJobs();
  }

  scheduleJobs() {
    // Limpeza diária de sessões expiradas - 02:00
    cron.schedule('0 2 * * *', () => {
      this.cleanupExpiredSessions();
    });

    // Limpeza semanal de dados antigos - Domingo 03:00
    cron.schedule('0 3 * * 0', () => {
      this.weeklyCleanup();
    });

    // Backup diário - 01:00
    cron.schedule('0 1 * * *', () => {
      this.createBackup();
    });

    // Verificação de saúde a cada hora
    cron.schedule('0 * * * *', () => {
      this.healthCheck();
    });

    // Relatório semanal de segurança - Segunda 09:00
    cron.schedule('0 9 * * 1', () => {
      this.generateSecurityReport();
    });
  }

  async cleanupExpiredSessions() {
    try {
      logger.info('Iniciando limpeza de sessões expiradas');
      
      const result = await prisma.session.deleteMany({
        where: {
          expires: { lt: new Date() }
        }
      });

      logger.info(`Removidas ${result.count} sessões expiradas`);
    } catch (error) {
      logger.error('Erro na limpeza de sessões:', error);
    }
  }

  async weeklyCleanup() {
    try {
      logger.info('Iniciando limpeza semanal');
      
      // Limpeza de dados de privacidade
      await privacyManager.cleanupOldData();

      // Limpeza do Redis
      const keys = await redis.keys('temp:*');
      if (keys.length > 0) {
        await redis.del(keys);
        logger.info(`Removidas ${keys.length} chaves temporárias do Redis`);
      }

      // Otimização do banco
      await prisma.$executeRaw`ANALYZE`;
      
      logger.info('Limpeza semanal concluída');
    } catch (error) {
      logger.error('Erro na limpeza semanal:', error);
    }
  }

  async createBackup() {
    try {
      logger.info('Iniciando backup automático');
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const backupPath = `backups/backup_${timestamp}.sql`;

      // Comando de backup (ajustar conforme seu banco)
      const { exec } = await import('child_process');
      exec(`pg_dump ${process.env.DATABASE_URL} > ${backupPath}`, (error) => {
        if (error) {
          logger.error('Erro no backup:', error);
        } else {
          logger.info(`Backup criado: ${backupPath}`);
        }
      });
    } catch (error) {
      logger.error('Erro ao criar backup:', error);
    }
  }

  async healthCheck() {
    try {
      const health = {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        memory: this.checkMemory(),
        disk: await this.checkDisk()
      };

      const issues = Object.entries(health)
        .filter(([_, status]) => status.status !== 'ok')
        .map(([service, status]) => `${service}: ${status.message}`);

      if (issues.length > 0) {
        logger.warn(`Health check encontrou problemas: ${issues.join(', ')}`);
        // Enviar alertas aqui
      }
    } catch (error) {
      logger.error('Erro no health check:', error);
    }
  }

  async checkDatabase() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async checkRedis() {
    try {
      await redis.ping();
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  checkMemory() {
    const usage = process.memoryUsage();
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (heapPercent > 90) {
      return { status: 'critical', message: `Uso de memória: ${heapPercent.toFixed(1)}%` };
    } else if (heapPercent > 80) {
      return { status: 'warning', message: `Uso de memória: ${heapPercent.toFixed(1)}%` };
    }
    
    return { status: 'ok', message: `Uso de memória: ${heapPercent.toFixed(1)}%` };
  }

  async checkDisk() {
    try {
      const { exec } = await import('child_process');
      return new Promise((resolve) => {
        exec('df -h /', (error, stdout) => {
          if (error) {
            resolve({ status: 'error', message: 'Não foi possível verificar o disco' });
            return;
          }

          const lines = stdout.split('\n');
          const diskLine = lines[1];
          const usage = diskLine.split(/\s+/)[4].replace('%', '');
          const usagePercent = parseInt(usage);

          if (usagePercent > 90) {
            resolve({ status: 'critical', message: `Uso de disco: ${usagePercent}%` });
          } else if (usagePercent > 80) {
            resolve({ status: 'warning', message: `Uso de disco: ${usagePercent}%` });
          } else {
            resolve({ status: 'ok', message: `Uso de disco: ${usagePercent}%` });
          }
        });
      });
    } catch (error) {
      return { status: 'error', message: 'Erro ao verificar disco' };
    }
  }

  async generateSecurityReport() {
    try {
      logger.info('Gerando relatório de segurança semanal');
      
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Estatísticas de login
      const loginStats = await prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          timestamp: { gte: lastWeek },
          action: { in: ['USER_LOGIN', 'INVALID_LOGIN_ATTEMPT', 'ACCOUNT_LOCKED'] }
        },
        _count: true
      });

      // Tentativas de login suspeitas
      const suspiciousIPs = await prisma.auditLog.groupBy({
        by: ['ipAddress'],
        where: {
          timestamp: { gte: lastWeek },
          action: 'INVALID_LOGIN_ATTEMPT'
        },
        _count: true,
        having: {
          ipAddress: { _count: { gt: 20 } } // Mais de 20 tentativas falhadas
        }
      });

      const report = {
        period: { start: lastWeek, end: new Date() },
        loginStats,
        suspiciousIPs: suspiciousIPs.length,
        totalUsers: await prisma.user.count(),
        activeUsers: await prisma.user.count({
          where: { lastLoginAt: { gte: lastWeek } }
        })
      };

      logger.info('Relatório de segurança:', report);
      
      // Enviar relatório por email para admins
      // await emailService.sendSecurityReport(report);
      
    } catch (error) {
      logger.error('Erro ao gerar relatório de segurança:', error);
    }
  }
}

// Inicializar apenas em produção
if (process.env.NODE_ENV === 'production') {
  new MaintenanceManager();
  logger.info('Gerenciador de manutenção iniciado');
}
```

### 6.2 Processo de Atualização
```bash
#!/bin/bash
# scripts/update.sh - Script de atualização segura

set -e

echo "🔄 Iniciando processo de atualização..."

# 1. Backup antes da atualização
echo "💾 Criando backup de segurança..."
npm run backup:create

# 2. Verificar dependências
echo "📋 Verificando dependências..."
npm audit --audit-level moderate

# 3. Executar testes
echo "🧪 Executando testes..."
npm run test:all

# 4. Build da aplicação
echo "🏗️ Construindo aplicação..."
npm run build

# 5. Atualizar banco de dados
echo "🗄️ Aplicando migrações do banco..."
npm run migrate:deploy

# 6. Verificar saúde antes do deploy
echo "🏥 Verificando saúde da aplicação..."
if ! npm run health:check; then
    echo "❌ Aplicação não está saudável, abortando atualização"
    exit 1
fi

# 7. Deploy com zero downtime
echo "🚀 Fazendo deploy com zero downtime..."
npm run deploy:zero-downtime

# 8. Verificar saúde após deploy
echo "✅ Verificando saúde após deploy..."
sleep 30
if npm run health:check:production; then
    echo "🎉 Atualização concluída com sucesso!"
else
    echo "❌ Deploy falhou, iniciando rollback..."
    npm run rollback
    exit 1
fi

echo "📊 Gerando relatório de atualização..."
npm run report:update
```

Com essas diretrizes, você terá um sistema de autenticação robusto, fácil de implementar, implantar e manter, seguindo as melhores práticas de mercado e garantindo segurança, escalabilidade e facilidade de uso.