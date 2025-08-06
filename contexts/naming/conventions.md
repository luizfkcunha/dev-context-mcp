# Convenções de Nomenclatura

## Arquivos e Diretórios

### 1. Estrutura de Diretórios
```
src/
├── components/           # PascalCase para componentes
│   ├── ui/              # Componentes básicos reutilizáveis
│   ├── forms/           # Componentes de formulário
│   ├── layout/          # Componentes de layout
│   └── domain/          # Componentes específicos de domínio
├── hooks/               # camelCase, prefixo "use"
├── lib/                 # camelCase para utilitários
├── services/            # camelCase para serviços
├── stores/              # camelCase para stores
├── types/               # camelCase com .types.ts
├── utils/               # camelCase para funções utilitárias
└── constants/           # UPPER_SNAKE_CASE
```

### 2. Nomenclatura de Arquivos

#### Componentes React
```
// ✅ Correto - PascalCase
Button.jsx
UserCard.jsx
LoginForm.jsx
DashboardLayout.jsx

// ❌ Evitar
button.jsx
user-card.jsx
login_form.jsx
```

#### Hooks Personalizados
```
// ✅ Correto - camelCase com prefixo "use"
useAuth.js
useLocalStorage.js
useApiRequest.js
useFormValidation.js

// ❌ Evitar
auth.js
localStorage.js
apiRequest.js
```

#### Utilitários e Serviços
```
// ✅ Correto - camelCase
apiClient.js
dateUtils.js
authService.js
validationHelpers.js

// ❌ Evitar
api-client.js
date_utils.js
AuthService.js
```

#### Types/Interfaces (TypeScript)
```
// ✅ Correto
user.types.ts
api.types.ts
form.types.ts

// ❌ Evitar
userTypes.ts
User.ts
types.ts
```

#### Constantes
```
// ✅ Correto
apiEndpoints.js
appConstants.js
validationRules.js

// ❌ Evitar
API_ENDPOINTS.js
constants.js
```

## Nomenclatura de Variáveis e Funções

### 1. JavaScript/TypeScript

#### Variáveis
```javascript
// ✅ Correto - camelCase
const userName = 'john_doe';
const isLoading = false;
const apiResponse = await fetchData();
const formValidationErrors = [];

// ❌ Evitar
const user_name = 'john_doe';
const is_loading = false;
const APIResponse = await fetchData();
const form_validation_errors = [];
```

#### Funções
```javascript
// ✅ Correto - camelCase, verbos descritivos
function getUserById(id) {}
function validateEmail(email) {}
function handleFormSubmit(data) {}
function calculateTotalPrice(items) {}

// ❌ Evitar
function user(id) {}
function email(email) {}
function submit(data) {}
function total(items) {}
```

#### Event Handlers
```javascript
// ✅ Correto - prefixo "handle" ou "on"
const handleClick = () => {};
const handleSubmit = (e) => {};
const onUserSelect = (user) => {};
const onFormChange = (field, value) => {};

// ❌ Evitar
const click = () => {};
const submit = (e) => {};
const userSelect = (user) => {};
const formChange = (field, value) => {};
```

#### Booleanos
```javascript
// ✅ Correto - prefixos is, has, can, should
const isLoading = false;
const hasPermission = true;
const canEdit = false;
const shouldValidate = true;
const isVisible = false;
const hasErrors = true;

// ❌ Evitar
const loading = false;
const permission = true;
const edit = false;
const validate = true;
```

### 2. Constantes
```javascript
// ✅ Correto - UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_PAGINATION_LIMIT = 20;

// Objeto de constantes - camelCase para propriedades
const API_ENDPOINTS = {
  users: '/api/users',
  authentication: '/api/auth',
  fileUpload: '/api/upload',
};

const HTTP_STATUS_CODES = {
  ok: 200,
  created: 201,
  badRequest: 400,
  unauthorized: 401,
  notFound: 404,
  internalServerError: 500,
};
```

## Nomenclatura de Componentes

### 1. Componentes de UI
```javascript
// ✅ Correto - PascalCase, nomes descritivos
const Button = () => {};
const InputField = () => {};
const LoadingSpinner = () => {};
const ModalDialog = () => {};
const NavigationBar = () => {};

// ❌ Evitar
const button = () => {};
const Input = () => {}; // Muito genérico
const Spinner = () => {}; // Não descreve o propósito
const Modal = () => {}; // Muito genérico
```

### 2. Componentes Compostos
```javascript
// ✅ Correto - Uso de propriedades
const Card = ({ children }) => {};
Card.Header = ({ children }) => {};
Card.Content = ({ children }) => {};
Card.Footer = ({ children }) => {};

// Uso:
<Card>
  <Card.Header>Título</Card.Header>
  <Card.Content>Conteúdo</Card.Content>
  <Card.Footer>Rodapé</Card.Footer>
</Card>
```

### 3. HOCs (Higher-Order Components)
```javascript
// ✅ Correto - prefixo "with"
const withAuth = (Component) => {};
const withLoading = (Component) => {};
const withErrorBoundary = (Component) => {};

// Uso:
const ProtectedDashboard = withAuth(Dashboard);
```

## Nomenclatura de Props

### 1. Props Padrões
```javascript
// ✅ Correto - camelCase, descritivos
const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {};

// ✅ Correto - props booleanas sem prefixo "is"
const Modal = ({
  open,        // ao invés de isOpen
  closable,    // ao invés de isClosable
  visible,     // ao invés de isVisible
}) => {};
```

### 2. Event Handler Props
```javascript
// ✅ Correto - prefixo "on"
const UserList = ({
  users,
  onUserSelect,
  onUserDelete,
  onUserEdit,
  onLoadMore,
}) => {};
```

### 3. Render Props
```javascript
// ✅ Correto - sufixo "Render" ou uso de "children"
const DataFetcher = ({
  children,      // Render prop padrão
  loadingRender, // Render prop específico
  errorRender,   // Render prop específico
}) => {};
```

## Nomenclatura de CSS Classes

### 1. BEM (Block Element Modifier)
```css
/* ✅ Correto - BEM */
.card {}
.card__header {}
.card__content {}
.card__footer {}
.card--large {}
.card--small {}
.card__header--highlighted {}

/* ❌ Evitar */
.Card {}
.cardHeader {}
.card-header {}
```

### 2. Tailwind CSS Classes
```javascript
// ✅ Correto - uso consistente de classes
const Button = ({ variant, size }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {/* ... */}
    </button>
  );
};
```

## Nomenclatura de APIs e Rotas

### 1. REST APIs
```javascript
// ✅ Correto - RESTful, plural para recursos
GET    /api/users           // Listar usuários
GET    /api/users/:id       // Obter usuário específico
POST   /api/users           // Criar usuário
PUT    /api/users/:id       // Atualizar usuário
DELETE /api/users/:id       // Deletar usuário

// Recursos aninhados
GET    /api/users/:id/posts      // Posts do usuário
POST   /api/users/:id/posts      // Criar post para o usuário

// Ações customizadas
POST   /api/users/:id/activate   // Ativar usuário
POST   /api/users/:id/reset-password  // Reset senha
```

### 2. NextJS Routes
```
// ✅ Correto - App Router
app/
├── api/
│   ├── users/
│   │   ├── route.js         // /api/users
│   │   └── [id]/
│   │       └── route.js     // /api/users/[id]
│   └── auth/
│       ├── login/
│       │   └── route.js     // /api/auth/login
│       └── register/
│           └── route.js     // /api/auth/register
└── (auth)/
    ├── login/
    │   └── page.js          // /login
    └── register/
        └── page.js          // /register
```

## Nomenclatura de Banco de Dados

### 1. Tabelas e Campos
```sql
-- ✅ Correto - snake_case, singular para tabelas
CREATE TABLE user (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Relacionamentos
CREATE TABLE user_role (
  user_id UUID REFERENCES user(id),
  role_id UUID REFERENCES role(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Prisma Schema
```prisma
// ✅ Correto - PascalCase para models, camelCase para campos
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  posts Post[]
  roles UserRole[]

  @@map("user")
}
```

## Nomenclatura de Testes

### 1. Arquivos de Teste
```
// ✅ Correto
Button.test.jsx
UserService.test.js
authUtils.test.js
integration.test.js

// ✅ Alternativa
Button.spec.jsx
UserService.spec.js
```

### 2. Casos de Teste
```javascript
// ✅ Correto - describe/it descritivos
describe('Button component', () => {
  it('renders children correctly', () => {});
  it('calls onClick when clicked', () => {});
  it('applies correct variant styles', () => {});
  it('shows loading spinner when loading is true', () => {});
  it('is disabled when disabled prop is true', () => {});
});

describe('UserService', () => {
  describe('createUser', () => {
    it('creates user with valid data', () => {});
    it('throws error with invalid email', () => {});
    it('hashes password before saving', () => {});
  });
});
```

## Checklists de Nomenclatura

### ✅ Frontend Checklist
- [ ] Componentes em PascalCase
- [ ] Hooks com prefixo "use" em camelCase
- [ ] Event handlers com prefixo "handle" ou "on"
- [ ] Booleanos com prefixos is/has/can/should
- [ ] Props descritivas em camelCase
- [ ] CSS classes consistentes (BEM ou Tailwind)
- [ ] Arquivos organizados por tipo/domínio

### ✅ Backend Checklist  
- [ ] APIs RESTful com recursos em plural
- [ ] Rotas organizadas hierarquicamente
- [ ] Controllers/Services em camelCase
- [ ] Middleware descritivo
- [ ] Tabelas em snake_case
- [ ] Models em PascalCase (Prisma)
- [ ] Variáveis de ambiente em UPPER_SNAKE_CASE

### ✅ Geral Checklist
- [ ] Nomes autoexplicativos
- [ ] Consistência em todo o projeto
- [ ] Evitar abreviações desnecessárias
- [ ] Usar inglês como idioma padrão
- [ ] Documentar convenções em CLAUDE.md