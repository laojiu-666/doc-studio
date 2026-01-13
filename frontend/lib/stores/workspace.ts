import { create } from 'zustand';

export type MenuType = 'word' | 'ppt';
export type ViewMode = 'chat-focused' | 'split';

export interface Document {
  id: string;
  title: string;
  file_type: string;
  original_filename: string;
  created_at: string;
  updated_at: string;
}

interface WorkspaceState {
  // Layout mode
  viewMode: ViewMode;

  // Current active menu
  activeMenu: MenuType | null;

  // Current document being viewed/edited
  currentDocument: Document | null;

  // Sidebar collapsed state
  sidebarCollapsed: boolean;

  // Upload state
  uploading: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setActiveMenu: (menu: MenuType | null) => void;
  setCurrentDocument: (doc: Document | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setUploading: (uploading: boolean) => void;
  reset: () => void;

  // Computed helpers
  isDocumentLoaded: () => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  // Initial state
  viewMode: 'chat-focused',
  activeMenu: null,
  currentDocument: null,
  sidebarCollapsed: false,
  uploading: false,

  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),

  setActiveMenu: (menu) => set({ activeMenu: menu }),

  setCurrentDocument: (doc) =>
    set({
      currentDocument: doc,
      viewMode: doc ? 'split' : 'chat-focused',
    }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setUploading: (uploading) => set({ uploading }),

  reset: () =>
    set({
      viewMode: 'chat-focused',
      activeMenu: null,
      currentDocument: null,
      uploading: false,
    }),

  // Computed helpers
  isDocumentLoaded: () => get().currentDocument !== null,
}));

// Menu configuration
export const MENU_ITEMS: {
  id: MenuType;
  label: string;
  labelEn: string;
  accept: string;
  description: string;
}[] = [
  {
    id: 'word',
    label: 'Word 生成',
    labelEn: 'Word Generator',
    accept: '.doc,.docx',
    description: '上传 Word 文档进行 AI 编辑',
  },
  {
    id: 'ppt',
    label: 'PPT 生成',
    labelEn: 'PPT Generator',
    accept: '.ppt,.pptx',
    description: '上传 PPT 文档进行预览',
  },
];

// Helper to get accepted file types for current menu
export const getAcceptedTypes = (menu: MenuType | null): string => {
  if (!menu) return '';
  const item = MENU_ITEMS.find((m) => m.id === menu);
  return item?.accept || '';
};
