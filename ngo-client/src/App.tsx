import React, { useState, useEffect } from "react";
import {
  User,
  NGO,
  Complaint,
  Volunteer,
  AnalyticsSummary,
  DogProfile,
  NGOView,
  Notification
} from "./types";
import { api } from "./api/client";
import { getSocket } from "./api/socket";

// NGO Components
import { NGOHome } from "./components/ngo/NGOHome";
import { ComplaintManagement } from "./components/ngo/ComplaintManagement";
import { ComplaintDetailModal } from "./components/ngo/ComplaintDetailModal";
import { VolunteerManagement } from "./components/ngo/VolunteerManagement";
import { AnalyticsView } from "./components/ngo/AnalyticsView";
import { NGOSettingsModal } from "./components/ngo/NGOSettingsModal";
import { NGODogRegistry } from "./components/ngo/NGODogRegistry";
import { GovernmentAnalyticsView } from "./components/ngo/GovernmentAnalyticsView";
import { NGODispatchMap } from "./components/maps/NGODispatchMap";
import { DogProfileModal } from "./components/dogs/DogProfileModal";
import { NotificationDrawer } from "./components/common/NotificationDrawer";
import { AuthModal } from "./components/common/AuthModal";
import { NGOProfile } from "./components/ngo/NGOProfile";

// Dedicated NGO Pages & Context
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Profile } from "./pages/Profile";
import { useNgoAuth } from "./context/NgoAuthContext";

export const App: React.FC = () => {
  const { user: authUser, ngo: authNgo, logout: authLogout, setNgo } = useNgoAuth();

  const [currentUser, setCurrentUser] = useState<User | null>(authUser || api.getStoredUser());
  const [activeNgo, setActiveNgo] = useState<NGO | null>(authNgo);
  const [currentTab, setCurrentTab] = useState<NGOView>("overview");
  const [authPage, setAuthPage] = useState<"none" | "login" | "register" | "forgot_password">("none");

  // Keep state in sync with context
  useEffect(() => {
    if (authUser) setCurrentUser(authUser);
    if (authNgo) setActiveNgo(authNgo);
  }, [authUser, authNgo]);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Modals & Drawers
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedDog, setSelectedDog] = useState<DogProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load & Session Check
  useEffect(() => {
    const storedUser = api.getStoredUser();
    if (storedUser && (storedUser.role === "ngo_admin" || storedUser.role === "volunteer")) {
      setCurrentUser(storedUser);
    }

    loadInitialData();
  }, []);

  // Automatic Scroll to Top on every page / tab change
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, [currentTab, authPage]);

  // 2. Real-time Socket Listener for Live NGO Dispatch
  useEffect(() => {
    const socket = getSocket();

    socket.on("complaint_created", (newComplaint: Complaint) => {
      setComplaints((prev) => [newComplaint, ...prev]);
      console.log("🚨 [SOCKET] New Complaint Dispatched to NGO Grid:", newComplaint.trackingId);
    });

    socket.on("complaint_updated", (updatedComplaint: Complaint) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
      );
      if (selectedComplaint && selectedComplaint.id === updatedComplaint.id) {
        setSelectedComplaint(updatedComplaint);
      }
    });

    return () => {
      socket.off("complaint_created");
      socket.off("complaint_updated");
    };
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [ngosRes, complaintsRes, volunteersRes, dogsRes, analyticsRes, notificationsRes] =
        await Promise.allSettled([
          api.getNGOs(),
          api.getComplaints({ limit: 100 }),
          api.getVolunteers(),
          api.getDogs({ limit: 100 }),
          api.getAnalytics(),
          api.getNotifications()
        ]);

      if (ngosRes.status === "fulfilled" && ngosRes.value.ngos.length > 0) {
        const primaryNgo = ngosRes.value.ngos[0];
        setActiveNgo(primaryNgo);

        if (!api.getStoredUser()) {
          const defaultAdminUser: User = {
            id: "ngo-admin-demo",
            name: `${primaryNgo.name} Admin`,
            email: primaryNgo.email,
            phone: primaryNgo.phone,
            role: "ngo_admin",
            ngoId: primaryNgo.id,
            isVerified: true,
            createdAt: new Date().toISOString()
          };
          setCurrentUser(defaultAdminUser);
        }
      }

      if (complaintsRes.status === "fulfilled") {
        setComplaints(complaintsRes.value.complaints || []);
      }

      if (volunteersRes.status === "fulfilled") {
        setVolunteers(volunteersRes.value.volunteers || []);
      }

      if (dogsRes.status === "fulfilled") {
        setDogs(dogsRes.value.dogs || []);
      }

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value);
      }

      if (notificationsRes.status === "fulfilled") {
        setNotifications(notificationsRes.value.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load NGO platform data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Full-page Auth routes
  if (authPage === "login") {
    return (
      <Login
        onNavigateRegister={() => setAuthPage("register")}
        onNavigateForgotPassword={() => setAuthPage("forgot_password")}
        onSuccess={() => {
          setAuthPage("none");
          loadInitialData();
        }}
      />
    );
  }

  if (authPage === "register") {
    return (
      <Register
        onNavigateLogin={() => setAuthPage("login")}
        onSuccess={() => {
          setAuthPage("none");
          loadInitialData();
        }}
      />
    );
  }

  if (authPage === "forgot_password") {
    return (
      <ForgotPassword
        onNavigateLogin={() => setAuthPage("login")}
        onSuccess={() => {
          setAuthPage("login");
        }}
      />
    );
  }

  const handleLogout = () => {
    authLogout();
    api.logout();
    setCurrentUser(null);
    setActiveNgo(null);
    setAuthPage("login");
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const criticalComplaintsCount = complaints.filter(
    (c) => c.priority === "Critical" && c.status !== "Resolved" && c.status !== "Closed"
  ).length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top NGO Control Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        {/* Left: Brand & Shelter Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <span className="material-symbols-outlined !text-2xl">local_hospital</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">
                  PawConnect
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-extrabold uppercase">
                  NGO Command HQ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {activeNgo ? `${activeNgo.name} • ${activeNgo.city}` : "National NGO Dispatch Grid"}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Quick Live Tickers */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">Grid Status:</span>
            <span className="text-emerald-400 font-bold">24x7 Ambulance Active</span>
          </div>

          {criticalComplaintsCount > 0 && (
            <div className="flex items-center gap-2 bg-red-950/70 px-3.5 py-1.5 rounded-xl border border-red-800/80 text-red-300 animate-pulse">
              <span className="material-symbols-outlined !text-base text-red-400">emergency</span>
              <span className="font-bold">{criticalComplaintsCount} Critical SOS Rescues</span>
            </div>
          )}
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Real-Time Dispatch Notifications"
          >
            <span className="material-symbols-outlined !text-xl">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Shelter Settings & Radius Zones"
          >
            <span className="material-symbols-outlined !text-xl">tune</span>
          </button>

          {/* User Account / Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => setCurrentTab("profile")}
                className="hidden sm:block text-right hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-bold text-white block">{currentUser.name}</span>
                <span className="text-[10px] text-emerald-400 uppercase font-mono">
                  {currentUser.role === "ngo_admin" ? "Triage Officer" : "Field Rescuer"} • Profile
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 transition-colors"
                title="Logout"
              >
                <span className="material-symbols-outlined !text-xl">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthPage("register")}
                className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Register NGO
              </button>
              <button
                onClick={() => setAuthPage("login")}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all"
              >
                Sign In NGO
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-2 overflow-x-auto flex items-center gap-2 no-scrollbar">
        {[
          { id: "overview" as NGOView, icon: "dashboard", label: "Overview & Triage" },
          { id: "complaints" as NGOView, icon: "assignment", label: `Rescues & Cases (${complaints.length})` },
          { id: "maps" as NGOView, icon: "map", label: "Live Dispatch Map" },
          { id: "dogs" as NGOView, icon: "pets", label: `National Dog Registry (${dogs.length})` },
          { id: "volunteers" as NGOView, icon: "group", label: `Volunteers (${volunteers.length})` },
          { id: "analytics" as NGOView, icon: "analytics", label: "Rescue Analytics" },
          { id: "gov_analytics" as NGOView, icon: "bar_chart", label: "Municipal ARV/ABC Heatmap" },
          { id: "profile" as NGOView, icon: "domain", label: "NGO Profile" }
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              <span className="material-symbols-outlined !text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-400">
              Synchronizing with National NGO Dispatch Grid...
            </p>
          </div>
        ) : (
          <>
            {currentTab === "overview" && (
              <NGOHome
                ngo={activeNgo}
                analytics={analytics}
                complaints={complaints}
                volunteers={volunteers}
                onOpenComplaintModal={(complaint) => setSelectedComplaint(complaint)}
                onNavigateTab={(tab) => setCurrentTab(tab as NGOView)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}

            {currentTab === "complaints" && (
              <ComplaintManagement
                complaints={complaints}
                volunteers={volunteers}
                onOpenComplaintModal={(complaint) => setSelectedComplaint(complaint)}
                onRefreshComplaints={loadInitialData}
              />
            )}

            {currentTab === "maps" && (
              <NGODispatchMap
                ngo={activeNgo}
                complaints={complaints}
                selectedComplaint={selectedComplaint}
                onSelectComplaint={(complaint) => setSelectedComplaint(complaint)}
                onOpenComplaintModal={(complaint) => setSelectedComplaint(complaint)}
              />
            )}

            {currentTab === "dogs" && (
              <NGODogRegistry
                dogs={dogs}
                user={currentUser}
                ngo={activeNgo}
                onSelectDog={(dog) => setSelectedDog(dog)}
                onRefreshDogs={loadInitialData}
              />
            )}

            {currentTab === "volunteers" && (
              <VolunteerManagement
                volunteers={volunteers}
                onRefresh={loadInitialData}
              />
            )}

            {currentTab === "analytics" && (
              <AnalyticsView analytics={analytics} complaints={complaints} />
            )}

            {currentTab === "gov_analytics" && <GovernmentAnalyticsView />}

            {currentTab === "profile" && (
              <NGOProfile
                user={currentUser}
                ngo={activeNgo}
                complaints={complaints}
                onUpdateNGO={(updatedNgo) => setActiveNgo(updatedNgo)}
                onSelectComplaint={(complaint) => setSelectedComplaint(complaint)}
              />
            )}
          </>
        )}
      </main>

      {/* Modals & Drawers */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          volunteers={volunteers}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={(updatedComplaint) => {
            setComplaints((prev) =>
              prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
            );
            setSelectedComplaint(updatedComplaint);
          }}
        />
      )}

      {selectedDog && (
        <DogProfileModal
          dog={selectedDog}
          user={currentUser}
          isOpen={Boolean(selectedDog)}
          onClose={() => setSelectedDog(null)}
          onUpdated={(updatedDog: DogProfile) => {
            setDogs((prev) =>
              prev.map((d) => (d.id === updatedDog.id ? updatedDog : d))
            );
            setSelectedDog(updatedDog);
          }}
        />
      )}

      {isSettingsOpen && activeNgo && (
        <NGOSettingsModal
          ngo={activeNgo}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdated={(updatedNgo: NGO) => setActiveNgo(updatedNgo)}
        />
      )}

      {isNotificationsOpen && (
        <NotificationDrawer
          isOpen={isNotificationsOpen}
          notifications={notifications}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkRead={async (id) => {
            await api.markNotificationRead(id);
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
          }}
          onMarkAllRead={async () => {
            await api.markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          }}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          initialRole="ngo_admin"
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
            loadInitialData();
          }}
        />
      )}
    </div>
  );
};
