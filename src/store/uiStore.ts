import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  selectedSubCompanyId: string;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSelectedSubCompany: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  selectedSubCompanyId: '',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setSelectedSubCompany: (id) => set({ selectedSubCompanyId: id }),
}));
