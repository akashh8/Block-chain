import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Blocks, Network, ShieldCheck,
  AlertTriangle, BarChart3, Package, Warehouse,
  Bell, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
  { path: '/blockchain', label: 'Blockchain Explorer', icon: Blocks },
  { path: '/network', label: 'Network Graph', icon: Network },
  { path: '/reputation', label: 'Reputation', icon: ShieldCheck },
  { path: '/malicious', label: 'Malicious Nodes', icon: AlertTriangle },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/recall', label: 'Drug Recall', icon: Package },
  { path: '/inventory', label: 'Inventory', icon: Warehouse },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gbrc-bg-light border-r border-gbrc-card-border z-50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gbrc-card-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gbrc-accent to-gbrc-cyan flex items-center justify-center text-white font-bold text-lg shrink-0">
          G
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-white tracking-tight">GBRC</h1>
            <p className="text-xs text-gbrc-text-dim -mt-0.5">Pharma Chain Security</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User profile details at bottom */}
      {user && (
        <div className={`p-4 border-t border-gbrc-card-border/50 flex items-center gap-3 bg-white/[0.01] ${collapsed ? 'justify-center' : ''}`}>
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10 shrink-0 shadow-md"
            title={collapsed ? `${user.name} (${user.role})` : undefined}
          />
          {!collapsed && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <h4 className="text-xs font-bold text-white truncate leading-tight">{user.name}</h4>
              <p className="text-[9px] text-gbrc-accent-light font-extrabold uppercase tracking-wider truncate mt-0.5">{user.role}</p>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-3 border-t border-gbrc-card-border/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-gbrc-text-dim hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
