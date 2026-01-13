'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface WorkspaceLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
  userEmail?: string;
}

export default function WorkspaceLayout({
  children,
  onLogout,
  userEmail,
}: WorkspaceLayoutProps) {
  const { sidebarCollapsed } = useWorkspaceStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <Sidebar onLogout={onLogout} userEmail={userEmail} />

      {/* Main Content Area */}
      <main
        className={`
          flex-1 flex overflow-hidden
          transition-all duration-300 ease-in-out
        `}
      >
        {children}
      </main>
    </div>
  );
}
