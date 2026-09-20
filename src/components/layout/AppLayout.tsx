import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import type { NavItem } from '@/config/navigation';

interface AppLayoutProps {
  navItems: NavItem[];
  roleName: string;
  contextLabel?: React.ReactNode;
}

export function AppLayout({ navItems, roleName, contextLabel }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar navItems={navItems} roleName={roleName} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar contextLabel={contextLabel} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
