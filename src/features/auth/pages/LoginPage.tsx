import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle, Building2, Clock, Eye, EyeOff, Fingerprint, Lock, LogIn, Mail, Shield, ShieldCheck,
  Timer, Users,
} from 'lucide-react';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { env } from '@/config/environment';
import { cn } from '@/lib/utils';

// Demo accounts are kept for the mock phase. Remove this block (and the panel below) when real auth is live.
const DEMO_ACCOUNTS = [
  { role: 'Super Admin', description: 'Platform-wide access', email: 'superadmin@example.com', password: 'password123', icon: Shield },
  { role: 'Admin', description: 'All sub companies', email: 'admin@example.com', password: 'password123', icon: Users },
  { role: 'HR', description: 'One sub company', email: 'hr@example.com', password: 'password123', icon: Clock },
];

const HIGHLIGHTS = [
  { icon: Fingerprint, title: 'Live biometric punches', text: 'Punches flow in from every device, branch by branch.' },
  { icon: Building2, title: 'Multi-branch, one view', text: 'Companies, sub companies and teams under a single roof.' },
  { icon: Timer, title: 'Automatic calculations', text: 'Late, early-out and overtime worked out from each shift.' },
  { icon: ShieldCheck, title: 'Full audit trail', text: 'Every change is recorded with who made it and when.' },
];

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-900/30', className)}>
      <Clock className="h-1/2 w-1/2 text-white" />
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const currentEmail = watch('email');

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
    setValue('email', email, { shouldValidate: false });
    setValue('password', password, { shouldValidate: false });
    setServerError('');
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* ── Brand panel (desktop) ───────────────────────────────────────── */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-surface-950 px-14 py-12 text-white"
        aria-hidden="true"
      >
        {/* Decorative background: soft brand glows over a faint grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(60rem 40rem at 0% 0%, rgba(37,99,235,0.35), transparent 60%), radial-gradient(45rem 35rem at 100% 100%, rgba(29,78,216,0.28), transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />

        <div className="relative flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <span className="text-lg font-semibold tracking-tight">{env.appName}</span>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-brand-300">
            Workforce attendance management
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Every punch, every branch,
            <span className="text-brand-300"> accounted for.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-surface-300">
            Track attendance from your biometric devices, manage shifts and holidays, and keep payroll inputs accurate — from one dashboard.
          </p>

          <ul className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-2">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15">
                  <Icon className="h-[18px] w-[18px] text-brand-200" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-surface-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-surface-500">
          © {new Date().getFullYear()} {env.appName} · v{env.appVersion}
        </p>
      </aside>

      {/* ── Sign-in panel ───────────────────────────────────────────────── */}
      <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10 sm:px-10 lg:min-h-0">
        <div className="w-full max-w-[26rem]">
          {/* Brand (mobile / tablet) */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark className="h-10 w-10" />
            <span className="text-lg font-semibold tracking-tight text-surface-900">{env.appName}</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-surface-900">Sign in</h2>
            <p className="mt-1.5 text-sm text-surface-500">Enter your work email and password to access your workspace.</p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger-600" />
              <p className="text-sm font-medium text-danger-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="you@company.com"
              required
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="pointer-events-auto text-surface-400 transition-colors hover:text-surface-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
            />

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting} leftIcon={<LogIn className="h-4 w-4" />}>
              Sign in
            </Button>
          </form>

          {/* ── Demo accounts ───────────────────────────────────────────── */}
          <div className="mt-9">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-surface-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-surface-400">Demo accounts</span>
              <span className="h-px flex-1 bg-surface-200" />
            </div>

            <div className="mt-4 space-y-2">
              {DEMO_ACCOUNTS.map(({ role, description, email, password, icon: Icon }) => {
                const selected = currentEmail === email;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => fillDemo(email, password)}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
                      selected
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                        selected ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-500'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-surface-900">{role}</span>
                        <span className="truncate text-xs text-surface-400">{description}</span>
                      </span>
                      <span className="block truncate font-mono text-xs text-surface-500">{email}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-center text-xs text-surface-500">
              Click an account to fill the form · Password for all:{' '}
              <code className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-surface-700">password123</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
