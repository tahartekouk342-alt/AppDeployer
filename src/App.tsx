import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useNotifications } from "@/hooks/useNotifications";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Navbar from "@/components/layout/Navbar";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import UploadPage from "@/pages/UploadPage";
import GithubPage from "@/pages/GithubPage";
import ApkDownload from "@/pages/ApkDownload";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import TeamPage from "@/pages/TeamPage";
import AdminPanel from "@/pages/AdminPanel";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import { useNavigate } from "react-router-dom";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading, login, register, logout, sendOtp, verifyOtpAndSetPassword } = useAuth();
  const { projects, addProject, deleteProject, updateProject } = useProjects(user?.id);
  const { addNotification } = useNotifications(user?.id);
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <div className="text-sm text-muted-foreground animate-pulse">Loading AppDeployer...</div>
        </div>
      </div>
    );
  }

  const handleUpdateDomain = async (id: string, domain: string) => {
    await updateProject(id, { custom_domain: domain || undefined });
  };

  const handleNotify = async (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    await addNotification({ title, message, type });
  };

  return (
    <>
      {user && (
        <Navbar
          user={user}
          onLogout={logout}
          onAdminOpen={() => setAdminOpen(true)}
        />
      )}

      {/* Admin Panel — secret access only */}
      {adminOpen && user && (
        <AdminPanel onClose={() => setAdminOpen(false)} />
      )}

      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/auth"
          element={
            user ? <Navigate to="/dashboard" replace /> : (
              <AuthPage
                onLogin={login}
                onRegister={register}
                sendOtp={sendOtp}
                verifyOtpAndSetPassword={verifyOtpAndSetPassword}
              />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard
                user={user}
                projects={projects}
                onDelete={deleteProject}
                onNavigateUpload={() => navigate("/upload")}
                onUpdateDomain={handleUpdateDomain}
                onProjectUpdate={updateProject}
              />
            ) : <Navigate to="/auth" replace />
          }
        />
        <Route
          path="/upload"
          element={
            user ? (
              <UploadPage userId={user.id} onProjectAdded={addProject} onNotify={handleNotify} />
            ) : <Navigate to="/auth" replace />
          }
        />
        <Route
          path="/github"
          element={user ? <GithubPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/analytics"
          element={user ? <Analytics projects={projects} /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/settings"
          element={user ? <Settings user={user} onLogout={logout} /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/team"
          element={user ? <TeamPage userId={user.id} /> : <Navigate to="/auth" replace />}
        />
        <Route path="/download/:id" element={<ApkDownload projects={projects} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
