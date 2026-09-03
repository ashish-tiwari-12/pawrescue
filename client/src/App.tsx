import React, { useState, useEffect } from "react";
import { api } from "./api/client";
import { initClientSocket } from "./api/socket";
import {
  User,
  PortalType,
  CitizenView,
  NGOView,
  Complaint,
  Volunteer,
  NGO,
  Notification,
  AnalyticsSummary
} from "./types";

// Common Components
import { TopNav } from "./components/common/TopNav";
import { Footer } from "./components/common/Footer";
import { AuthModal } from "./components/common/AuthModal";
import { NotificationDrawer } from "./components/common/NotificationDrawer";

// Citizen Portal Pages
import { LandingPage } from "./components/citizen/LandingPage";
import { ReportIssuePage } from "./components/citizen/ReportIssuePage";
import { TrackComplaintPage } from "./components/citizen/TrackComplaintPage";
import { CitizenDashboard } from "./components/citizen/CitizenDashboard";
import { CitizenProfile } from "./components/citizen/CitizenProfile";

// NGO Dashboard Pages
import { NGOHome } from "./components/ngo/NGOHome";
import { ComplaintManagement } from "./components/ngo/ComplaintManagement";
import { ComplaintDetailModal } from "./components/ngo/ComplaintDetailModal";
import { VolunteerManagement } from "./components/ngo/VolunteerManagement";
import { AnalyticsView } from "./components/ngo/AnalyticsView";
import { NGODispatchMap } from "./components/maps/NGODispatchMap";
import { NGOSettingsModal } from "./components/ngo/NGOSettingsModal";

export default function App() {
  // Authentication & Portal State
  const [user, setUser] = useState<User | null>(api.getStoredUser());
  const [activePortal, setActivePortal] = useState<PortalType>("citizen");
  const [citizenView, setCitizenView] = useState<CitizenView>("landing");
  const [ngoView, setNgoView] = useState<NGOView>("overview");

  // Data Collections
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Selected Items & Modals
  const [inspectComplaint, setInspectComplaint] = useState<Complaint | null>(null);
  const [selectedMapComplaint, setSelectedMapComplaint] = useState<Complaint | null>(null);
  const [trackingTargetId, setTrackingTargetId] = useState<string>("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notifsDrawerOpen, setNotifsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [successReport, setSuccessReport] = useState<Complaint | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Current active NGO for dashboard (from user profile or first NGO in list)
  const currentNgo = ngos.find((n) => n.id === user?.ngoId) || ngos[0] || null;

  // Load initial data
  const loadAllData = async () => {
    try {
      const [cRes, vRes, nRes, aRes] = await Promise.all([
        api.getComplaints({ limit: 100 }),
        api.getVolunteers(),
        api.getNGOs(),
        api.getAnalytics()
      ]);

      setComplaints(cRes.complaints);
      setVolunteers(vRes.volunteers);
      setNgos(nRes.ngos);
      setAnalytics(aRes);
    } catch (err) {
      console.error("Failed to load initial data:", err);
    }

    if (user) {
      try {
        const notifRes = await api.getNotifications();
        setNotifications(notifRes.notifications);
      } catch (err) {
        console.warn("Notifications load error:", err);
      }
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Real-time Socket.io listeners
  useEffect(() => {
    const socket = initClientSocket(user?.id, user?.role);

    socket.on("complaint:created", (data: { complaint: Complaint }) => {
      setComplaints((prev) => {
        if (prev.some((c) => c.id === data.complaint.id || c.trackingId === data.complaint.trackingId)) {
          return prev;
        }
        return [data.complaint, ...prev];
      });
      showToast(
        "🚨 New Complaint Logged!",
        `#${data.complaint.trackingId} reported at ${data.complaint.address}`
      );
    });

    socket.on("complaint:status_updated", (data: { complaint: Complaint }) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === data.complaint.id ? data.complaint : c))
      );
      if (inspectComplaint && inspectComplaint.id === data.complaint.id) {
        setInspectComplaint(data.complaint);
      }
      showToast(
        "Status Update",
        `Complaint #${data.complaint.trackingId} is now "${data.complaint.status}"`
      );
    });

    socket.on("complaint:assigned", (data: { complaint: Complaint; volunteer: Volunteer }) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === data.complaint.id ? data.complaint : c))
      );
      showToast(
        "Volunteer Dispatched",
        `${data.volunteer.name} assigned to #${data.complaint.trackingId}`
      );
    });

    socket.on("notification:new", (data: { notification: Notification }) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === data.notification.id)) return prev;
        return [data.notification, ...prev];
      });
    });

    return () => {
      socket.off("complaint:created");
      socket.off("complaint:status_updated");
      socket.off("complaint:assigned");
      socket.off("notification:new");
    };
  }, [user, inspectComplaint]);

  // Handlers
  const handleSwitchPortal = (portal: PortalType) => {
    setActivePortal(portal);
    if (portal === "ngo") {
      setNgoView("overview");
    } else {
      setCitizenView("landing");
    }
  };

  const handleStartReport = (isEmergency: boolean = false) => {
    setCitizenView("report");
  };

  const handleTrackClick = () => {
    setCitizenView("track");
  };

  const handleComplaintSubmitted = (complaint: Complaint) => {
    setComplaints((prev) => {
      if (prev.some((c) => c.id === complaint.id || c.trackingId === complaint.trackingId)) {
        return prev;
      }
      return [complaint, ...prev];
    });
    setSuccessReport(complaint);
  };

  const handleSelectComplaintForTracking = (trackingId: string) => {
    setTrackingTargetId(trackingId);
    setActivePortal("citizen");
    setCitizenView("track");
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setActivePortal("citizen");
    setCitizenView("landing");
    showToast("Logged Out", "You have been logged out successfully.");
  };

  const handleNGOUpdated = (updatedNgo: NGO) => {
    setNgos((prev) => prev.map((n) => (n.id === updatedNgo.id ? updatedNgo : n)));
    showToast("NGO Settings Updated", "Coverage zone and services saved!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] text-[#131b2e] selection:bg-[#f97316] selection:text-white">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3 max-w-sm animate-slideUp">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined !text-lg">notifications_active</span>
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-white">{toastMessage.title}</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">{toastMessage.desc}</p>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <TopNav
        user={user}
        activePortal={activePortal}
        citizenView={citizenView}
        ngoView={ngoView}
        unreadNotifsCount={notifications.filter((n) => !n.read).length}
        onSwitchPortal={handleSwitchPortal}
        onNavigateCitizen={(view) => setCitizenView(view)}
        onNavigateNGO={(view) => setNgoView(view)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenNotifications={() => setNotifsDrawerOpen(true)}
        onLogout={handleLogout}
        onEmergencyReport={() => {
          setActivePortal("citizen");
          setCitizenView("report");
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activePortal === "citizen" ? (
          /* Citizen Portal Views */
          <>
            {citizenView === "landing" && (
              <LandingPage
                ngos={ngos}
                recentComplaints={complaints}
                onStartReport={handleStartReport}
                onTrackClick={handleTrackClick}
                onViewAllReports={() => {
                  if (user) setCitizenView("dashboard");
                  else setAuthModalOpen(true);
                }}
              />
            )}

            {citizenView === "report" && (
              <ReportIssuePage
                user={user}
                onSuccess={handleComplaintSubmitted}
                onCancel={() => setCitizenView("landing")}
              />
            )}

            {citizenView === "track" && (
              <TrackComplaintPage
                initialTrackingId={trackingTargetId}
                onBack={() => setCitizenView("landing")}
                onNewReport={() => setCitizenView("report")}
              />
            )}

            {citizenView === "dashboard" && user && (
              <CitizenDashboard
                user={user}
                complaints={complaints}
                onNewReport={() => setCitizenView("report")}
                onSelectComplaint={handleSelectComplaintForTracking}
              />
            )}

            {citizenView === "profile" && user && (
              <CitizenProfile
                user={user}
                complaints={complaints}
                onUpdateUser={(updated) => setUser(updated)}
                onSelectComplaint={handleSelectComplaintForTracking}
              />
            )}
          </>
        ) : (
          /* NGO Dashboard Views */
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
            {ngoView === "overview" && (
              <NGOHome
                ngo={currentNgo}
                analytics={analytics}
                complaints={complaints}
                volunteers={volunteers}
                onOpenComplaintModal={(c) => setInspectComplaint(c)}
                onNavigateTab={(tab) => setNgoView(tab as NGOView)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}

            {/* FEATURE 4 & 9: NGO Live Dispatch Map View */}
            {ngoView === "maps" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Live Ambulance Dispatch & Coverage Map
                    </h2>
                    <p className="text-xs text-slate-500">
                      Visualizing active cases, {currentNgo?.coverageRadiusKm || 15} KM operational radius, and direct road routes.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined !text-base text-emerald-600">tune</span>
                    <span>Adjust Coverage Radius</span>
                  </button>
                </div>

                <NGODispatchMap
                  ngo={currentNgo}
                  complaints={complaints}
                  selectedComplaint={selectedMapComplaint}
                  onSelectComplaint={(c) => setSelectedMapComplaint(c)}
                  onOpenComplaintModal={(c) => setInspectComplaint(c)}
                />
              </div>
            )}

            {ngoView === "complaints" && (
              <ComplaintManagement
                complaints={complaints}
                volunteers={volunteers}
                onOpenComplaintModal={(c) => setInspectComplaint(c)}
                onRefreshComplaints={loadAllData}
              />
            )}

            {ngoView === "volunteers" && (
              <VolunteerManagement
                volunteers={volunteers}
                onRefresh={loadAllData}
              />
            )}

            {ngoView === "analytics" && (
              <AnalyticsView
                analytics={analytics}
                complaints={complaints}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          if (loggedUser.role === "ngo_admin") {
            setActivePortal("ngo");
            setNgoView("overview");
          } else {
            setActivePortal("citizen");
            setCitizenView("dashboard");
          }
        }}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={notifsDrawerOpen}
        onClose={() => setNotifsDrawerOpen(false)}
        notifications={notifications}
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
        onSelectComplaint={handleSelectComplaintForTracking}
      />

      {/* NGO Case Inspection Modal */}
      {inspectComplaint && (
        <ComplaintDetailModal
          complaint={inspectComplaint}
          volunteers={volunteers}
          onClose={() => setInspectComplaint(null)}
          onUpdated={(updated) => {
            setComplaints((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
          }}
        />
      )}

      {/* FEATURE 5: NGO Settings & Coverage Zones Modal */}
      {isSettingsOpen && currentNgo && (
        <NGOSettingsModal
          ngo={currentNgo}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdated={handleNGOUpdated}
        />
      )}

      {/* Success Report Creation Modal */}
      {successReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined !text-3xl">task_alt</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                Complaint Registered
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 pt-2">
                Emergency Alert Sent to NGOs!
              </h3>
              <p className="text-xs text-slate-500">
                Your report has been auto-assigned to <strong>{successReport.ngoName || "Noida Animal Shelter"}</strong> based on geolocation and specialty.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Tracking ID</span>
                <span className="font-mono font-bold text-orange-600">
                  #{successReport.trackingId}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Auto-Assigned NGO</span>
                <span className="font-bold text-slate-900">{successReport.ngoName || "Noida Animal Shelter"}</span>
              </div>
              {successReport.distanceKm && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Distance</span>
                  <span className="font-bold text-emerald-700 font-mono">📍 {successReport.distanceKm} KM away</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const id = successReport.trackingId;
                  setSuccessReport(null);
                  handleSelectComplaintForTracking(id);
                }}
                className="flex-1 py-3 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Track Live Status
              </button>
              <button
                onClick={() => setSuccessReport(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
