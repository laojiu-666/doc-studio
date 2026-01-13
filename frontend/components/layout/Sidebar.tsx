'use client';

import { FileText, Presentation, ChevronLeft, ChevronRight, Settings, LogOut } from 'lucide-react';
import { useWorkspaceStore, MENU_ITEMS, MenuType } from '@/lib/stores/workspace';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';

const MENU_ICONS: Record<MenuType, React.ReactNode> = {
  word: <FileText className="w-5 h-5" />,
  ppt: <Presentation className="w-5 h-5" />,
};

interface SidebarProps {
  onLogout?: () => void;
  userEmail?: string;
}

export default function Sidebar({ onLogout, userEmail }: SidebarProps) {
  const { activeMenu, setActiveMenu, sidebarCollapsed, toggleSidebar } = useWorkspaceStore();
  const { t } = useTranslation();

  return (
    <aside
      className={`
        flex flex-col h-full bg-background border-r border-border
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-bold">Doc Studio</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-secondary rounded-lg transition"
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2 space-y-1">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-colors duration-200
              ${activeMenu === item.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-secondary text-foreground'
              }
            `}
            title={sidebarCollapsed ? item.label : undefined}
          >
            {MENU_ICONS[item.id]}
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-border space-y-1">
        {/* User Info */}
        {userEmail && !sidebarCollapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {userEmail}
          </div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg
            hover:bg-secondary transition-colors
          `}
          title={sidebarCollapsed ? t('common.settings') : undefined}
        >
          <Settings className="w-5 h-5" />
          {!sidebarCollapsed && (
            <span className="text-sm">{t('common.settings')}</span>
          )}
        </Link>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg
              hover:bg-secondary transition-colors text-destructive
            `}
            title={sidebarCollapsed ? t('common.logout') : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && (
              <span className="text-sm">{t('common.logout')}</span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
