# Padrões de Autenticação NextJS

## NextAuth.js Configuration

### 1. Configuração Base
```javascript
// lib/auth.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
};

export default NextAuth(authConfig);
```

### 2. API Route Handler (App Router)
```javascript
// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
```

### 3. Middleware de Proteção
```javascript
// middleware.js
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Lógica adicional se necessário
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Rotas públicas
        if (pathname.startsWith('/auth')) {
          return true;
        }
        
        // Rotas protegidas
        if (pathname.startsWith('/admin')) {
          return token?.role === 'admin';
        }
        
        if (pathname.startsWith('/dashboard')) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/protected/:path*'],
};
```

## Componentes de Autenticação

### 1. Provider de Sessão
```javascript
// components/auth/SessionProvider.jsx
'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export default function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
```

### 2. Hook de Autenticação
```javascript
// hooks/useAuth.js
import { useSession, signIn, signOut } from 'next-auth/react';

export const useAuth = () => {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isAdmin: session?.user?.role === 'admin',
    signIn,
    signOut,
  };
};
```

### 3. Componente de Proteção de Rota
```javascript
// components/auth/ProtectedRoute.jsx
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  redirectTo = '/auth/signin' 
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router, requiredRole, redirectTo]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
```

### 4. Formulário de Login
```javascript
// components/auth/LoginForm.jsx
'use client';
import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TextInput from '../forms/TextInput';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

const LoginForm = ({ callbackUrl = '/dashboard' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        addToast({
          type: 'error',
          title: 'Erro de Login',
          message: 'Email ou senha incorretos',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Login realizado',
          message: 'Redirecionando...',
        });
        
        // Atualizar sessão e redirecionar
        await getSession();
        router.push(callbackUrl);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Ocorreu um erro inesperado',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        name="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <TextInput
        name="password"
        label="Senha"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <Button
        type="submit"
        loading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        Entrar
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full"
      >
        Continuar com Google
      </Button>
    </form>
  );
};

export default LoginForm;
```

### 5. Formulário de Registro
```javascript
// components/auth/RegisterForm.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '../../hooks/useForm';
import TextInput from '../forms/TextInput';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

const registerValidationSchema = {
  name: {
    required: 'Nome é obrigatório',
    minLength: 2,
    minLengthMessage: 'Nome deve ter pelo menos 2 caracteres',
  },
  email: {
    required: 'Email é obrigatório',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Email inválido',
  },
  password: {
    required: 'Senha é obrigatória',
    minLength: 8,
    minLengthMessage: 'Senha deve ter pelo menos 8 caracteres',
  },
  confirmPassword: {
    required: 'Confirmação de senha é obrigatória',
  },
};

const RegisterForm = () => {
  const router = useRouter();
  const { addToast } = useToast();

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    registerValidationSchema
  );

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Senhas não conferem',
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Conta criada',
          message: 'Você pode fazer login agora',
        });
        router.push('/auth/signin');
      } else {
        const errorData = await response.json();
        addToast({
          type: 'error',
          title: 'Erro',
          message: errorData.message || 'Erro ao criar conta',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Ocorreu um erro inesperado',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TextInput
        name="name"
        label="Nome"
        value={values.name}
        error={errors.name}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      />

      <TextInput
        name="email"
        label="Email"
        type="email"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      />

      <TextInput
        name="password"
        label="Senha"
        type="password"
        value={values.password}
        error={errors.password}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      />

      <TextInput
        name="confirmPassword"
        label="Confirmar Senha"
        type="password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      />

      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full"
      >
        Criar Conta
      </Button>
    </form>
  );
};

export default RegisterForm;
```

## API Routes de Autenticação

### 1. Registro de Usuário
```javascript
// app/api/auth/register/route.js
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validação
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Usuário já existe' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### 2. Middleware de Autenticação para APIs
```javascript
// lib/authMiddleware.js
import { getServerSession } from 'next-auth/next';
import { authConfig } from './auth';
import { NextResponse } from 'next/server';

export const withAuth = (handler, options = {}) => {
  return async (request, context) => {
    const session = await getServerSession(authConfig);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (options.requiredRole && session.user.role !== options.requiredRole) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Adicionar usuário ao request
    request.user = session.user;
    
    return handler(request, context);
  };
};

// Exemplo de uso:
// export const GET = withAuth(async (request) => {
//   // Handler protegido
// });
```

## Configuração do Prisma Schema

```prisma
// prisma/schema.prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          String    @default("user")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```