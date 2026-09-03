import React, { useState } from "react";
import { User, PortalType, CitizenView, NGOView } from "../../types";

interface Props {
  user: User | null;
  activePortal: PortalType;
  citizenView: CitizenView;
  ngoView: NGOView;
  unreadNotifsCount: number;
  onSwitchPortal: (portal: PortalType) => void;
  onNavigateCitizen: (view: CitizenView) => void;
  onNavigateNGO: (view: NGOView) => void;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  onEmergencyReport: () => void;
}

export const TopNav: React.FC<Props> = ({
  user,
  activePortal,
  citizenView,
  ngoView,
  unreadNotifsCount,
  onSwitchPortal,
  onNavigateCitizen,
  onNavigateNGO,
  onOpenAuth,
  onOpenNotifications,
  onLogout,
  onEmergencyReport
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Banner: Domain & Portal Switcher */}
      <div className="bg-slate-900 text-white text-xs px-4 sm:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Network
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-300 font-mono text-[11px]">
            {activePortal === "citizen" ? "citizen.pawconnect.in" : "ngo.pawconnect.in"}
          </span>
        </div>

        {/* Portal Toggle Pill */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => onSwitchPortal("citizen")}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
              activePortal === "citizen"
                ? "bg-[#f97316] text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined !text-[13px]">person</span>
            Citizen Portal
          </button>
          <button
            onClick={() => onSwitchPortal("ngo")}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
              activePortal === "ngo"
                ? "bg-[#006c49] text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined !text-[13px]">medical_services</span>
            NGO Dashboard
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                if (activePortal === "citizen") onNavigateCitizen("landing");
                else onNavigateNGO("overview");
              }}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-[#f97316] flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined !text-2xl">pets</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-orange-600 transition-colors">
                    PawConnect
                  </span>
                  <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                    India
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium -mt-0.5">
                  {activePortal === "citizen" ? "Citizen Rescue Network" : "NGO Dispatch & Admin"}
                </p>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {activePortal === "citizen" ? (
                <>
                  <button
                    onClick={() => onNavigateCitizen("landing")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      citizenView === "landing"
                        ? "text-orange-600 bg-orange-50"
                        : "text-slate-600 hover:text-orange-600 hover:bg-slate-50"
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => onNavigateCitizen("report")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      citizenView === "report"
                        ? "text-orange-600 bg-orange-50"
                        : "text-slate-600 hover:text-orange-600 hover:bg-slate-50"
                    }`}
                  >
                    Report Issue
                  </button>
                  <button
                    onClick={() => onNavigateCitizen("community_dogs")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      citizenView === "community_dogs"
                        ? "text-orange-600 bg-orange-50 font-bold"
                        : "text-slate-600 hover:text-orange-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>🐕 Community Dogs</span>
                  </button>
                  <button
                    onClick={() => onNavigateCitizen("track")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      citizenView === "track"
                        ? "text-orange-600 bg-orange-50"
                        : "text-slate-600 hover:text-orange-600 hover:bg-slate-50"
                    }`}
                  >
                    Track Complaint
                  </button>
                  {user && (
                    <button
                      onClick={() => onNavigateCitizen("dashboard")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                        citizenView === "dashboard"
                          ? "text-orange-600 bg-orange-50"
                          : "text-slate-600 hover:text-orange-600 hover:bg-slate-50"
                      }`}
                    >
                      My Complaints
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigateNGO("overview")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      ngoView === "overview"
                        ? "text-[#006c49] bg-emerald-50"
                        : "text-slate-600 hover:text-[#006c49] hover:bg-slate-50"
                    }`}
                  >
                    Dashboard Home
                  </button>
                  <button
                    onClick={() => onNavigateNGO("dogs")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      ngoView === "dogs"
                        ? "text-[#006c49] bg-emerald-50 font-bold"
                        : "text-slate-600 hover:text-[#006c49] hover:bg-slate-50"
                    }`}
                  >
                    <span>🐕 Dog Registry</span>
                  </button>
                  <button
                    onClick={() => onNavigateNGO("maps")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      ngoView === "maps"
                        ? "text-[#006c49] bg-emerald-50 font-bold"
                        : "text-slate-600 hover:text-[#006c49] hover:bg-slate-50"
                    }`}
                  >
                    <span className="material-symbols-outlined !text-base text-emerald-600">map</span>
                    <span>Dispatch Map</span>
                  </button>
                  <button
                    onClick={() => onNavigateNGO("complaints")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      ngoView === "complaints"
                        ? "text-[#006c49] bg-emerald-50"
                        : "text-slate-600 hover:text-[#006c49] hover:bg-slate-50"
                    }`}
                  >
                    Complaints
                  </button>
                  <button
                    onClick={() => onNavigateNGO("gov_analytics")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      ngoView === "gov_analytics"
                        ? "text-indigo-700 bg-indigo-50 font-bold"
                        : "text-slate-600 hover:text-indigo-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>🏛️ Municipal ARV/ABC</span>
                  </button>
                  <button
                    onClick={() => onNavigateNGO("volunteers")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      ngoView === "volunteers"
                        ? "text-[#006c49] bg-emerald-50"
                        : "text-slate-600 hover:text-[#006c49] hover:bg-slate-50"
                    }`}
                  >
                    Volunteers
                  </button>
                  <button
                    onClick={() => onNavigateNGO("profile")}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      ngoView === "profile"
                        ? "text-[#006c49] bg-emerald-50 font-bold"
                        : "text-slate-600 hover:text-[#006c49] hover:bg-slate-50"
                    }`}
                  >
                    <span className="material-symbols-outlined !text-base text-emerald-600">domain</span>
                    <span>NGO Profile</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Emergency CTA */}
            <button
              onClick={onEmergencyReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 animate-urgent-pulse"
            >
              <span className="material-symbols-outlined !text-base">emergency</span>
              <span className="hidden sm:inline">Emergency Rescue</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined !text-xl">notifications</span>
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadNotifsCount > 9 ? "9+" : unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Auth / Profile Area */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={user.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Aarav"}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-orange-200 bg-orange-50"
                  />
                  <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="material-symbols-outlined !text-sm text-slate-400">
                    arrow_drop_down
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fadeIn">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (activePortal === "citizen") onNavigateCitizen("dashboard");
                        else onNavigateNGO("overview");
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-base text-slate-400">
                        dashboard
                      </span>
                      Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigateCitizen("profile");
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-base text-slate-400">
                        person
                      </span>
                      My Profile
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                    >
                      <span className="material-symbols-outlined !text-base">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined !text-base">login</span>
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined !text-2xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Slide-In Mobile Drawer Backdrop & Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="fixed top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-slideIn">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined !text-xl">pets</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm">PawConnect</span>
                    <span className="text-[10px] bg-orange-100 text-orange-800 font-bold ml-1 px-1 rounded">
                      {activePortal === "citizen" ? "Citizen" : "NGO"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <div className="p-4 space-y-1.5 flex-1">
                {activePortal === "citizen" ? (
                  <>
                    <button
                      onClick={() => {
                        onNavigateCitizen("landing");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        citizenView === "landing" ? "bg-orange-50 text-orange-700 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-orange-500">home</span>
                      <span>Home</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateCitizen("report");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        citizenView === "report" ? "bg-orange-50 text-orange-700 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-orange-500">add_a_photo</span>
                      <span>Report Dog Issue</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateCitizen("dogs");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        citizenView === "dogs" ? "bg-orange-50 text-orange-700 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-orange-500">pets</span>
                      <span>Community Dogs</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateCitizen("track");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        citizenView === "track" ? "bg-orange-50 text-orange-700 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-orange-500">manage_search</span>
                      <span>Track Complaint</span>
                    </button>

                    {user && (
                      <button
                        onClick={() => {
                          onNavigateCitizen("dashboard");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                          citizenView === "dashboard" ? "bg-orange-50 text-orange-700 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="material-symbols-outlined !text-lg text-orange-500">receipt_long</span>
                        <span>My Complaints</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenNotifications();
                      }}
                      className="w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center justify-between text-slate-700 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined !text-lg text-orange-500">notifications</span>
                        <span>Notifications</span>
                      </div>
                      {unreadNotifsCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadNotifsCount}
                        </span>
                      )}
                    </button>

                    {user && (
                      <button
                        onClick={() => {
                          onNavigateCitizen("profile");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                          citizenView === "profile" ? "bg-orange-50 text-orange-700 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="material-symbols-outlined !text-lg text-orange-500">person</span>
                        <span>My Profile</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onNavigateNGO("overview");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        ngoView === "overview" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-600">dashboard</span>
                      <span>Overview</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateNGO("complaints");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        ngoView === "complaints" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-600">receipt_long</span>
                      <span>Rescues & Cases</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateNGO("map");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        ngoView === "map" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-600">map</span>
                      <span>Live Dispatch Map</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateNGO("dogs");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        ngoView === "dogs" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-600">pets</span>
                      <span>National Dog Registry</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateNGO("volunteers");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        ngoView === "volunteers" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-600">group</span>
                      <span>Volunteers</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateNGO("analytics");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        ngoView === "analytics" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-600">analytics</span>
                      <span>Rescue Analytics</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateNGO("gov_analytics");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        ngoView === "gov_analytics" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-600">account_balance</span>
                      <span>Municipal ARV / ABC</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigateNGO("profile");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-3 text-xs font-bold rounded-xl flex items-center gap-2.5 transition-colors ${
                        ngoView === "profile" ? "bg-emerald-50 text-emerald-800 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="material-symbols-outlined !text-lg text-emerald-600">domain</span>
                      <span>NGO Profile</span>
                    </button>
                  </>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Aarav"}
                        alt={user.name}
                        className="w-9 h-9 rounded-full border border-slate-300"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined !text-base">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-3 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined !text-base">login</span>
                    <span>Sign In to PawConnect</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
