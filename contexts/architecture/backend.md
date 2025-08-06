# Padrões de Arquitetura Backend

## Estrutura de Projeto Node.js + Express

```
src/
├── controllers/          # Controladores (handlers de rota)
├── services/             # Lógica de negócio
├── models/              # Modelos de dados
├── routes/              # Definição de rotas
├── middleware/          # Middlewares customizados
├── utils/               # Funções utilitárias
├── config/              # Configurações
│   ├── database.js      # Configuração de BD
│   ├── auth.js          # Configuração de auth
│   └── env.js           # Variáveis de ambiente
├── validators/          # Validação de entrada
├── types/               # Definições TypeScript
├── app.js               # Configuração da aplicação
└── server.js            # Entry point
```

## Arquitetura em Camadas

### 1. Controladores (Controllers)
```javascript
// controllers/userController.js
class UserController {
  static async getUsers(req, res, next) {
    try {
      const users = await UserService.getAllUsers();
      res.json({ data: users });
    } catch (error) {
      next(error);
    }
  }
  
  static async createUser(req, res, next) {
    try {
      const userData = req.body;
      const user = await UserService.createUser(userData);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
```

### 2. Serviços (Services)
```javascript
// services/userService.js
class UserService {
  static async getAllUsers() {
    return await User.find().select('-password');
  }
  
  static async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = new User({
      ...userData,
      password: hashedPassword,
    });
    
    await user.save();
    return user.toJSON();
  }
  
  static async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }
    return user;
  }
}

export default UserService;
```

### 3. Modelos (Models)
```javascript
// models/User.js (Mongoose)
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
}, {
  timestamps: true,
});

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);
```

### 4. Rotas (Routes)
```javascript
// routes/userRoutes.js
import express from 'express';
import UserController from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateUser } from '../validators/userValidator.js';

const router = express.Router();

router.get('/', authenticate, UserController.getUsers);
router.post('/', validateUser, UserController.createUser);
router.get('/:id', authenticate, UserController.getUserById);
router.put('/:id', authenticate, validateUser, UserController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), UserController.deleteUser);

export default router;
```

## Middleware Padrões

### 1. Middleware de Autenticação
```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};
```

### 2. Middleware de Validação
```javascript
// validators/userValidator.js
import { body, validationResult } from 'express-validator';

export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
      });
    }
    next();
  },
];
```

### 3. Middleware de Tratamento de Erros
```javascript
// middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Recurso não encontrado';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Recurso duplicado';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor',
  });
};

export { AppError };
```

## Configuração de Banco de Dados

### Mongoose (MongoDB)
```javascript
// config/database.js
import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erro de conexão MongoDB:', error);
    process.exit(1);
  }
};
```

### Prisma (PostgreSQL/MySQL)
```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

## API Response Patterns

### 1. Resposta Padrão
```javascript
// utils/response.js
export const sendResponse = (res, statusCode, data, message = null) => {
  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
  });
};

export const sendError = (res, statusCode, message, details = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    details,
  });
};
```

### 2. Paginação
```javascript
// utils/pagination.js
export const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  return query
    .skip(skip)
    .limit(limit);
};

export const getPaginationMeta = (total, page, limit) => {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
};
```

## Configuração da Aplicação

```javascript
// app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
});
app.use('/api', limiter);

// Rotas
app.use('/api/users', userRoutes);

// Middleware de erro (deve ser o último)
app.use(errorHandler);

export default app;
```

## Server Entry Point

```javascript
// server.js
import app from './app.js';
import { connectDatabase } from './config/database.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
```