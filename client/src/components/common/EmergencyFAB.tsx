import React from "react";

interface Props {
  onEmergencyReport: () => void;
}

export const EmergencyFAB: React.FC<Props> = ({ onEmergencyReport }) => {
  return (
    <button
      type="button"
      onClick={onEmergencyReport}
      className="md:hidden fixed bottom-18 right-4 z-40 p-3.5 bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 hover:from-red-500 hover:to-orange-500 text-white rounded-full shadow-2xl shadow-red-600/40 border-2 border-white/40 flex items-center justify-center gap-1.5 transition-transform hover:scale-105 active:scale-95 animate-urgent-pulse cursor-pointer"
      title="Report Emergency Dog"
      aria-label="Report Emergency Dog"
    >
      <span className="material-symbols-outlined !text-2xl animate-pulse">emergency</span>
      <span className="text-xs font-black tracking-wide pr-1">SOS</span>
    </button>
  );
};
