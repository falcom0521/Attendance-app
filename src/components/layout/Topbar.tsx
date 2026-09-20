import { Menu, ChevronDown, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isSuperAdminRole, ROLE_LABELS } from '@/config/permissions';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface TopbarProps {
  contextLabel?: React.ReactNode;
}

export function Topbar({ contextLabel }: TopbarProps) {
  const { user, logout } = useAuth();
  const { setMobileSidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const profilePath = isSuperAdminRole(user?.role) ? '/super-admin/profile' : user?.role === 'ADMIN' ? '/admin/profile' : '/hr/profile';

  return (
    <header className="h-[60px] bg-card border-b border-surface-200 flex items-center justify-between px-4 gap-4 flex-shrink-0">
      {/* Left: mobile hamburger + context label */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {contextLabel && contextLabel}
      </div>

      {/* Right: theme toggle + profile */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg hover:bg-surface-100 transition-colors"
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            <Avatar
              name={user ? `${user.firstName} ${user.lastName}` : 'User'}
              size="sm"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-surface-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-2xs text-surface-400 leading-tight">
                {user ? ROLE_LABELS[user.role] : ''}
              </p>
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 text-surface-400 transition-transform', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-card rounded-xl shadow-soft-lg border border-surface-100 z-50 py-1 animate-fade-in">
              <div className="px-4 py-3 border-b border-surface-100">
                <p className="text-sm font-semibold text-surface-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-surface-500">{user?.email}</p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); navigate(profilePath); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
              >
                <User className="h-4 w-4 text-surface-400" />
                My Profile
              </button>
              <div className="border-t border-surface-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
