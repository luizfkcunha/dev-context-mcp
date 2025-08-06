# Padrões de Formulários

## Gerenciamento de Estado de Formulários

### 1. Hook Personalizado para Formulários
```javascript
// hooks/useForm.js
import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, validationSchema = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o campo for alterado
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValue(name, type === 'checkbox' ? checked : value);
  }, [setValue]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name);
    
    // Validar campo ao perder foco
    if (validationSchema) {
      validateField(name, values[name]);
    }
  }, [values, validationSchema]);

  const validateField = useCallback((name, value) => {
    if (!validationSchema || !validationSchema[name]) return;

    const fieldValidation = validationSchema[name];
    let error = '';

    if (fieldValidation.required && (!value || value.toString().trim() === '')) {
      error = fieldValidation.required;
    } else if (fieldValidation.pattern && !fieldValidation.pattern.test(value)) {
      error = fieldValidation.patternMessage || 'Formato inválido';
    } else if (fieldValidation.minLength && value.length < fieldValidation.minLength) {
      error = fieldValidation.minLengthMessage || `Mínimo ${fieldValidation.minLength} caracteres`;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  }, [validationSchema]);

  const validateForm = useCallback(() => {
    if (!validationSchema) return true;

    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationSchema, validateField]);

  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      
      const isValid = validateForm();
      if (!isValid) return;

      setIsSubmitting(true);
      
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Erro no submit:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateForm]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setFieldTouched,
    validateForm,
    reset,
  };
};
```

### 2. Esquemas de Validação
```javascript
// utils/validation.js
export const createValidationSchema = (rules) => rules;

// Validadores comuns
export const validators = {
  required: (message = 'Campo obrigatório') => message,
  
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Email inválido',
  },
  
  phone: {
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    patternMessage: 'Telefone inválido. Use: (11) 99999-9999',
  },
  
  cpf: {
    pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    patternMessage: 'CPF inválido. Use: 123.456.789-00',
  },
  
  password: {
    minLength: 8,
    minLengthMessage: 'Senha deve ter pelo menos 8 caracteres',
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    patternMessage: 'Senha deve conter ao menos uma letra maiúscula, minúscula e um número',
  },
};

// Exemplo de esquema
export const userValidationSchema = createValidationSchema({
  name: {
    required: validators.required('Nome é obrigatório'),
    minLength: 2,
    minLengthMessage: 'Nome deve ter pelo menos 2 caracteres',
  },
  email: {
    required: validators.required('Email é obrigatório'),
    ...validators.email,
  },
  password: {
    required: validators.required('Senha é obrigatória'),
    ...validators.password,
  },
});
```

## Componentes de Formulário

### 1. Field Wrapper
```javascript
// components/forms/Field.jsx
const Field = ({ 
  children, 
  label, 
  error, 
  helperText, 
  required = false,
  className = '' 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <ExclamationCircleIcon className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Field;
```

### 2. Input Components
```javascript
// components/forms/TextInput.jsx
import { forwardRef } from 'react';
import Field from './Field';

const TextInput = forwardRef(({
  name,
  label,
  error,
  helperText,
  required = false,
  className = '',
  ...props
}, ref) => {
  return (
    <Field label={label} error={error} helperText={helperText} required={required}>
      <input
        ref={ref}
        name={name}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
    </Field>
  );
});

TextInput.displayName = 'TextInput';

export default TextInput;
```

### 3. Select Component
```javascript
// components/forms/Select.jsx
import { forwardRef } from 'react';
import Field from './Field';

const Select = forwardRef(({
  name,
  label,
  options = [],
  error,
  helperText,
  required = false,
  placeholder = 'Selecione...',
  className = '',
  ...props
}, ref) => {
  return (
    <Field label={label} error={error} helperText={helperText} required={required}>
      <select
        ref={ref}
        name={name}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
});

Select.displayName = 'Select';

export default Select;
```

### 4. Checkbox Component
```javascript
// components/forms/Checkbox.jsx
import { forwardRef } from 'react';

const Checkbox = forwardRef(({
  name,
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          ref={ref}
          name={name}
          type="checkbox"
          className={`
            w-4 h-4 text-blue-600 border-gray-300 rounded
            focus:ring-2 focus:ring-blue-500
            ${className}
          `}
          {...props}
        />
      </div>
      {label && (
        <div className="ml-3 text-sm">
          <label htmlFor={name} className="text-gray-700">
            {label}
          </label>
          {error && (
            <p className="text-red-600 mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
```

## Formulários Complexos

### 1. Multi-Step Form
```javascript
// components/forms/MultiStepForm.jsx
import { useState, Children, cloneElement } from 'react';

const MultiStepForm = ({ 
  children, 
  onSubmit, 
  initialValues = {},
  className = '' 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialValues);
  
  const steps = Children.toArray(children);
  const totalSteps = steps.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepSubmit = (stepData) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);
    
    if (currentStep === totalSteps - 1) {
      onSubmit(updatedData);
    } else {
      nextStep();
    }
  };

  return (
    <div className={className}>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Etapa {currentStep + 1} de {totalSteps}</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      {cloneElement(steps[currentStep], {
        onNext: handleStepSubmit,
        onPrev: prevStep,
        canGoBack: currentStep > 0,
        isLastStep: currentStep === totalSteps - 1,
        formData,
      })}
    </div>
  );
};

// Step Component
const FormStep = ({ 
  title, 
  children, 
  onNext, 
  onPrev, 
  canGoBack, 
  isLastStep, 
  formData 
}) => {
  const { values, errors, handleChange, handleSubmit } = useForm(formData);

  return (
    <div>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      
      <form onSubmit={handleSubmit(onNext)}>
        {typeof children === 'function' 
          ? children({ values, errors, handleChange }) 
          : children
        }
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoBack}
            className={`
              px-4 py-2 rounded-md
              ${canGoBack 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Voltar
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            {isLastStep ? 'Finalizar' : 'Próximo'}
          </button>
        </div>
      </form>
    </div>
  );
};

MultiStepForm.Step = FormStep;

export default MultiStepForm;
```

### 2. Form Arrays (Lista Dinâmica)
```javascript
// components/forms/FieldArray.jsx
import { useState } from 'react';

const FieldArray = ({ 
  name, 
  children, 
  initialValue = [{}], 
  onChange,
  addButtonText = 'Adicionar',
  removeButtonText = 'Remover'
}) => {
  const [items, setItems] = useState(initialValue);

  const addItem = () => {
    const newItems = [...items, {}];
    setItems(newItems);
    onChange?.(name, newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange?.(name, newItems);
  };

  const updateItem = (index, data) => {
    const newItems = items.map((item, i) => 
      i === index ? { ...item, ...data } : item
    );
    setItems(newItems);
    onChange?.(name, newItems);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 relative">
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
            >
              {removeButtonText}
            </button>
          )}
          
          {typeof children === 'function' 
            ? children(item, index, (data) => updateItem(index, data))
            : children
          }
        </div>
      ))}
      
      <button
        type="button"
        onClick={addItem}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
      >
        + {addButtonText}
      </button>
    </div>
  );
};

export default FieldArray;
```

## Exemplo de Uso Completo

```javascript
// pages/UserForm.jsx
import { useForm } from '../hooks/useForm';
import { userValidationSchema } from '../utils/validation';
import TextInput from '../components/forms/TextInput';
import Select from '../components/forms/Select';
import Checkbox from '../components/forms/Checkbox';
import Button from '../components/ui/Button';

const UserForm = () => {
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
      role: '',
      active: true,
    },
    userValidationSchema
  );

  const roleOptions = [
    { value: 'user', label: 'Usuário' },
    { value: 'admin', label: 'Administrador' },
  ];

  const onSubmit = async (data) => {
    try {
      await createUser(data);
      // Sucesso
    } catch (error) {
      // Tratar erro
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
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

      <Select
        name="role"
        label="Função"
        value={values.role}
        error={errors.role}
        options={roleOptions}
        onChange={handleChange}
        onBlur={handleBlur}
        required
      />

      <Checkbox
        name="active"
        label="Usuário ativo"
        checked={values.active}
        onChange={handleChange}
      />

      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full mt-4"
      >
        Salvar Usuário
      </Button>
    </form>
  );
};

export default UserForm;
```