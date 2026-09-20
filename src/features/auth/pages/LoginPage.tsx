import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, Clock, Shield, Users } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', email: 'superadmin@example.com', password: 'password123', color: 'brand', icon: <Shield className="h-4 w-4" /> },
  { role: 'Admin', email: 'admin@example.com', password: 'password123', color: 'green', icon: <Users className="h-4 w-4" /> },
  { role: 'HR', email: 'hr@example.com', password: 'password123', color: 'orange', icon: <Clock className="h-4 w-4" /> },
];

const colorMap: Record<string, string> = {
  brand: 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100',
  green: 'bg-success-50 border-success-200 text-success-700 hover:bg-success-100',
  orange: 'bg-warning-50 border-warning-200 text-warning-700 hover:bg-warning-100',
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormData) {
    setServerError('');
    try {
      await login(data);
      // Redirect after login based on role (router will handle via auth store)
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const user = JSON.parse(stored) as { role: string };
        if (user.role === 'SUPER_ADMIN') navigate('/super-admin/dashboard');
        else if (user.role === 'ADMIN') navigate('/admin/dashboard');
        else navigate('/hr/dashboard');
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  }

  function fillDemo(email: string, password: string) {
    setValue('email', email);
    setValue('password', password);
    setServerError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-brand-950 to-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 bg-brand-600 rounded-2xl mb-4 shadow-soft-lg">
            <Clock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AttendanceIQ</h1>
          <p className="text-surface-400 text-sm mt-1">Workforce Attendance Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-surface-900">Welcome back</h2>
            <p className="text-sm text-surface-500 mt-1">Sign in to your account to continue</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3.5 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-700 font-medium">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-surface-400 hover:text-surface-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={isSubmitting}
              leftIcon={<LogIn className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6">
          <p className="text-center text-xs text-surface-500 mb-3 font-medium uppercase tracking-wider">
            Demo Accounts
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                onClick={() => fillDemo(acc.email, acc.password)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${colorMap[acc.color]}`}
              >
                <span className="flex items-center gap-2.5">
                  {acc.icon}
                  {acc.role}
                </span>
                <span className="font-mono text-xs opacity-75">{acc.email}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-surface-500 mt-3">
            Password for all accounts:{' '}
            <code className="bg-surface-800 text-surface-300 px-1.5 py-0.5 rounded text-xs">
              password123
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
