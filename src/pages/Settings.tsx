import { useState } from "react";
import {
  User, Mail, Lock, Bell, Trash2, Save,
  CheckCircle, Shield, Globe, Loader2,
  Sun, Moon, Languages, LogOut,
} from "lucide-react";
import { User as UserType } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/contexts/SettingsContext";
import { t } from "@/lib/i18n";
import { useEffect } from "react";

interface SettingsProps {
  user: UserType;
  onLogout: () => void;
}

interface NotifPrefs {
  deployments: boolean;
  security: boolean;
  team: boolean;
  updates: boolean;
}

export default function Settings({ user, onLogout }: SettingsProps) {
  const { theme, language, updateSettings } = useSettings();
  const T = (key: Parameters<typeof t>[1]) => t(language, key);

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "appearance">("profile");
  const [displayName, setDisplayName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    deployments: true, security: true, team: true, updates: false,
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [pendingTheme, setPendingTheme] = useState(theme);
  const [pendingLang, setPendingLang] = useState(language);

  useEffect(() => {
    setPendingTheme(theme);
    setPendingLang(language);
  }, [theme, language]);

  useEffect(() => {
    supabase
      .from("user_profiles")
      .select("notification_prefs, display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.notification_prefs) setNotifPrefs(data.notification_prefs as NotifPrefs);
        if (data?.display_name) setDisplayName(data.display_name);
        setLoadingPrefs(false);
      });
  }, [user.id]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);

    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) { toast.error("Failed to update email: " + emailError.message); setSaving(false); return; }
      toast.success("Verification email sent to your new address");
    }
    if (profileError) toast.error("Failed to update profile");
    else toast.success(T("saveChanges") + " ✓");
    setSaving(false);
  };

  const handleSavePassword = async () => {
    if (!newPass || !confirmPass) { toast.error("Please fill in all password fields"); return; }
    if (newPass !== confirmPass) { toast.error("Passwords do not match"); return; }
    if (newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSavingPass(false);
    if (error) toast.error(error.message);
    else { setNewPass(""); setConfirmPass(""); toast.success("Password changed!"); }
  };

  const handleSaveNotifications = async () => {
    const { error } = await supabase.from("user_profiles").update({ notification_prefs: notifPrefs }).eq("id", user.id);
    if (error) toast.error("Failed to save preferences");
    else toast.success(T("savePreferences") + " ✓");
  };

  const handleApplyAppearance = () => {
    updateSettings({ theme: pendingTheme, language: pendingLang });
    toast.success(language === "ar" ? "تم تطبيق الإعدادات ✓" : "Settings applied! ✓");
  };

  const tabs = [
    { id: "profile" as const,       label: T("profileTab"),       icon: User },
    { id: "security" as const,      label: T("securityTab"),      icon: Lock },
    { id: "notifications" as const, label: T("notificationsTab"), icon: Bell },
    { id: "appearance" as const,    label: T("appearanceTab"),    icon: Globe },
  ];

  const notifItems: { key: keyof NotifPrefs; labelKey: Parameters<typeof t>[1]; descKey: Parameters<typeof t>[1] }[] = [
    { key: "deployments", labelKey: "deploymentUpdates",    descKey: "deploymentUpdatesDesc" },
    { key: "security",    labelKey: "securityAlerts",       descKey: "securityAlertsDesc" },
    { key: "team",        labelKey: "teamInvitations",      descKey: "teamInvitationsDesc" },
    { key: "updates",     labelKey: "productUpdates",       descKey: "productUpdatesDesc" },
  ];

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1">{T("settingsTitle")}</h1>
          <p className="text-muted-foreground text-sm">{T("settingsSubtitle")}</p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-4 gap-6">
          {/* Sidebar — collapses to horizontal tabs on mobile */}
          <div className="md:col-span-1 animate-fade-in">
            <div className="glass rounded-2xl border border-white/5 p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    "text-start flex-shrink-0",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}>
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
              <div className="hidden md:block pt-2 mt-2 border-t border-white/5">
                <button onClick={onLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all text-start">
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  {T("signOut")}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3 space-y-5 animate-fade-in">

            {/* ── Profile Tab ── */}
            {activeTab === "profile" && (
              <>
                <div className="glass rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-lg truncate">{displayName || user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl border border-white/5 p-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    {T("personalInfo")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{T("displayName")}</label>
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                        <Mail className="w-3 h-3 inline me-1" />{T("emailAddress")}
                      </label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all" />
                      {email !== user.email && (
                        <p className="text-xs text-orange-400 mt-1">A verification email will be sent to confirm this change.</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                        <Globe className="w-3 h-3 inline me-1" />{T("username")} (read-only)
                      </label>
                      <input type="text" value={user.name} readOnly
                        className="w-full bg-white/3 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
                    </div>
                    <button onClick={handleSaveProfile} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? T("saving") : T("saveChanges")}
                    </button>
                  </div>
                </div>

                <div className="glass rounded-2xl border border-red-500/20 p-5">
                  <h3 className="font-semibold text-sm mb-1 text-red-400 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />{T("dangerZone")}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">{T("deleteAccountDesc")}</p>
                  <button onClick={() => toast.error("Please contact support to delete your account")}
                    className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
                    {T("deleteAccount")}
                  </button>
                </div>
              </>
            )}

            {/* ── Security Tab ── */}
            {activeTab === "security" && (
              <>
                <div className="glass rounded-2xl border border-white/5 p-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" />{T("changePassword")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{T("newPassword")}</label>
                      <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{T("confirmPassword")}</label>
                      <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground" />
                    </div>
                    <button onClick={handleSavePassword} disabled={savingPass}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all">
                      {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      {savingPass ? T("saving") : T("updatePassword")}
                    </button>
                  </div>
                </div>
                <div className="glass rounded-2xl border border-white/5 p-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />{T("twoFactor")}
                  </h3>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-medium">{T("twoFactor")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{T("twoFactorDesc")}</p>
                    </div>
                    <button onClick={() => toast.success("2FA setup initiated")}
                      className="px-4 py-2 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors">
                      {T("enable2FA")}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Notifications Tab ── */}
            {activeTab === "notifications" && (
              <div className="glass rounded-2xl border border-white/5 p-5">
                <h3 className="font-semibold text-sm mb-5 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />{T("inAppNotifications")}
                </h3>
                {loadingPrefs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifItems.map((item) => (
                      <div key={item.key} className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{T(item.labelKey)}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{T(item.descKey)}</div>
                        </div>
                        <button
                          onClick={() => setNotifPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={cn(
                            "relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 mt-0.5",
                            notifPrefs[item.key] ? "bg-blue-600" : "bg-white/10"
                          )}>
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300",
                            notifPrefs[item.key] ? "start-6" : "start-1"
                          )} />
                        </button>
                      </div>
                    ))}
                    <button onClick={handleSaveNotifications}
                      className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all">
                      <CheckCircle className="w-4 h-4" />{T("savePreferences")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Appearance Tab ── */}
            {activeTab === "appearance" && (
              <div className="glass rounded-2xl border border-white/5 p-5 space-y-6">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />{T("appearance")}
                </h3>

                {/* Theme */}
                <div>
                  <p className="text-sm font-medium mb-3">{T("theme")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["dark", "light"] as const).map((th) => {
                      const Icon = th === "dark" ? Moon : Sun;
                      const label = th === "dark" ? T("darkMode") : T("lightMode");
                      return (
                        <button key={th} onClick={() => setPendingTheme(th)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all",
                            pendingTheme === th
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-white/10 hover:border-white/20 bg-white/3"
                          )}>
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            th === "dark" ? "bg-slate-800" : "bg-yellow-50 border border-yellow-200/20"
                          )}>
                            <Icon className={cn("w-6 h-6", th === "dark" ? "text-blue-400" : "text-yellow-500")} />
                          </div>
                          <span className="text-sm font-medium">{label}</span>
                          {pendingTheme === th && <CheckCircle className="w-4 h-4 text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Languages className="w-4 h-4 text-purple-400" />{T("language")}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { code: "en" as const, flag: "🇺🇸", label: "English" },
                      { code: "ar" as const, flag: "🇸🇦", label: "العربية" },
                    ]).map((lang) => (
                      <button key={lang.code} onClick={() => setPendingLang(lang.code)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                          pendingLang === lang.code
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 hover:border-white/20 bg-white/3"
                        )}>
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="text-sm font-medium flex-1 text-start">{lang.label}</span>
                        {pendingLang === lang.code && <CheckCircle className="w-4 h-4 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleApplyAppearance}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25">
                  <Save className="w-4 h-4" />{T("applySettings")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
