import React from "react";
import { CitizenView, User } from "../../types";

interface Props {
  citizenView: CitizenView;
  onNavigateCitizen: (view: CitizenView) => void;
  onEmergencyReport: () => void;
  user: User | null;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<Props> = ({
  citizenView,
  onNavigateCitizen,
  onEmergencyReport,
  user,
  onOpenAuth
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => onNavigateCitizen("landing")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
          citizenView === "landing"
            ? "text-orange-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <span className="material-symbols-outlined !text-2xl">home</span>
        <span className="text-[10px] tracking-tight">Home</span>
      </button>

      {/* 2. Report Issue (Highlighted) */}
      <button
        type="button"
        onClick={() => onNavigateCitizen("report")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
          citizenView === "report"
            ? "text-orange-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <span className="material-symbols-outlined !text-2xl">add_a_photo</span>
        <span className="text-[10px] tracking-tight">Report</span>
      </button>

      {/* 3. Community Dogs */}
      <button
        type="button"
        onClick={() => onNavigateCitizen("dogs")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
          citizenView === "dogs"
            ? "text-orange-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <span className="material-symbols-outlined !text-2xl">pets</span>
        <span className="text-[10px] tracking-tight">Community</span>
      </button>

      {/* 4. Track Complaint */}
      <button
        type="button"
        onClick={() => onNavigateCitizen("track")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
          citizenView === "track"
            ? "text-orange-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <span className="material-symbols-outlined !text-2xl">manage_search</span>
        <span className="text-[10px] tracking-tight">Track</span>
      </button>

      {/* 5. Profile / Auth */}
      <button
        type="button"
        onClick={() => {
          if (user) onNavigateCitizen("profile");
          else onOpenAuth();
        }}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] ${
          citizenView === "profile" || citizenView === "dashboard"
            ? "text-orange-600 font-extrabold"
            : "text-slate-500 hover:text-slate-800 font-medium"
        }`}
      >
        <span className="material-symbols-outlined !text-2xl">
          {user ? "account_circle" : "login"}
        </span>
        <span className="text-[10px] tracking-tight">{user ? "Profile" : "Sign In"}</span>
      </button>
    </div>
  );
};
