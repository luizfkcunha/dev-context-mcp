# Padrões de Arquitetura Frontend

## Estrutura de Projeto NextJS

```
src/
├── app/                    # App Router (NextJS 13+)
│   ├── (auth)/            # Grupo de rotas de autenticação
│   ├── api/               # API routes
│   ├── globals.css        # Estilos globais
│   ├── layout.js          # Layout raiz
│   └── page.js            # Página inicial
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de UI básicos
│   ├── forms/            # Componentes de formulário
│   └── layout/           # Componentes de layout
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
│   ├── auth.js           # Configuração de autenticação
│   ├── db.js             # Configuração de banco
│   └── utils.js          # Funções utilitárias
├── stores/               # Gerenciamento de estado
└── types/                # Definições TypeScript
```

## Estrutura de Projeto Vite + React

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes básicos
│   ├── forms/           # Componentes de formulário
│   └── layout/          # Componentes de layout
├── pages/               # Páginas/Views
├── hooks/               # Custom hooks
├── services/            # Serviços de API
├── stores/              # Gerenciamento de estado
├── utils/               # Funções utilitárias
├── types/               # Definições TypeScript
├── App.jsx              # Componente principal
└── main.jsx             # Entry point
```

## Princípios de Arquitetura

### 1. Separação de Responsabilidades
- **Componentes**: Apenas renderização e interação
- **Hooks**: Lógica de negócio e estado
- **Services**: Comunicação externa (APIs)
- **Utils**: Funções puras e helpers

### 2. Composição de Componentes
```javascript
// ✅ Bom - Composição
const UserCard = ({ user, actions }) => (
  <Card>
    <UserInfo user={user} />
    <UserActions actions={actions} />
  </Card>
);

// ❌ Evitar - Componente monolítico
const UserCard = ({ user }) => {
  // Muita lógica aqui...
};
```

### 3. Custom Hooks para Lógica
```javascript
// ✅ Custom hook para lógica de negócio
const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading };
};
```

## Padrões de Roteamento

### NextJS App Router
```javascript
// app/dashboard/page.js
export default function DashboardPage() {
  return <Dashboard />;
}

// app/dashboard/layout.js
export default function DashboardLayout({ children }) {
  return (
    <div>
      <DashboardNav />
      {children}
    </div>
  );
}
```

### React Router (Vite)
```javascript
// Router.jsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
    ],
  },
]);
```

## Gerenciamento de Estado

### 1. Estado Local - useState/useReducer
```javascript
const useFormState = (initialState) => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  
  const updateField = (name, value) => {
    dispatch({ type: 'UPDATE_FIELD', name, value });
  };
  
  return { state, updateField };
};
```

### 2. Estado Global - Context + Reducer
```javascript
// contexts/AppContext.js
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
```

### 3. Server State - SWR/React Query
```javascript
// hooks/useUsers.js
import useSWR from 'swr';

export const useUsers = () => {
  const { data, error, isLoading } = useSWR('/api/users', fetcher);
  
  return {
    users: data,
    isLoading,
    isError: error,
  };
};
```

## Padrões de Performance

### 1. Code Splitting
```javascript
// Lazy loading de componentes
const LazyDashboard = lazy(() => import('./Dashboard'));

// Lazy loading de rotas
const DashboardPage = lazy(() => import('../pages/Dashboard'));
```

### 2. Memoização
```javascript
// Componentes
const ExpensiveComponent = memo(({ data }) => {
  // Renderização pesada
});

// Valores calculados
const useMemoizedValue = (data) => {
  return useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
};
```

### 3. Otimização de Bundle
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-button'],
        },
      },
    },
  },
};
```