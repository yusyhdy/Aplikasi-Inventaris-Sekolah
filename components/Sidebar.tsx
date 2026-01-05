
import React from 'react';
import { 
  LayoutDashboard, 
  Box, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  School
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  t: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, t }) => {
  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'inventory', label: t.inventory, icon: Box },
    { id: 'lending', label: t.lending, icon: ClipboardList },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col z-50 transition-colors duration-200 border-r border-transparent dark:border-slate-900">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800 dark:border-slate-900">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
          <School className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl text-white tracking-tight">SMK Invent</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 dark:border-slate-900">
        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t.logout}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
