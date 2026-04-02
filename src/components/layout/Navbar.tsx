import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Rocket, LayoutDashboard, Upload, GitBranch, LogOut, ChevronDown,
  Bell, User, Settings, BarChart2, Users, Menu, X,
  CheckCircle, AlertCircle, Info, AlertTriangle, UserPlus, Check,
} from "lucide-react";
import { User as UserType } from "@/types";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useSettings } from "@/contexts/SettingsContext";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface NavbarProps {
  user: UserType;
  onLogout: () => void;
  onAdminOpen?: () => void;
}

const notifIcon = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  team: UserPlus,
};

const notifColor = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-blue-400",
  warning: "text-orange-400",
  team: "text-purple-400",
};

export default function Navbar({ user, onLogout, onAdminOpen }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useSettings();
  const T = (key: Parameters<typeof t>[1]) => t(language, key);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoTimer, setLogoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user.id);

  const navItems = [
    { label: T("dashboard"), icon: LayoutDashboard, path: "/dashboard" },
    { label: T("analytics"),  icon: BarChart2,       path: "/analytics" },
    { label: T("upload"),     icon: Upload,           path: "/upload" },
    { label: T("github"),     icon: GitBranch,        path: "/github" },
    { label: T("team"),       icon: Users,            path: "/team" },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) await markRead(notif.id);
    if (notif.project_id) navigate("/dashboard");
    else if (notif.type === "team") navigate("/team");
    setNotifOpen(false);
  };

  // Secret 21-tap logo handler
  const handleLogoClick = useCallback(() => {
    setLogoClickCount((prev) => {
      const next = prev + 1;
      if (next >= 21) {
        if (logoTimer) clearTimeout(logoTimer);
        setLogoTimer(null);
        if (onAdminOpen) onAdminOpen();
        return 0;
      }
      // Reset counter after 3 seconds of inactivity
      if (logoTimer) clearTimeout(logoTimer);
      const timer = setTimeout(() => setLogoClickCount(0), 3000);
      setLogoTimer(timer);
      return next;
    });
  }, [logoTimer, onAdminOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo — 21-tap secret */}
            <button onClick={handleLogoClick} className="flex items-center gap-2.5 group select-none">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text hidden sm:inline">AppDeployer</span>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button key={item.path} onClick={() => handleNav(item.path)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                    <item.icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-1.5">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-blue-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                    <div className="absolute end-0 top-full mt-2 w-80 glass-strong rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in z-20">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-blue-400" />
                          <span className="font-semibold text-sm">{T("notifications")}</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">{unreadCount}</span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <Check className="w-3 h-3" /> {T("markAllRead")}
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                            <p className="text-sm text-muted-foreground">{T("noNotifications")}</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const Icon = notifIcon[notif.type];
                            const color = notifColor[notif.type];
                            return (
                              <button key={notif.id} onClick={() => handleNotifClick(notif)}
                                className={cn(
                                  "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                                  !notif.read && "bg-blue-500/3"
                                )}>
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                  !notif.read ? "bg-white/8" : "bg-white/4")}>
                                  <Icon className={cn("w-4 h-4", color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn("text-xs font-semibold", !notif.read ? "text-foreground" : "text-muted-foreground")}>
                                      {notif.title}
                                    </p>
                                    {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-1">{formatRelativeTime(notif.created_at)}</p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative hidden md:block">
                <button onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium leading-none">{user.name}</div>
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute end-0 top-full mt-2 w-52 glass-strong rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in z-20">
                      <div className="p-3 border-b border-white/8">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="p-1">
                        <button onClick={() => handleNav("/settings")}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors text-left">
                          <User className="w-4 h-4 text-muted-foreground" />{T("profile")}
                        </button>
                        <button onClick={() => handleNav("/settings")}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors text-left">
                          <Settings className="w-4 h-4 text-muted-foreground" />{T("settings")}
                        </button>
                        <button onClick={onLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-red-500/10 text-red-400 transition-colors text-left">
                          <LogOut className="w-4 h-4" />{T("signOut")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-16 start-0 end-0 glass-strong border-b border-white/10 animate-fade-in">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            <div className="p-3 space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button key={item.path} onClick={() => handleNav(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                      active
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                    <item.icon className="w-4 h-4" />{item.label}
                  </button>
                );
              })}
              <button onClick={() => handleNav("/settings")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-left">
                <Settings className="w-4 h-4" />{T("settings")}
              </button>
            </div>
            <div className="p-3 pt-0 border-t border-white/8 mt-1">
              <button onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all text-left">
                <LogOut className="w-4 h-4" />{T("signOut")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
