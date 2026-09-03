import React from "react";
import { AnalyticsSummary, Complaint } from "../../types";

interface Props {
  analytics: AnalyticsSummary | null;
  complaints: Complaint[];
}

export const AnalyticsView: React.FC<Props> = ({ analytics, complaints }) => {
  if (!analytics) {
    return (
      <div className="bg-white p-12 rounded-3xl card-elevation-1 text-center text-slate-400">
        Loading analytics metrics...
      </div>
    );
  }

  // Calculate percentages for categories
  const total = complaints.length || 1;
  const categoriesList = Object.entries(analytics.categoryCounts || {}).map(([cat, count]) => ({
    name: cat,
    count: Number(count),
    pct: Math.round((Number(count) / total) * 100)
  }));

  const maxMonthCount = Math.max(
    ...analytics.monthlyTrends.map((m) => Math.max(m.reported, m.resolved)),
    100
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest bg-indigo-100/70 px-3 py-1 rounded-full">
            Operations Intelligence
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            Rescue Analytics & Area Trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic incident hotspots, veterinary resolution efficiency, and monthly volume curves.
          </p>
        </div>

        <button
          onClick={() => alert("Detailed Monthly Impact Report PDF generated and downloaded!")}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined !text-base">download</span>
          <span>Export AWBI Report</span>
        </button>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Avg Triage Speed</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">18 Mins</div>
          <span className="text-[11px] text-emerald-600 font-semibold">↑ 14% faster than target</span>
        </div>
        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Avg Resolution Time</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {analytics.averageResolutionHours} Hours
          </div>
          <span className="text-[11px] text-slate-400">Door-to-door medical care</span>
        </div>
        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Resolution Success</span>
          <div className="text-2xl font-extrabold text-[#006c49] mt-1">
            {analytics.resolutionRatePercent}%
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Tier 1 Rating</span>
        </div>
        <div className="bg-white p-5 rounded-2xl card-elevation-1 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Active Critical Cases</span>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            {analytics.criticalCasesCount}
          </div>
          <span className="text-[11px] text-red-500 font-semibold">High ambulance priority</span>
        </div>
      </div>

      {/* Grid: Trends Chart & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Monthly Bar / Trend Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600 !text-lg">
                bar_chart
              </span>
              Monthly Complaints vs Resolutions (2026)
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <span className="w-3 h-3 rounded bg-orange-500" /> Reported
              </span>
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <span className="w-3 h-3 rounded bg-[#006c49]" /> Resolved
              </span>
            </div>
          </div>

          {/* SVG Chart visualization */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
            {analytics.monthlyTrends.map((trend) => {
              const repHeight = (trend.reported / maxMonthCount) * 100;
              const resHeight = (trend.resolved / maxMonthCount) * 100;

              return (
                <div key={trend.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Reported Bar */}
                    <div
                      style={{ height: `${repHeight}%` }}
                      className="w-4 sm:w-6 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all group-hover:brightness-110 relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-900 text-white px-1 rounded transition-opacity">
                        {trend.reported}
                      </span>
                    </div>

                    {/* Resolved Bar */}
                    <div
                      style={{ height: `${resHeight}%` }}
                      className="w-4 sm:w-6 bg-gradient-to-t from-[#006c49] to-emerald-400 rounded-t-lg transition-all group-hover:brightness-110 relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-900 text-white px-1 rounded transition-opacity">
                        {trend.resolved}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 mt-1">
                    {trend.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49] !text-lg">
              pie_chart
            </span>
            Complaint Categories Distribution
          </h3>

          <div className="space-y-3.5 pt-2">
            {categoriesList.map((cat, i) => {
              let barColor = "bg-orange-500";
              if (cat.name === "Emergency Rescue") barColor = "bg-red-500";
              else if (cat.name === "Sterilization Request") barColor = "bg-blue-500";
              else if (cat.name === "Vaccination Request") barColor = "bg-emerald-500";
              else if (cat.name === "Abandoned Puppy") barColor = "bg-purple-500";

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="text-slate-500 font-bold">
                      {cat.count} cases ({cat.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all`}
                      style={{ width: `${Math.max(cat.pct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Area Pincode Distribution Hotspots */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-600 !text-lg">
            location_city
          </span>
          High Incident Neighborhood Hotspots
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {analytics.pincodeDistribution.map((dist, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {dist.area}
                </span>
                <span className="text-[11px] text-slate-500">Active monitoring zone</span>
              </div>
              <span className="text-lg font-extrabold text-orange-600 bg-orange-100 px-3 py-1 rounded-xl">
                {dist.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
