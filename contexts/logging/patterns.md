# Padrões de Logging e Rastreabilidade

## Configuração de Logging

### 1. Winston Logger (Node.js)
```javascript
// lib/logger.js
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'app',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : logFormat,
    }),
    
    // File transport para erros
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // File transport para todos os logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Stream para Morgan (Express)
export const logStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};
```

### 2. Console Logger (Frontend)
```javascript
// lib/logger.js (Frontend)
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || 'info';
  }

  formatMessage(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...meta,
    };
  }

  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    return levels[level] <= levels[this.logLevel];
  }

  error(message, meta = {}) {
    if (!this.shouldLog('error')) return;
    
    const logData = this.formatMessage('error', message, meta);
    console.error('🔴 ERROR:', logData);
    
    // Enviar erro para serviço de monitoramento
    this.sendToMonitoring('error', logData);
  }

  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) return;
    
    const logData = this.formatMessage('warn', message, meta);
    console.warn('🟡 WARN:', logData);
  }

  info(message, meta = {}) {
    if (!this.shouldLog('info')) return;
    
    const logData = this.formatMessage('info', message, meta);
    console.info('🔵 INFO:', logData);
  }

  debug(message, meta = {}) {
    if (!this.shouldLog('debug') || !this.isDevelopment) return;
    
    const logData = this.formatMessage('debug', message, meta);
    console.debug('⚪ DEBUG:', logData);
  }

  async sendToMonitoring(level, data) {
    if (level !== 'error' || !process.env.NEXT_PUBLIC_MONITORING_ENDPOINT) return;

    try {
      await fetch('/api/monitoring/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send log to monitoring:', error);
    }
  }
}

export const logger = new Logger();
```

## Middleware de Logging

### 1. Express Request Logging
```javascript
// middleware/requestLogger.js
import morgan from 'morgan';
import { logger, logStream } from '../lib/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Middleware para adicionar request ID
export const addRequestId = (req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Middleware para adicionar contexto ao logger
export const addLogContext = (req, res, next) => {
  req.logger = logger.child({
    requestId: req.id,
    userId: req.user?.id,
    userEmail: req.user?.email,
  });
  next();
};

// Morgan configuration
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

export const requestLogger = morgan(morganFormat, { stream: logStream });

// Middleware customizado para logs detalhados
export const detailedRequestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log da requisição
  req.logger.info('Request started', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    ip: req.ip,
  });

  // Interceptar resposta
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    req.logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: Buffer.byteLength(body, 'utf8'),
    });

    return originalSend.call(this, body);
  };

  next();
};
```

### 2. NextJS API Route Logging
```javascript
// lib/apiLogger.js
import { logger } from './logger';

export const withLogging = (handler) => {
  return async (req, res) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    
    // Adicionar request ID ao response
    res.setHeader('X-Request-ID', requestId);

    // Criar logger contextual
    const contextLogger = {
      info: (message, meta = {}) => logger.info(message, { requestId, ...meta }),
      error: (message, meta = {}) => logger.error(message, { requestId, ...meta }),
      warn: (message, meta = {}) => logger.warn(message, { requestId, ...meta }),
      debug: (message, meta = {}) => logger.debug(message, { requestId, ...meta }),
    };

    // Log da requisição
    contextLogger.info('API Request started', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    });

    try {
      // Executar handler original
      const result = await handler(req, res);
      
      const duration = Date.now() - startTime;
      contextLogger.info('API Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      contextLogger.error('API Request failed', {
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
      });
      
      throw error;
    }
  };
};
```

## Error Tracking

### 1. Error Handler com Logging
```javascript
// middleware/errorHandler.js
import { logger } from '../lib/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log do erro
  req.logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    user: req.user?.id,
  });

  // Resposta baseada no tipo de erro
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details,
      requestId: req.id,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      requestId: req.id,
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      requestId: req.id,
    });
  }

  // Erro interno do servidor
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

### 2. React Error Boundary
```javascript
// components/ErrorBoundary.jsx
import { Component } from 'react';
import { logger } from '../lib/logger';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props,
    });

    // Enviar erro para serviço de monitoramento
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">
              Oops! Algo deu errado
            </h1>
            <p className="text-gray-600 mt-2">
              Ocorreu um erro inesperado. Nossa equipe foi notificada.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Monitoramento de Performance

### 1. Performance Logger
```javascript
// utils/performanceLogger.js
import { logger } from '../lib/logger';

export class PerformanceMonitor {
  constructor() {
    this.timers = new Map();
  }

  startTimer(name) {
    this.timers.set(name, performance.now());
  }

  endTimer(name, meta = {}) {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn('Timer not found', { timerName: name });
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    logger.info('Performance measurement', {
      operation: name,
      duration: `${duration.toFixed(2)}ms`,
      ...meta,
    });

    return duration;
  }

  measureAsync(name, asyncFn) {
    return async (...args) => {
      this.startTimer(name);
      try {
        const result = await asyncFn(...args);
        this.endTimer(name, { success: true });
        return result;
      } catch (error) {
        this.endTimer(name, { success: false, error: error.message });
        throw error;
      }
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook para monitoramento no React
export const usePerformanceMonitor = () => {
  const measure = (name, fn) => {
    return performanceMonitor.measureAsync(name, fn);
  };

  const timer = {
    start: (name) => performanceMonitor.startTimer(name),
    end: (name, meta) => performanceMonitor.endTimer(name, meta),
  };

  return { measure, timer };
};
```

### 2. Database Query Logging
```javascript
// lib/prisma.js (com logging)
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Event listeners para logs
prisma.$on('query', (e) => {
  logger.debug('Database Query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
    target: e.target,
  });
});

prisma.$on('error', (e) => {
  logger.error('Database Error', {
    message: e.message,
    target: e.target,
  });
});

prisma.$on('info', (e) => {
  logger.info('Database Info', {
    message: e.message,
    target: e.target,
  });
});

prisma.$on('warn', (e) => {
  logger.warn('Database Warning', {
    message: e.message,
    target: e.target,
  });
});

export { prisma };
```

## Audit Trail

### 1. Audit Logging
```javascript
// services/auditService.js
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

export class AuditService {
  static async log(action, resource, userId, details = {}) {
    const auditLog = {
      action,
      resource,
      userId,
      timestamp: new Date(),
      details,
    };

    // Log para arquivo
    logger.info('Audit Log', auditLog);

    // Salvar no banco de dados
    try {
      await prisma.auditLog.create({
        data: auditLog,
      });
    } catch (error) {
      logger.error('Failed to save audit log to database', {
        auditLog,
        error: error.message,
      });
    }
  }

  static async logUserAction(action, userId, details = {}) {
    await this.log(action, 'user', userId, details);
  }

  static async logSystemAction(action, details = {}) {
    await this.log(action, 'system', null, details);
  }
}

// Middleware para audit trail automático
export const auditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Log apenas em caso de sucesso
      if (res.statusCode < 400) {
        AuditService.logUserAction(action, req.user?.id, {
          method: req.method,
          url: req.url,
          body: req.body,
          query: req.query,
          statusCode: res.statusCode,
        }).catch(error => {
          logger.error('Audit logging failed', { error: error.message });
        });
      }
      
      return originalSend.call(this, body);
    };

    next();
  };
};
```

### 2. Schema de Audit Log
```prisma
// prisma/schema.prisma
model AuditLog {
  id        String   @id @default(cuid())
  action    String   // CREATE, UPDATE, DELETE, etc.
  resource  String   // user, post, etc.
  userId    String?  // ID do usuário que executou a ação
  timestamp DateTime @default(now())
  details   Json?    // Detalhes adicionais da ação
  
  user User? @relation(fields: [userId], references: [id])
  
  @@map("audit_logs")
}
```

## Structured Logging

### 1. Log Contexts
```javascript
// lib/logContext.js
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

export const withLogContext = (context, fn) => {
  const existingContext = asyncLocalStorage.getStore() || {};
  const newContext = { ...existingContext, ...context };
  return asyncLocalStorage.run(newContext, fn);
};

export const getLogContext = () => {
  return asyncLocalStorage.getStore() || {};
};

// Logger contextual
export const createContextLogger = (baseLogger) => {
  return {
    info: (message, meta = {}) => {
      const context = getLogContext();
      baseLogger.info(message, { ...context, ...meta });
    },
    error: (message, meta = {}) => {
      const context = getLogContext();
      baseLogger.error(message, { ...context, ...meta });
    },
    warn: (message, meta = {}) => {
      const context = getLogContext();
      baseLogger.warn(message, { ...context, ...meta });
    },
    debug: (message, meta = {}) => {
      const context = getLogContext();
      baseLogger.debug(message, { ...context, ...meta });
    },
  };
};
```

### 2. Correlation IDs
```javascript
// middleware/correlationId.js
import { v4 as uuidv4 } from 'uuid';
import { withLogContext } from '../lib/logContext';

export const correlationIdMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  res.setHeader('X-Correlation-ID', correlationId);
  
  withLogContext({ correlationId }, () => {
    next();
  });
};
```

## Configuração de Monitoramento

### 1. Health Check Endpoint
```javascript
// routes/health.js
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

export const healthCheck = async (req, res) => {
  const startTime = Date.now();
  const checks = {};

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', responseTime: Date.now() - startTime };
  } catch (error) {
    checks.database = { status: 'error', error: error.message };
  }

  // Memory check
  const memoryUsage = process.memoryUsage();
  checks.memory = {
    status: 'ok',
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
  };

  const overallStatus = Object.values(checks).every(check => check.status === 'ok') ? 'ok' : 'error';

  if (overallStatus === 'error') {
    logger.error('Health check failed', { checks });
  }

  res.status(overallStatus === 'ok' ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  });
};
```

### 2. Métricas Customizadas
```javascript
// lib/metrics.js
class Metrics {
  constructor() {
    this.counters = new Map();
    this.histograms = new Map();
  }

  incrementCounter(name, labels = {}) {
    const key = `${name}:${JSON.stringify(labels)}`;
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    
    logger.debug('Counter incremented', { metric: name, labels, value: current + 1 });
  }

  recordHistogram(name, value, labels = {}) {
    const key = `${name}:${JSON.stringify(labels)}`;
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    
    logger.debug('Histogram recorded', { metric: name, labels, value });
  }

  getMetrics() {
    const counters = Object.fromEntries(this.counters);
    const histograms = Object.fromEntries(
      Array.from(this.histograms.entries()).map(([key, values]) => [
        key,
        {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        },
      ])
    );

    return { counters, histograms };
  }
}

export const metrics = new Metrics();
```