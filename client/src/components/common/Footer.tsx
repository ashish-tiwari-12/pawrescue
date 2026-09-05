import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                <span className="material-symbols-outlined !text-xl">pets</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                PawConnect India
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unified civic network connecting citizens with verified animal welfare NGOs and emergency rescue teams.
            </p>
            <div className="flex items-center gap-2 text-slate-400 pt-1">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                24x7 Ambulance Dispatch Active
              </span>
            </div>
          </div>

          {/* Col 2: Emergency Helplines */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined !text-base text-red-500">call</span>
              Emergency Helplines
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span>Mumbai:</span>
                <strong className="text-orange-400">+91 98201 12345</strong>
              </li>
              <li className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span>Delhi NCR:</span>
                <strong className="text-orange-400">+91 11 2431 4987</strong>
              </li>
              <li className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span>Bengaluru:</span>
                <strong className="text-orange-400">+91 80 2554 9900</strong>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Services */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3">Rescue Services</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="hover:text-orange-400 cursor-pointer transition-colors">
                • Emergency Injury & Accident Response
              </li>
              <li className="hover:text-orange-400 cursor-pointer transition-colors">
                • Abandoned Puppy Foster & Feeding
              </li>
              <li className="hover:text-orange-400 cursor-pointer transition-colors">
                • Animal Birth Control (ABC Spay/Neuter)
              </li>
              <li className="hover:text-orange-400 cursor-pointer transition-colors">
                • Anti-Rabies & Core Vaccinations
              </li>
              <li className="hover:text-orange-400 cursor-pointer transition-colors">
                • Medical Treatment & Mange Care
              </li>
            </ul>
          </div>

          {/* Col 4: Verified NGO Network */}
          <div>
            <h4 className="font-bold text-sm text-white mb-3">Partner Network</h4>
            <p className="text-xs text-slate-400 mb-2.5">
              Partnered with AWBI registered animal welfare NGOs across major metro areas.
            </p>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined !text-base text-emerald-400">verified</span>
                <span className="text-xs font-bold text-white">AWBI Verified</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Compliant with Prevention of Cruelty to Animals guidelines.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 PawConnect India. For India's community animals.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms</span>
            <span className="hover:text-slate-400 cursor-pointer">Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
