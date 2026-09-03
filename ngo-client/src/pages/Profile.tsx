import React from "react";
import { useNgoAuth } from "../context/NgoAuthContext";
import { NGOProfile as NGOProfileComponent } from "../components/ngo/NGOProfile";
import { Complaint } from "../types";

interface ProfileProps {
  complaints?: Complaint[];
  onSelectComplaint?: (complaint: Complaint) => void;
  onNavigateHome?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({
  complaints = [],
  onSelectComplaint,
  onNavigateHome
}) => {
  const { user, ngo, setNgo, logout } = useNgoAuth();

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <span className="material-symbols-outlined !text-base">arrow_back</span>
              <span>Back to Dispatch HQ</span>
            </button>
          )}
          <h1 className="text-xl font-black text-white">NGO Organization Profile</h1>
        </div>

        <button
          onClick={logout}
          className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined !text-base">logout</span>
          <span>Sign Out</span>
        </button>
      </div>

      <NGOProfileComponent
        user={user}
        ngo={ngo}
        complaints={complaints}
        onUpdateNGO={(updatedNgo) => setNgo(updatedNgo)}
        onSelectComplaint={onSelectComplaint}
      />
    </div>
  );
};
