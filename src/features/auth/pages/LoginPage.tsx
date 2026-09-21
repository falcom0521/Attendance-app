import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight, Clock, Eye, EyeOff, Lock, Mail, Users } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { env } from '@/config/environment';
import { cn } from '@/lib/utils';

// Demo accounts are kept for the mock phase. Remove this block (and the chips below) when real auth is live.
const DEMO_ACCOUNTS = [
  // { short: 'Super Admin', role: 'Super Admin', description: 'Platform-wide access', email: 'superadmin@example.com', password: 'password123', icon: Shield }, // needs Shield from lucide-react
  { short: 'Read-only', role: 'Super Admin (Read-only)', description: 'View only', email: 'viewer@example.com', password: 'password123', icon: Eye },
  { short: 'Admin', role: 'Admin', description: 'All sub companies', email: 'admin@example.com', password: 'password123', icon: Users },
  { short: 'HR', role: 'HR', description: 'One sub company', email: 'hr@example.com', password: 'password123', icon: Clock },
];

/** Soft drifting colour glows over a faint grid. One continuous canvas behind both halves of the page. */
function Ambience() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] transform-gpu rounded-full bg-brand-500/30 blur-3xl animate-drift-a dark:bg-brand-600/25" />
      <div className="absolute -bottom-52 -right-40 h-[40rem] w-[40rem] transform-gpu rounded-full bg-cyan-400/25 blur-3xl animate-drift-b dark:bg-cyan-500/10" />
      <div className="absolute left-1/3 top-1/3 h-[28rem] w-[28rem] transform-gpu rounded-full bg-indigo-400/20 blur-3xl animate-drift-c dark:bg-indigo-600/15" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(var(--c-surface-900) / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--c-surface-900) / 0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 25%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 25%, transparent 78%)',
        }}
      />
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30',
        className
      )}
    >
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
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema), mode: 'onTouched' });

  const currentEmail = watch('email');
  const selectedDemo = DEMO_ACCOUNTS.find((a) => a.email === currentEmail);

  async function onSubmit(data: LoginFormData) {
    setServerError('');
    try {
      await login(data);
      // Redirect after login based on role (router will handle via auth store)
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const user = JSON.parse(stored) as { role: string };
        if (user.role === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN_VIEWER') navigate('/super-admin/dashboard');
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
    <div className="relative min-h-screen overflow-hidden bg-surface-50 text-surface-900">
      <Ambience />

      {/* Top bar: brand + theme toggle */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <div className="flex items-center gap-3 animate-fade-up">
          <BrandMark className="h-10 w-10" />
          <span className="text-lg font-semibold tracking-tight">{env.appName}</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-28 sm:px-8 lg:px-12">
        <div className="grid w-full items-center gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,26.5rem)] lg:gap-24">
          {/* ── Message (desktop) ────────────────────────────── */}
          <section className="hidden lg:block">
            <p
              className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-surface-200/80 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-surface-600 backdrop-blur"
              style={{ animationDelay: '60ms' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Workforce attendance management
            </p>

            <h1
              className="mt-6 animate-fade-up text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl"
              style={{ animationDelay: '140ms' }}
            >
              <span className="block">Every punch,</span>
              <span className="block">every branch,</span>
              <span className="block bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 bg-clip-text pb-1 text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-cyan-300">
                accounted for.
              </span>
            </h1>

            <p
              className="mt-5 max-w-md animate-fade-up text-lg leading-relaxed text-surface-500"
              style={{ animationDelay: '220ms' }}
            >
              Biometric attendance, shifts and payroll inputs — in one calm dashboard.
            </p>

          </section>

          {/* ── Sign-in card ─────────────────────────────────────────────── */}
          <main className="relative animate-fade-up" style={{ animationDelay: '180ms' }}>
            <div className="relative rounded-3xl border border-surface-200/80 bg-card/75 p-7 shadow-soft-xl backdrop-blur-xl sm:p-9">
              <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />

              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-1.5 text-sm text-surface-500">Sign in to continue to your workspace.</p>

              {serverError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2.5 rounded-xl border border-danger-100 bg-danger-50 px-3.5 py-3"
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

                <Button type="submit" className="cta-shimmer w-full" size="lg" loading={isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Sign in
                </Button>
              </form>

              {/* ── Demo accounts ─────────────────────────────────────────── */}
              <div className="mt-8">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-surface-200" />
                  <span className="text-xs font-medium uppercase tracking-wider text-surface-400">Demo accounts</span>
                  <span className="h-px flex-1 bg-surface-200" />
                </div>

                <div
                  className="mt-4 grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${DEMO_ACCOUNTS.length}, minmax(0, 1fr))` }}
                >
                  {DEMO_ACCOUNTS.map(({ short, role, description, email, password, icon: Icon }) => {
                    const selected = currentEmail === email;
                    return (
                      <button
                        key={email}
                        type="button"
                        onClick={() => fillDemo(email, password)}
                        aria-pressed={selected}
                        title={`${role} — ${description}`}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-medium transition-all duration-200',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                          selected
                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10'
                            : 'border-surface-200 bg-card text-surface-600 hover:-translate-y-0.5 hover:border-surface-300 hover:text-surface-900'
                        )}
                      >
                        <Icon className="hidden h-4 w-4 flex-shrink-0 xs:block" />
                        <span className="truncate">{short}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 min-h-[2.25rem] text-center text-xs leading-relaxed text-surface-500">
                  {selectedDemo ? (
                    <>
                      <span className="font-medium text-surface-700">{selectedDemo.role}</span> · {selectedDemo.description}
                      <br />
                      <span className="font-mono">{selectedDemo.email}</span>
                    </>
                  ) : (
                    <>Pick an account to fill the form</>
                  )}
                </p>
                <p className="text-center text-xs text-surface-400">
                  Password for all:{' '}
                  <code className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-surface-700">password123</code>
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-10 px-5 py-5 text-center text-xs text-surface-400 sm:px-8 lg:px-12 lg:text-left">
        © {new Date().getFullYear()} {env.appName} · v{env.appVersion}
      </footer>
    </div>
  );
}
