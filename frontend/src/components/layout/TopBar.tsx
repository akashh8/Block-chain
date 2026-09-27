import { Bell, Search, Activity, LogOut, ChevronDown, User, Shield, Key } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';
import { useNotificationSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import type { Notification } from '../../types';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.data);
    } catch { /* noop */ }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  useNotificationSocket(handleNewNotification);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch { /* noop */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* noop */ }
  };

  const severityColors: Record<string, string> = {
    info: 'text-gbrc-accent',
    warning: 'text-gbrc-warning',
    critical: 'text-gbrc-slashed',
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-gbrc-card-border bg-gbrc-bg/80 backdrop-blur-xl flex items-center justify-between px-6">
        {/* Search */}
        <div className="relative w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gbrc-text-dim" />
          <input
            type="text"
            placeholder="Search nodes, blocks, transactions..."
            className="input-field w-full pl-10 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Pipeline Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gbrc-trusted/10 border border-gbrc-trusted/20">
            <Activity size={14} className="text-gbrc-trusted" />
            <span className="text-xs font-medium text-gbrc-trusted">System Online</span>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => {
              setShowPanel(!showPanel);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
            id="notification-bell"
          >
            <Bell size={20} className="text-gbrc-muted" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-gbrc-slashed text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowPanel(false);
                }}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-gbrc-card-border/40 transition-all duration-200 cursor-pointer"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                />
                <div className="hidden md:flex flex-col text-left shrink-0 max-w-[120px]">
                  <span className="text-xs font-bold text-white truncate leading-tight">{user.name}</span>
                  <span className="text-[9px] text-gbrc-text-dim uppercase font-bold tracking-wider truncate mt-0.5">{user.role}</span>
                </div>
                <ChevronDown size={14} className="text-gbrc-muted shrink-0" />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-64 glass-card p-2 rounded-xl shadow-2xl shadow-black/60 border border-gbrc-card-border/55 animate-slide-in animate-fade-in">
                    <div className="p-3 border-b border-gbrc-card-border/30 mb-2">
                      <p className="text-xs font-bold text-white truncate leading-normal">{user.name}</p>
                      <p className="text-[10px] text-gbrc-text-dim truncate leading-none mt-0.5">{user.email}</p>
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gbrc-accent/15 border border-gbrc-accent/30 text-[9px] font-bold text-gbrc-accent-light uppercase tracking-wider">
                        {user.role}
                      </div>
                    </div>

                    <div className="px-1 py-1 text-[11px] font-bold text-gbrc-text-dim uppercase tracking-wider pl-3 mb-1">
                      Organization
                    </div>
                    <div className="px-3 py-1.5 text-xs text-gbrc-text font-medium truncate bg-white/[0.02] border border-gbrc-card-border/30 rounded-lg mx-1 mb-3">
                      {user.organization || 'Apex BioLabs'}
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gbrc-slashed hover:bg-gbrc-slashed/15 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out from Node</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Notification Panel */}
      {showPanel && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setShowPanel(false)}
          />
          <div className="fixed right-4 top-16 z-50 w-96 max-h-[70vh] glass-card rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-slide-in">
            <div className="p-4 border-b border-gbrc-card-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-gbrc-accent hover:text-gbrc-accent-light transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-56px)]">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-gbrc-text-dim text-sm">No notifications</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div
                    key={n._id}
                    onClick={() => !n.read && handleMarkRead(n._id)}
                    className={`p-4 border-b border-gbrc-card-border/50 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                      !n.read ? 'bg-gbrc-accent/[0.03]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!n.read && (
                        <div className="mt-1.5 pulse-dot bg-gbrc-accent" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${severityColors[n.severity] || 'text-gbrc-muted'}`}>
                          {n.type}
                        </p>
                        <p className="text-sm text-gbrc-text leading-relaxed">{n.message}</p>
                        <p className="text-xs text-gbrc-text-dim mt-1">
                          {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
