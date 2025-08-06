# Padrões de API Server

## Estrutura de Controllers

### 1. Base Controller
```javascript
// controllers/BaseController.js
export class BaseController {
  constructor() {
    this.handleAsync = this.handleAsync.bind(this);
  }

  // Wrapper para async/await com tratamento de erro
  handleAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Resposta de sucesso padronizada
  sendSuccess(res, data, message = 'Success', statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: res.getHeaders()['x-request-id'],
    });
  }

  // Resposta de erro padronizada
  sendError(res, message, statusCode = 400, details = null) {
    res.status(statusCode).json({
      success: false,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: res.getHeaders()['x-request-id'],
    });
  }

  // Resposta paginada
  sendPaginated(res, data, pagination, message = 'Success') {
    res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(pagination.page),
        limit: parseInt(pagination.limit),
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page * pagination.limit < pagination.total,
        hasPrev: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
      requestId: res.getHeaders()['x-request-id'],
    });
  }
}
```

### 2. CRUD Controller
```javascript
// controllers/CrudController.js
import { BaseController } from './BaseController.js';

export class CrudController extends BaseController {
  constructor(service) {
    super();
    this.service = service;
  }

  // GET /resource
  getAll = this.handleAsync(async (req, res) => {
    const { page = 1, limit = 10, ...filters } = req.query;
    
    const result = await this.service.findMany({
      filters,
      pagination: { page: parseInt(page), limit: parseInt(limit) },
    });

    this.sendPaginated(res, result.data, {
      page,
      limit,
      total: result.total,
    });
  });

  // GET /resource/:id
  getById = this.handleAsync(async (req, res) => {
    const { id } = req.params;
    
    const result = await this.service.findById(id);
    
    if (!result) {
      return this.sendError(res, 'Recurso não encontrado', 404);
    }

    this.sendSuccess(res, result);
  });

  // POST /resource
  create = this.handleAsync(async (req, res) => {
    const data = req.body;
    
    const result = await this.service.create({
      ...data,
      createdBy: req.user?.id,
    });

    this.sendSuccess(res, result, 'Recurso criado com sucesso', 201);
  });

  // PUT /resource/:id
  update = this.handleAsync(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const exists = await this.service.findById(id);
    if (!exists) {
      return this.sendError(res, 'Recurso não encontrado', 404);
    }

    const result = await this.service.update(id, {
      ...data,
      updatedBy: req.user?.id,
    });

    this.sendSuccess(res, result, 'Recurso atualizado com sucesso');
  });

  // DELETE /resource/:id
  delete = this.handleAsync(async (req, res) => {
    const { id } = req.params;

    const exists = await this.service.findById(id);
    if (!exists) {
      return this.sendError(res, 'Recurso não encontrado', 404);
    }

    await this.service.delete(id);

    this.sendSuccess(res, null, 'Recurso removido com sucesso', 204);
  });
}
```

### 3. User Controller Específico
```javascript
// controllers/userController.js
import { CrudController } from './CrudController.js';
import { UserService } from '../services/UserService.js';

class UserController extends CrudController {
  constructor() {
    super(new UserService());
  }

  // Override create para hash de senha
  create = this.handleAsync(async (req, res) => {
    const { password, ...userData } = req.body;
    
    if (!password || password.length < 8) {
      return this.sendError(res, 'Senha deve ter pelo menos 8 caracteres');
    }

    const result = await this.service.createUser({
      ...userData,
      password,
      createdBy: req.user?.id,
    });

    // Remove senha da resposta
    const { password: _, ...userResponse } = result;
    
    this.sendSuccess(res, userResponse, 'Usuário criado com sucesso', 201);
  });

  // Endpoint específico para alterar senha
  changePassword = this.handleAsync(async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Verificar se é o próprio usuário ou admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return this.sendError(res, 'Acesso negado', 403);
    }

    const result = await this.service.changePassword(id, {
      currentPassword,
      newPassword,
    });

    if (!result.success) {
      return this.sendError(res, result.message, 400);
    }

    this.sendSuccess(res, null, 'Senha alterada com sucesso');
  });

  // Endpoint para busca de usuários
  search = this.handleAsync(async (req, res) => {
    const { q, ...filters } = req.query;
    
    if (!q || q.length < 2) {
      return this.sendError(res, 'Query deve ter pelo menos 2 caracteres');
    }

    const result = await this.service.searchUsers(q, filters);
    
    this.sendSuccess(res, result, 'Busca realizada com sucesso');
  });
}

export default new UserController();
```

## Validação de Dados

### 1. Middleware de Validação
```javascript
// middleware/validation.js
import Joi from 'joi';

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        details,
      });
    }

    req[property] = value;
    next();
  };
};

// Função helper para validar params
export const validateParams = (schema) => validate(schema, 'params');
export const validateQuery = (schema) => validate(schema, 'query');
export const validateBody = (schema) => validate(schema, 'body');
```

### 2. Schemas de Validação
```javascript
// validators/userSchemas.js
import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('user', 'admin').default('user'),
  isActive: Joi.boolean().default(true),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  role: Joi.string().valid('user', 'admin'),
  isActive: Joi.boolean(),
}).min(1); // Pelo menos um campo deve ser fornecido

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const searchSchema = Joi.object({
  q: Joi.string().min(2).required(),
  role: Joi.string().valid('user', 'admin'),
  isActive: Joi.boolean(),
}).concat(paginationSchema);
```

## Middleware de Autenticação e Autorização

### 1. Auth Middleware
```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService.js';

const userService = new UserService();

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userService.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuário inativo',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado',
      });
    }

    next();
  };
};

// Middleware para verificar se é o próprio usuário ou admin
export const authorizeOwnerOrAdmin = (req, res, next) => {
  const { id } = req.params;
  
  if (req.user.id === id || req.user.role === 'admin') {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Acesso negado',
  });
};
```

### 2. Rate Limiting
```javascript
// middleware/rateLimit.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Rate limit geral
export const generalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para login
export const loginLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
});

// Rate limit para APIs sensíveis
export const strictLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por minuto
  message: {
    success: false,
    message: 'Rate limit excedido. Aguarde 1 minuto.',
  },
});
```

## Upload de Arquivos

### 1. Middleware de Upload
```javascript
// middleware/upload.js
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || 'general';
    const uploadPath = path.join('uploads', folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const filename = `${uuidv4()}${extension}`;
    cb(null, filename);
  },
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'application/pdf': true,
    'text/plain': true,
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'), false);
  }
};

// Configuração do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10, // máximo 10 arquivos
  },
});

// Middleware para upload único
export const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Arquivo muito grande. Máximo 5MB.',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Campo de arquivo inválido.',
          });
        }
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

// Middleware para upload múltiplo
export const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Arquivo muito grande. Máximo 5MB por arquivo.',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Máximo ${maxCount} arquivos permitidos.`,
          });
        }
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};
```

### 2. Upload Controller
```javascript
// controllers/uploadController.js
import { BaseController } from './BaseController.js';
import { UploadService } from '../services/UploadService.js';

class UploadController extends BaseController {
  constructor() {
    super();
    this.uploadService = new UploadService();
  }

  // Upload único
  uploadSingle = this.handleAsync(async (req, res) => {
    if (!req.file) {
      return this.sendError(res, 'Nenhum arquivo foi enviado');
    }

    const result = await this.uploadService.processFile({
      ...req.file,
      uploadedBy: req.user.id,
    });

    this.sendSuccess(res, result, 'Arquivo enviado com sucesso');
  });

  // Upload múltiplo
  uploadMultiple = this.handleAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return this.sendError(res, 'Nenhum arquivo foi enviado');
    }

    const results = await Promise.all(
      req.files.map(file => 
        this.uploadService.processFile({
          ...file,
          uploadedBy: req.user.id,
        })
      )
    );

    this.sendSuccess(res, results, 'Arquivos enviados com sucesso');
  });
}

export default new UploadController();
```

## Rotas e Middleware Stack

### 1. Route Configuration
```javascript
// routes/userRoutes.js
import express from 'express';
import userController from '../controllers/userController.js';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  idParamSchema,
  searchSchema,
} from '../validators/userSchemas.js';
import { loginLimiter, strictLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Rotas públicas (com rate limit)
router.post(
  '/',
  loginLimiter,
  validateBody(createUserSchema),
  userController.create
);

// Rotas autenticadas
router.use(authenticate);

// Buscar usuários (apenas usuários autenticados)
router.get(
  '/search',
  validateQuery(searchSchema),
  userController.search
);

// CRUD básico
router.get('/', userController.getAll);

router.get(
  '/:id',
  validateParams(idParamSchema),
  userController.getById
);

// Atualizar usuário (próprio usuário ou admin)
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateUserSchema),
  authorizeOwnerOrAdmin,
  userController.update
);

// Alterar senha (próprio usuário ou admin)
router.put(
  '/:id/password',
  strictLimiter,
  validateParams(idParamSchema),
  validateBody(changePasswordSchema),
  authorizeOwnerOrAdmin,
  userController.changePassword
);

// Deletar usuário (apenas admin)
router.delete(
  '/:id',
  validateParams(idParamSchema),
  authorize('admin'),
  userController.delete
);

export default router;
```

### 2. Main App Configuration
```javascript
// app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger, addRequestId, addLogContext } from './middleware/requestLogger.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(compression());

// Rate limiting
app.use('/api', generalLimiter);

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(addRequestId);
app.use(requestLogger);
app.use(addLogContext);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
  });
});

// Error handler (deve ser o último)
app.use(errorHandler);

export default app;
```