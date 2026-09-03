import React, { useState, useEffect } from "react";
import { api } from "./api/client";
import { initClientSocket, getClientSocket } from "./api/socket";
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
  const [trackingTargetId, setTrackingTargetId] = useState<string>("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notifsDrawerOpen, setNotifsDrawerOpen] = useState(false);
  const [successReport, setSuccessReport] = useState<Complaint | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 4500);
  };

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
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] text-slate-900 font-['Inter',sans-serif]">
      {/* Real-time Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 max-w-sm animate-slideLeft">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined !text-base">notifications_active</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{toastMessage.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-auto"
          >
            <span className="material-symbols-outlined !text-sm">close</span>
          </button>
        </div>
      )}

      {/* Top Header & Portal Bar */}
      <TopNav
        user={user}
        activePortal={activePortal}
        citizenView={citizenView}
        ngoView={ngoView}
        unreadNotifsCount={unreadNotifsCount}
        onSwitchPortal={handleSwitchPortal}
        onNavigateCitizen={(view) => {
          setActivePortal("citizen");
          setCitizenView(view);
        }}
        onNavigateNGO={(view) => {
          setActivePortal("ngo");
          setNgoView(view);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenNotifications={() => setNotifsDrawerOpen(true)}
        onLogout={handleLogout}
        onEmergencyReport={() => {
          setActivePortal("citizen");
          setCitizenView("report");
        }}
      />

      {/* Main View Render */}
      <main className="flex-1">
        {activePortal === "citizen" ? (
          <>
            {citizenView === "landing" && (
              <LandingPage
                ngos={ngos}
                recentComplaints={complaints}
                onStartReport={handleStartReport}
                onTrackClick={handleTrackClick}
                onViewAllReports={() => setCitizenView("dashboard")}
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
                analytics={analytics}
                complaints={complaints}
                volunteers={volunteers}
                onOpenComplaintModal={(c) => setInspectComplaint(c)}
                onNavigateTab={(tab) => setNgoView(tab as NGOView)}
              />
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
                Rescue teams in your area have received the photo evidence and GPS coordinates.
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-orange-900 uppercase">
                Your Public Tracking ID
              </span>
              <div className="text-2xl font-mono font-extrabold text-orange-600 tracking-wider">
                {successReport.trackingId}
              </div>
              <p className="text-[10px] text-orange-700">
                Save or screenshot this ID to monitor ambulance arrival.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  const id = successReport.trackingId;
                  setSuccessReport(null);
                  handleSelectComplaintForTracking(id);
                }}
                className="w-full py-3 bg-[#f97316] hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
              >
                Track Live Progress Now →
              </button>
              <button
                onClick={() => {
                  setSuccessReport(null);
                  setCitizenView("landing");
                }}
                className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
