# Padrões Avançados de Autenticação

## 1. Autenticação OTP (One-Time Password)

### 1.1 TOTP com Google Authenticator
```javascript
// lib/totp.js
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

class TOTPService {
  constructor() {
    this.serviceName = process.env.APP_NAME || 'MyApp';
  }

  // Gerar secret para novo usuário
  generateSecret(userEmail) {
    const secret = authenticator.generateSecret();
    const keyuri = authenticator.keyuri(userEmail, this.serviceName, secret);
    
    return { secret, keyuri };
  }

  // Gerar QR Code
  async generateQRCode(keyuri) {
    try {
      return await QRCode.toDataURL(keyuri);
    } catch (error) {
      throw new Error('Erro ao gerar QR Code');
    }
  }

  // Verificar token OTP
  verifyToken(token, secret) {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }

  // Gerar backup codes
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  generateBackupCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

export const totpService = new TOTPService();
```

### 1.2 SMS OTP
```javascript
// lib/sms-otp.js
import crypto from 'crypto';

class SMSOTPService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.smsProvider = new SMSProvider(); // Twilio, AWS SNS, etc.
  }

  // Gerar e enviar código OTP
  async sendOTP(phoneNumber, userId) {
    const code = this.generateNumericCode(6);
    const key = `sms_otp:${userId}:${phoneNumber}`;
    
    // Armazenar no Redis com expiração de 5 minutos
    await this.redis.setex(key, 300, JSON.stringify({
      code,
      attempts: 0,
      createdAt: Date.now()
    }));

    // Enviar SMS
    await this.smsProvider.sendSMS(phoneNumber, 
      `Seu código de verificação é: ${code}. Válido por 5 minutos.`
    );

    return { success: true };
  }

  // Verificar código OTP
  async verifyOTP(phoneNumber, userId, code) {
    const key = `sms_otp:${userId}:${phoneNumber}`;
    const data = await this.redis.get(key);
    
    if (!data) {
      throw new Error('Código expirado ou inválido');
    }

    const { code: storedCode, attempts } = JSON.parse(data);
    
    // Limite de tentativas
    if (attempts >= 3) {
      await this.redis.del(key);
      throw new Error('Muitas tentativas. Solicite um novo código.');
    }

    if (code !== storedCode) {
      // Incrementar tentativas
      await this.redis.setex(key, 300, JSON.stringify({
        code: storedCode,
        attempts: attempts + 1,
        createdAt: Date.now()
      }));
      
      throw new Error('Código incorreto');
    }

    // Código válido - remover do Redis
    await this.redis.del(key);
    return { success: true };
  }

  generateNumericCode(length) {
    return crypto.randomInt(0, Math.pow(10, length))
      .toString().padStart(length, '0');
  }
}

export const smsOTPService = new SMSOTPService();
```

### 1.3 Email OTP
```javascript
// lib/email-otp.js
import crypto from 'crypto';

class EmailOTPService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.emailService = new EmailService();
  }

  // Gerar e enviar código por email
  async sendEmailOTP(email, userId, type = 'login') {
    const code = this.generateNumericCode(6);
    const key = `email_otp:${userId}:${email}:${type}`;
    
    await this.redis.setex(key, 900, JSON.stringify({ // 15 minutos
      code,
      attempts: 0,
      createdAt: Date.now()
    }));

    const template = this.getEmailTemplate(type);
    await this.emailService.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html.replace('{{CODE}}', code)
    });

    return { success: true };
  }

  // Verificar código de email
  async verifyEmailOTP(email, userId, code, type = 'login') {
    const key = `email_otp:${userId}:${email}:${type}`;
    const data = await this.redis.get(key);
    
    if (!data) {
      throw new Error('Código expirado ou inválido');
    }

    const { code: storedCode, attempts } = JSON.parse(data);
    
    if (attempts >= 5) {
      await this.redis.del(key);
      throw new Error('Muitas tentativas. Solicite um novo código.');
    }

    if (code !== storedCode) {
      await this.redis.setex(key, 900, JSON.stringify({
        code: storedCode,
        attempts: attempts + 1,
        createdAt: Date.now()
      }));
      
      throw new Error('Código incorreto');
    }

    await this.redis.del(key);
    return { success: true };
  }

  getEmailTemplate(type) {
    const templates = {
      login: {
        subject: 'Código de Verificação - Login',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Código de Verificação</h2>
            <p>Seu código de verificação para login é:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              {{CODE}}
            </div>
            <p>Este código expira em 15 minutos.</p>
            <p>Se você não solicitou este código, ignore este email.</p>
          </div>
        `
      },
      register: {
        subject: 'Verificação de Email - Cadastro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bem-vindo!</h2>
            <p>Para completar seu cadastro, use o código abaixo:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              {{CODE}}
            </div>
            <p>Este código expira em 15 minutos.</p>
          </div>
        `
      },
      reset: {
        subject: 'Código de Recuperação de Senha',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperação de Senha</h2>
            <p>Use o código abaixo para redefinir sua senha:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              {{CODE}}
            </div>
            <p>Este código expira em 15 minutos.</p>
            <p>Se você não solicitou a recuperação de senha, ignore este email.</p>
          </div>
        `
      }
    };

    return templates[type] || templates.login;
  }

  generateNumericCode(length) {
    return crypto.randomInt(0, Math.pow(10, length))
      .toString().padStart(length, '0');
  }
}

export const emailOTPService = new EmailOTPService();
```

## 2. Autenticação com Email e Senha

### 2.1 Registro de Usuário com Validação
```javascript
// lib/user-registration.js
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { emailOTPService } from './email-otp.js';

const userRegistrationSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .refine(email => !email.includes('+'), 'Email com + não é permitido'),
  
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/(?=.*[a-z])/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/(?=.*[A-Z])/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/(?=.*\d)/, 'Senha deve conter pelo menos um número')
    .regex(/(?=.*[@$!%*?&])/, 'Senha deve conter pelo menos um caractere especial'),
  
  confirmPassword: z.string(),
  
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999')
    .optional(),
  
  acceptTerms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'Você deve aceitar a política de privacidade'),
  
  marketingConsent: z.boolean().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

class UserRegistrationService {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // Verificar se email já existe
  async checkEmailExists(email) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    return !!user;
  }

  // Validar dados de registro
  async validateRegistration(data) {
    try {
      const validatedData = userRegistrationSchema.parse(data);
      
      // Verificar email único
      if (await this.checkEmailExists(validatedData.email)) {
        throw new Error('Email já está em uso');
      }

      // Verificar força da senha
      const passwordStrength = this.checkPasswordStrength(validatedData.password);
      if (passwordStrength.score < 3) {
        throw new Error(`Senha muito fraca: ${passwordStrength.feedback.join(', ')}`);
      }

      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.reduce((acc, curr) => {
            acc[curr.path[0]] = curr.message;
            return acc;
          }, {})
        };
      }
      
      return { valid: false, error: error.message };
    }
  }

  // Iniciar processo de registro
  async initiateRegistration(userData) {
    const validation = await this.validateRegistration(userData);
    if (!validation.valid) {
      return validation;
    }

    const { data } = validation;
    const tempId = crypto.randomUUID();
    
    // Armazenar dados temporários
    await this.redis.setex(`temp_registration:${tempId}`, 3600, JSON.stringify({
      ...data,
      password: await bcrypt.hash(data.password, 12), // Hash da senha
      createdAt: Date.now()
    }));

    // Enviar código de verificação por email
    await emailOTPService.sendEmailOTP(data.email, tempId, 'register');

    return {
      success: true,
      tempId,
      message: 'Código de verificação enviado para seu email'
    };
  }

  // Confirmar registro com código OTP
  async confirmRegistration(tempId, otpCode) {
    const tempData = await this.redis.get(`temp_registration:${tempId}`);
    if (!tempData) {
      throw new Error('Dados de registro expirados. Inicie o processo novamente.');
    }

    const userData = JSON.parse(tempData);
    
    // Verificar código OTP
    await emailOTPService.verifyEmailOTP(userData.email, tempId, otpCode, 'register');

    // Criar usuário no banco de dados
    const user = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        emailVerified: new Date(),
        marketingConsent: userData.marketingConsent || false,
        profile: {
          create: {
            firstName: userData.name.split(' ')[0],
            lastName: userData.name.split(' ').slice(1).join(' '),
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Limpar dados temporários
    await this.redis.del(`temp_registration:${tempId}`);

    // Log de auditoria
    await this.logUserAction(user.id, 'USER_REGISTERED', {
      email: user.email,
      registrationMethod: 'email_verification'
    });

    return {
      success: true,
      user: this.sanitizeUser(user),
      message: 'Cadastro realizado com sucesso!'
    };
  }

  // Verificar força da senha
  checkPasswordStrength(password) {
    const feedback = [];
    let score = 0;

    // Critérios básicos
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[@$!%*?&])/.test(password)) score++;

    // Verificar padrões comuns fracos
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score -= 2;
      feedback.push('Evite senhas comuns');
    }

    // Verificar sequências
    if (/123|abc|qwe/i.test(password)) {
      score--;
      feedback.push('Evite sequências óbvias');
    }

    if (score >= 5) feedback.push('Senha forte');
    else if (score >= 3) feedback.push('Senha moderada');
    else feedback.push('Senha fraca');

    return { score: Math.max(0, score), feedback };
  }

  // Sanitizar dados do usuário
  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  // Log de ações do usuário
  async logUserAction(userId, action, metadata = {}) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata,
        timestamp: new Date(),
        ipAddress: metadata.ipAddress || 'unknown'
      }
    });
  }
}

export const userRegistrationService = new UserRegistrationService();
```

### 2.2 Login com Email e Senha
```javascript
// lib/user-login.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().optional(),
  captcha: z.string().optional()
});

class UserLoginService {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL);
    this.maxAttempts = 5;
    this.lockoutTime = 15 * 60; // 15 minutos
  }

  // Verificar tentativas de login
  async checkLoginAttempts(email, ipAddress) {
    const key = `login_attempts:${email}:${ipAddress}`;
    const attempts = await this.redis.get(key);
    
    if (attempts && parseInt(attempts) >= this.maxAttempts) {
      const ttl = await this.redis.ttl(key);
      throw new Error(`Muitas tentativas de login. Tente novamente em ${Math.ceil(ttl/60)} minutos.`);
    }
    
    return true;
  }

  // Incrementar tentativas de login
  async incrementLoginAttempts(email, ipAddress) {
    const key = `login_attempts:${email}:${ipAddress}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, this.lockoutTime);
    }
    
    return current;
  }

  // Limpar tentativas de login
  async clearLoginAttempts(email, ipAddress) {
    const key = `login_attempts:${email}:${ipAddress}`;
    await this.redis.del(key);
  }

  // Autenticar usuário
  async authenticateUser(loginData, ipAddress) {
    const validation = loginSchema.parse(loginData);
    const { email, password, rememberMe } = validation;

    // Verificar tentativas de login
    await this.checkLoginAttempts(email, ipAddress);

    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        sessions: {
          where: { expires: { gt: new Date() } }
        }
      }
    });

    if (!user) {
      await this.incrementLoginAttempts(email, ipAddress);
      throw new Error('Email ou senha incorretos');
    }

    // Verificar se conta está ativa
    if (user.status === 'SUSPENDED') {
      throw new Error('Conta suspensa. Entre em contato com o suporte.');
    }

    if (user.status === 'INACTIVE') {
      throw new Error('Conta inativa. Verifique seu email para ativação.');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await this.incrementLoginAttempts(email, ipAddress);
      
      // Log de tentativa de login inválida
      await this.logUserAction(user.id, 'INVALID_LOGIN_ATTEMPT', {
        email,
        ipAddress,
        userAgent: process.env.USER_AGENT
      });
      
      throw new Error('Email ou senha incorretos');
    }

    // Verificar 2FA se habilitado
    if (user.twoFactorEnabled) {
      return await this.initiateTwoFactorLogin(user, ipAddress);
    }

    return await this.completeLogin(user, ipAddress, rememberMe);
  }

  // Iniciar login com 2FA
  async initiateTwoFactorLogin(user, ipAddress) {
    const tempToken = jwt.sign(
      { 
        userId: user.id,
        type: '2fa_pending',
        ipAddress 
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Limpar tentativas de login já que a senha estava correta
    await this.clearLoginAttempts(user.email, ipAddress);

    return {
      requiresTwoFactor: true,
      tempToken,
      availableMethods: user.twoFactorMethods || ['totp']
    };
  }

  // Completar login
  async completeLogin(user, ipAddress, rememberMe = false) {
    // Limpar tentativas de login
    await this.clearLoginAttempts(user.email, ipAddress);

    // Gerar tokens
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { 
        userId: user.id,
        type: 'refresh' 
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d' }
    );

    // Criar sessão
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress,
        userAgent: process.env.USER_AGENT || 'unknown',
        expires: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)),
        isRemembered: rememberMe
      }
    });

    // Atualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress
      }
    });

    // Log de login bem-sucedido
    await this.logUserAction(user.id, 'USER_LOGIN', {
      ipAddress,
      userAgent: process.env.USER_AGENT,
      rememberMe
    });

    return {
      success: true,
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 * 1000 // 15 minutos em ms
      },
      session: {
        id: session.id,
        expires: session.expires
      }
    };
  }

  // Renovar token de acesso
  async refreshAccessToken(refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (payload.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      // Verificar se a sessão existe e está válida
      const session = await this.prisma.session.findFirst({
        where: {
          token: refreshToken,
          expires: { gt: new Date() }
        },
        include: { user: true }
      });

      if (!session) {
        throw new Error('Sessão expirada');
      }

      // Gerar novo access token
      const accessToken = jwt.sign(
        { 
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return {
        accessToken,
        expiresIn: 15 * 60 * 1000
      };

    } catch (error) {
      throw new Error('Token de renovação inválido');
    }
  }

  // Logout
  async logout(refreshToken) {
    if (!refreshToken) return { success: true };

    // Remover sessão
    await this.prisma.session.deleteMany({
      where: { token: refreshToken }
    });

    return { success: true };
  }

  // Logout de todas as sessões
  async logoutAll(userId) {
    await this.prisma.session.deleteMany({
      where: { userId }
    });

    // Log da ação
    await this.logUserAction(userId, 'LOGOUT_ALL_SESSIONS');

    return { success: true };
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  async logUserAction(userId, action, metadata = {}) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata,
        timestamp: new Date(),
        ipAddress: metadata.ipAddress || 'unknown'
      }
    });
  }
}

export const userLoginService = new UserLoginService();
```

## 3. Componentes Frontend para Autenticação

### 3.1 Formulário de Registro com Validação
```jsx
// components/auth/RegistrationForm.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';

export function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
    acceptPrivacy: false,
    marketingConsent: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // form, verify, success
  const [tempId, setTempId] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.error || 'Erro ao criar conta' });
        }
        return;
      }

      setTempId(data.tempId);
      setStep('verify');
      
    } catch (error) {
      setErrors({ general: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempId, otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ otp: data.error || 'Código inválido' });
        return;
      }

      setStep('success');
      
      // Redirecionar após alguns segundos
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error) {
      setErrors({ otp: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempId })
      });
      
      alert('Código reenviado para seu email!');
    } catch (error) {
      alert('Erro ao reenviar código');
    }
  };

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Verifique seu Email</h2>
          <p className="text-gray-600 mt-2">
            Enviamos um código de 6 dígitos para seu email
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Código de Verificação
            </label>
            <Input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="text-center text-lg tracking-widest"
              autoComplete="one-time-code"
            />
            {errors.otp && (
              <p className="text-red-500 text-sm mt-1">{errors.otp}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Verificar Código
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={resendCode}
              className="text-blue-600 hover:underline text-sm"
            >
              Reenviar código
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Conta Criada com Sucesso!
        </h2>
        <p className="text-gray-600">
          Redirecionando para o dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Criar Conta</h2>
        <p className="text-gray-600 mt-2">
          Preencha os dados abaixo para começar
        </p>
      </div>

      {errors.general && (
        <Alert variant="error" className="mb-4">
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nome Completo *
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="João Silva"
            error={errors.name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email *
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="joao@exemplo.com"
            error={errors.email}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Telefone
          </label>
          <Input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="(11) 99999-9999"
            error={errors.phone}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Senha *
          </label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            error={errors.password}
          />
          {formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Confirmar Senha *
          </label>
          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••"
            error={errors.confirmPassword}
          />
        </div>

        <div className="space-y-3">
          <Checkbox
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            error={errors.acceptTerms}
          >
            Concordo com os{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Termos de Uso
            </a>
          </Checkbox>

          <Checkbox
            name="acceptPrivacy"
            checked={formData.acceptPrivacy}
            onChange={handleInputChange}
            error={errors.acceptPrivacy}
          >
            Concordo com a{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Política de Privacidade
            </a>
          </Checkbox>

          <Checkbox
            name="marketingConsent"
            checked={formData.marketingConsent}
            onChange={handleInputChange}
          >
            Desejo receber ofertas e novidades por email (opcional)
          </Checkbox>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Criar Conta
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Já tem uma conta?{' '}
          <a href="/auth/login" className="text-blue-600 hover:underline font-medium">
            Faça login
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 3.2 Formulário de Login com 2FA
```jsx
// components/auth/LoginForm.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login'); // login, twoFactor, success
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [availableMethods, setAvailableMethods] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || 'Erro ao fazer login' });
        return;
      }

      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setAvailableMethods(data.availableMethods);
        setStep('twoFactor');
        return;
      }

      // Login completo
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      
      setStep('success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (error) {
      setErrors({ general: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactor = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ code: twoFactorCode, method: 'totp' })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ twoFactor: data.error || 'Código inválido' });
        return;
      }

      // Login completo
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      
      setStep('success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (error) {
      setErrors({ twoFactor: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'twoFactor') {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Verificação em Duas Etapas</h2>
          <p className="text-gray-600 mt-2">
            Digite o código do seu aplicativo autenticador
          </p>
        </div>

        <form onSubmit={handleTwoFactor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Código de Verificação
            </label>
            <Input
              type="text"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="text-center text-lg tracking-widest"
              autoComplete="one-time-code"
            />
            {errors.twoFactor && (
              <p className="text-red-500 text-sm mt-1">{errors.twoFactor}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Verificar
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep('login')}
              className="text-blue-600 hover:underline text-sm"
            >
              Voltar ao login
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Login Realizado!
        </h2>
        <p className="text-gray-600">
          Redirecionando...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Entrar</h2>
        <p className="text-gray-600 mt-2">
          Acesse sua conta
        </p>
      </div>

      {errors.general && (
        <Alert variant="error" className="mb-4">
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="joao@exemplo.com"
            error={errors.email}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Senha
          </label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            error={errors.password}
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
          >
            Lembrar de mim
          </Checkbox>

          <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
            Esqueci minha senha
          </a>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Entrar
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{' '}
          <a href="/auth/register" className="text-blue-600 hover:underline font-medium">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
```

## 4. APIs de Autenticação

### 4.1 API de Registro
```javascript
// pages/api/auth/register.js
import { userRegistrationService } from '@/lib/user-registration';
import { getClientIP, rateLimiter } from '@/lib/utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const ipAddress = getClientIP(req);
    
    // Rate limiting
    const isAllowed = await rateLimiter.check('register', ipAddress, 3, 3600); // 3 tentativas por hora
    if (!isAllowed) {
      return res.status(429).json({ 
        error: 'Muitas tentativas de registro. Tente novamente em 1 hora.' 
      });
    }

    const result = await userRegistrationService.initiateRegistration(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
```

### 4.2 API de Login
```javascript
// pages/api/auth/login.js
import { userLoginService } from '@/lib/user-login';
import { getClientIP, rateLimiter } from '@/lib/utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const ipAddress = getClientIP(req);
    
    // Rate limiting global por IP
    const isAllowed = await rateLimiter.check('login', ipAddress, 10, 900); // 10 tentativas por 15min
    if (!isAllowed) {
      return res.status(429).json({ 
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' 
      });
    }

    const result = await userLoginService.authenticateUser(req.body, ipAddress);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
}
```

## 5. Padrões de Segurança e Validação

### 5.1 Rate Limiting e Proteção contra Ataques
```javascript
// lib/security/rate-limiter.js
import Redis from 'ioredis';

class RateLimiter {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // Rate limiting baseado em sliding window
  async check(key, identifier, maxRequests, windowMs) {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const redisKey = `rate_limit:${key}:${identifier}:${window}`;
    
    const current = await this.redis.incr(redisKey);
    
    if (current === 1) {
      await this.redis.expire(redisKey, Math.ceil(windowMs / 1000));
    }
    
    return current <= maxRequests;
  }

  // Rate limiting com múltiplas janelas (mais preciso)
  async checkSlidingWindow(key, identifier, maxRequests, windowMs) {
    const now = Date.now();
    const pipeline = this.redis.pipeline();
    
    // Remover entradas antigas
    pipeline.zremrangebyscore(`sliding:${key}:${identifier}`, 0, now - windowMs);
    
    // Contar requests atuais
    pipeline.zcard(`sliding:${key}:${identifier}`);
    
    // Adicionar request atual
    pipeline.zadd(`sliding:${key}:${identifier}`, now, `${now}-${Math.random()}`);
    
    // Definir expiração
    pipeline.expire(`sliding:${key}:${identifier}`, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const currentCount = results[1][1];
    
    return currentCount < maxRequests;
  }

  // Rate limiting progressivo (aumenta o delay com mais tentativas)
  async checkProgressive(key, identifier, baseWindowMs = 60000) {
    const attemptsKey = `attempts:${key}:${identifier}`;
    const attempts = await this.redis.get(attemptsKey) || 0;
    const currentAttempts = parseInt(attempts);
    
    // Calcular delay baseado no número de tentativas
    const delays = [0, 1000, 5000, 15000, 60000, 300000]; // 0s, 1s, 5s, 15s, 1m, 5m
    const delay = delays[Math.min(currentAttempts, delays.length - 1)];
    
    if (delay > 0) {
      const lastAttemptKey = `last_attempt:${key}:${identifier}`;
      const lastAttempt = await this.redis.get(lastAttemptKey);
      
      if (lastAttempt && Date.now() - parseInt(lastAttempt) < delay) {
        return false;
      }
    }
    
    // Incrementar tentativas
    await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, baseWindowMs / 1000);
    
    // Atualizar último attempt
    await this.redis.set(`last_attempt:${key}:${identifier}`, Date.now(), 'EX', delay / 1000);
    
    return true;
  }

  // Limpar tentativas após sucesso
  async reset(key, identifier) {
    await this.redis.del(`attempts:${key}:${identifier}`);
    await this.redis.del(`last_attempt:${key}:${identifier}`);
    await this.redis.del(`sliding:${key}:${identifier}`);
  }
}

export const rateLimiter = new RateLimiter();
```

### 5.2 Validação de Entrada e Sanitização
```javascript
// lib/security/input-validator.js
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

class InputValidator {
  constructor() {
    this.emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    this.phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    this.strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  }

  // Sanitizar HTML
  sanitizeHtml(input) {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }

  // Sanitizar entrada geral
  sanitizeInput(input) {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, ''); // Remove event handlers
    }
    return input;
  }

  // Validar e sanitizar dados do usuário
  validateUserData(data) {
    const schema = z.object({
      name: z.string()
        .min(2, 'Nome muito curto')
        .max(100, 'Nome muito longo')
        .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos')
        .transform(val => this.sanitizeInput(val)),
      
      email: z.string()
        .email('Email inválido')
        .max(254, 'Email muito longo')
        .toLowerCase()
        .refine(email => this.emailRegex.test(email), 'Formato de email inválido')
        .refine(email => !this.isDisposableEmail(email), 'Emails temporários não são permitidos'),
      
      password: z.string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres')
        .max(128, 'Senha muito longa')
        .refine(pwd => this.strongPasswordRegex.test(pwd), 'Senha não atende aos critérios de segurança')
        .refine(pwd => !this.isCommonPassword(pwd), 'Senha muito comum'),
      
      phone: z.string()
        .regex(this.phoneRegex, 'Formato de telefone inválido')
        .optional()
        .or(z.literal('')),
      
      birthDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
        .refine(date => this.isValidAge(date), 'Idade inválida')
        .optional(),
      
      document: z.string()
        .refine(doc => this.isValidCPF(doc), 'CPF inválido')
        .optional()
        .or(z.literal(''))
    });

    return schema.parse(data);
  }

  // Verificar se é email temporário/descartável
  isDisposableEmail(email) {
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'yopmail.com',
      // Adicionar mais domínios conforme necessário
    ];
    
    const domain = email.split('@')[1];
    return disposableDomains.includes(domain.toLowerCase());
  }

  // Verificar se é senha comum
  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', '12345678', '1234567890'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  // Validar idade mínima
  isValidAge(birthDate, minAge = 13) {
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return (age - 1) >= minAge;
    }
    
    return age >= minAge;
  }

  // Validar CPF
  isValidCPF(cpf) {
    if (!cpf) return true; // CPF é opcional
    
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // Todos os dígitos iguais
    
    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  // Validar dados de login
  validateLoginData(data) {
    const schema = z.object({
      email: z.string()
        .email('Email inválido')
        .max(254, 'Email muito longo')
        .toLowerCase(),
      
      password: z.string()
        .min(1, 'Senha é obrigatória')
        .max(128, 'Senha muito longa'),
      
      rememberMe: z.boolean().optional(),
      
      captcha: z.string().optional()
    });

    return schema.parse(data);
  }

  // Validar código OTP
  validateOTPCode(code) {
    const schema = z.string()
      .regex(/^\d{6}$/, 'Código deve ter 6 dígitos')
      .transform(val => val.trim());

    return schema.parse(code);
  }
}

export const inputValidator = new InputValidator();
```

### 5.3 Criptografia e Hash de Senhas
```javascript
// lib/security/crypto-utils.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

class CryptoUtils {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.saltRounds = 12;
  }

  // Hash de senha com bcrypt
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  // Verificar senha
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Gerar chave de criptografia
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Criptografar dados sensíveis
  encrypt(text, key) {
    if (!key) {
      key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key, { iv });
    
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      encrypted: encrypted.toString('hex')
    };
  }

  // Descriptografar dados
  decrypt(encryptedData, key) {
    if (!key) {
      key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, key, { iv });
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  // Gerar token seguro
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Gerar ID único
  generateUUID() {
    return crypto.randomUUID();
  }

  // Hash de dados (para integridade)
  generateHash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  // HMAC para verificação de integridade
  generateHMAC(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  // Verificar HMAC
  verifyHMAC(data, hmac, secret) {
    const expectedHmac = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );
  }

  // Gerar salt
  generateSalt(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Key derivation function (PBKDF2)
  deriveKey(password, salt, iterations = 100000, keyLength = 32) {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
  }
}

export const cryptoUtils = new CryptoUtils();
```

### 5.4 Middleware de Segurança
```javascript
// lib/security/security-middleware.js
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { inputValidator } from './input-validator.js';
import { cryptoUtils } from './crypto-utils.js';

// Rate limiting middleware
export const createRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: 'Muitas requisições. Tente novamente mais tarde.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Helmet para headers de segurança
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware de sanitização de entrada
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return inputValidator.sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Middleware de CORS
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Middleware de logging de segurança
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log da requisição
  console.log({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer')
  });
  
  // Override do res.json para capturar erros
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    if (res.statusCode >= 400) {
      console.warn({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: req.ip,
        statusCode: res.statusCode,
        duration,
        error: data.error || 'Unknown error'
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware de detecção de bot
export const botDetection = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ];
  
  const isBot = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isBot && !req.url.startsWith('/api/public')) {
    return res.status(403).json({ 
      error: 'Acesso negado para bots' 
    });
  }
  
  next();
};

// Middleware de validação de API Key
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key obrigatória' });
  }
  
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'API Key inválida' });
  }
  
  next();
};
```

### 5.5 Auditoria e Logging de Segurança
```javascript
// lib/security/audit-logger.js
import winston from 'winston';

class AuditLogger {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'security-audit' },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/security-error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 10
        }),
        new winston.transports.File({ 
          filename: 'logs/security-audit.log',
          maxsize: 5242880,
          maxFiles: 10
        })
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }
  }

  // Log de eventos de autenticação
  logAuthEvent(event, userId, details = {}) {
    this.logger.info('AUTH_EVENT', {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      success: details.success !== false,
      ...details
    });
  }

  // Log de tentativas de acesso não autorizado
  logUnauthorizedAccess(req, reason) {
    this.logger.warn('UNAUTHORIZED_ACCESS', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      reason,
      timestamp: new Date().toISOString()
    });
  }

  // Log de atividades suspeitas
  logSuspiciousActivity(type, details) {
    this.logger.warn('SUSPICIOUS_ACTIVITY', {
      type,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // Log de alterações de dados sensíveis
  logDataChange(userId, dataType, operation, changes = {}) {
    this.logger.info('DATA_CHANGE', {
      userId,
      dataType,
      operation, // CREATE, UPDATE, DELETE
      changes,
      timestamp: new Date().toISOString()
    });
  }

  // Log de erros de segurança
  logSecurityError(error, context = {}) {
    this.logger.error('SECURITY_ERROR', {
      error: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  // Log de violações de rate limit
  logRateLimitViolation(ip, endpoint, attempts) {
    this.logger.warn('RATE_LIMIT_VIOLATION', {
      ip,
      endpoint,
      attempts,
      timestamp: new Date().toISOString()
    });
  }

  // Log de uploads de arquivo
  logFileUpload(userId, fileName, fileSize, mimeType) {
    this.logger.info('FILE_UPLOAD', {
      userId,
      fileName,
      fileSize,
      mimeType,
      timestamp: new Date().toISOString()
    });
  }

  // Log de exportação de dados
  logDataExport(userId, dataType, recordCount) {
    this.logger.info('DATA_EXPORT', {
      userId,
      dataType,
      recordCount,
      timestamp: new Date().toISOString()
    });
  }

  // Log de mudanças de privilégios
  logPrivilegeChange(adminUserId, targetUserId, oldRole, newRole) {
    this.logger.info('PRIVILEGE_CHANGE', {
      adminUserId,
      targetUserId,
      oldRole,
      newRole,
      timestamp: new Date().toISOString()
    });
  }
}

export const auditLogger = new AuditLogger();
```