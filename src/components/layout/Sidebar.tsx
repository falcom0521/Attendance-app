import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, GitBranch, Monitor, Users, ScrollText,
  Clock, FileBarChart, UserCog, Settings, Timer, CalendarDays, SlidersHorizontal,
  ClipboardCheck, CalendarOff,
  ChevronDown, ChevronRight, X, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config/navigation';
import { useUIStore } from '@/store/uiStore';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, GitBranch, Monitor, Users, ScrollText,
  Clock, FileBarChart, UserCog, Settings, Timer, CalendarDays, SlidersHorizontal,
  ClipboardCheck, CalendarOff,
};

interface SidebarProps {
  navItems: NavItem[];
  brandName?: string;
  roleName?: string;
}

function NavItemComponent({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const [open, setOpen] = useState(() =>
    item.children?.some((c) => location.pathname.startsWith(c.path)) ?? false
  );

  const Icon = ICON_MAP[item.icon];
  const isActive = location.pathname === item.path ||
    (item.children ? item.children.some((c) => location.pathname.startsWith(c.path)) : location.pathname.startsWith(item.path));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'sidebar-link w-full',
            isActive && 'sidebar-link-active'
          )}
        >
          {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </>
          )}
        </button>
        {!collapsed && open && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-surface-100 pl-3">
            {item.children.map((child) => {
              const ChildIcon = ICON_MAP[child.icon];
              return (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive: a }) =>
                    cn('sidebar-link text-[13px]', a && 'sidebar-link-active')
                  }
                >
                  {ChildIcon && <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                  {child.label}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive: a }) =>
        cn('sidebar-link', a && 'sidebar-link-active')
      }
      title={collapsed ? item.label : undefined}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar({ navItems, brandName = 'AttendanceIQ', roleName }: SidebarProps) {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, toggleSidebar } = useUIStore();

  const content = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-surface-100', sidebarCollapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Clock className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-surface-900 truncate">{brandName}</p>
            {roleName && <p className="text-2xs text-surface-400 font-medium">{roleName}</p>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavItemComponent key={item.path} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* Footer: collapse toggle + copyright */}
      <div className={cn(
        'border-t border-surface-100 flex-shrink-0',
        sidebarCollapsed ? 'px-2 py-3 flex justify-center' : 'px-3 py-3'
      )}>
        {/* Desktop collapse button */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center gap-2 w-full rounded-lg px-2 py-2 text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <PanelLeft className="h-4 w-4 flex-shrink-0" />
            : (
              <>
                <PanelLeftClose className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )
          }
        </button>
        {!sidebarCollapsed && (
          <p className="text-2xs text-surface-300 mt-1 px-2">© 2026 AttendanceIQ</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-card border-r border-surface-200 flex-shrink-0 transition-all duration-200',
          sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
        )}
        aria-label="Sidebar"
      >
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-[260px] bg-card shadow-soft-xl animate-slide-in-left">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
