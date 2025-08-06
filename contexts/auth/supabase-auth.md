# Padrões de Autenticação Supabase

## Configuração Base

### 1. Cliente Supabase
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. Cliente para Server Components
```javascript
// lib/supabase-server.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};
```

### 3. Cliente para Client Components
```javascript
// lib/supabase-client.js
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
```

### 4. Middleware
```javascript
// middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Rotas protegidas
  const protectedRoutes = ['/dashboard', '/profile'];
  const adminRoutes = ['/admin'];

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Redirecionar usuários autenticados da página de login
  if (pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## Hooks de Autenticação

### 1. Hook Principal de Autenticação
```javascript
// hooks/useAuth.js
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '../lib/supabase-client';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Obter sessão inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Redirecionar baseado no evento
        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        }
        if (event === 'SIGNED_OUT') {
          router.push('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  const signUp = async ({ email, password, ...metadata }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithProvider = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  };

  const updatePassword = async (password) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.user_metadata?.role === 'admin',
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro do AuthProvider');
  }
  return context;
};
```

### 2. Hook para Dados do Usuário
```javascript
// hooks/useUser.js
import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase-client';
import { useAuth } from './useAuth';

export const useUser = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase]);

  const updateProfile = async (updates) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
  };
};
```

## Componentes de Autenticação

### 1. Formulário de Login
```javascript
// components/auth/LoginForm.jsx
'use client';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TextInput from '../forms/TextInput';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithProvider } = useAuth();
  const { addToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData);
      
      if (error) {
        addToast({
          type: 'error',
          title: 'Erro de Login',
          message: error.message,
        });
      } else {
        addToast({
          type: 'success',
          title: 'Login realizado',
          message: 'Bem-vindo!',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Ocorreu um erro inesperado',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithProvider('google');
      
      if (error) {
        addToast({
          type: 'error',
          title: 'Erro',
          message: error.message,
        });
      }
    } catch (error) {
      console.error('Erro no login com Google:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto">
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
          loading={loading}
          disabled={loading}
          className="w-full"
        >
          Entrar
        </Button>
      </form>

      <div className="mt-6">
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
          onClick={handleGoogleLogin}
          className="w-full mt-4"
        >
          Continuar com Google
        </Button>
      </div>
    </div>
  );
};

export default LoginForm;
```

### 2. Formulário de Registro
```javascript
// components/auth/RegisterForm.jsx
'use client';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
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
};

const RegisterForm = () => {
  const { signUp } = useAuth();
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
    },
    registerValidationSchema
  );

  const onSubmit = async (data) => {
    try {
      const { error } = await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (error) {
        addToast({
          type: 'error',
          title: 'Erro no Registro',
          message: error.message,
        });
      } else {
        addToast({
          type: 'success',
          title: 'Conta criada',
          message: 'Verifique seu email para confirmar a conta',
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
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

### 3. Componente de Proteção
```javascript
// components/auth/ProtectedRoute.jsx
'use client';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  fallback = null 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback;
  }

  if (requiredRole && user?.user_metadata?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
          <p className="text-gray-600 mt-2">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
```

## Configuração RLS (Row Level Security)

### 1. Tabela de Profiles
```sql
-- Criar tabela de profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Função para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Políticas Avançadas
```sql
-- Policy baseada em role
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy para dados próprios do usuário
CREATE POLICY "Users can manage own data" ON user_data
  FOR ALL USING (auth.uid() = user_id);
```

## Callback de Autenticação

```javascript
// app/auth/callback/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Retornar para erro se algo deu errado
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```