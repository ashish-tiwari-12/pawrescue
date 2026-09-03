import React from "react";
import { TimelineEvent } from "../../types";

interface Props {
  events: TimelineEvent[];
}

export const TimelineView: React.FC<Props> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-sm">
        No timeline activity recorded yet.
      </div>
    );
  }

  // Sort events chronologically
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="relative pl-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sorted.map((event, idx) => {
        const isLatest = idx === sorted.length - 1;
        const eventDate = new Date(event.timestamp);

        let iconName = "check_circle";
        let iconBg = "bg-[#006c49] text-white";
        if (event.status === "Reported") {
          iconName = "flag";
          iconBg = "bg-amber-500 text-white";
        } else if (event.status === "In Progress") {
          iconName = "ambulance";
          iconBg = "bg-[#f97316] text-white";
        } else if (event.status === "Accepted") {
          iconName = "verified";
          iconBg = "bg-purple-600 text-white";
        }

        return (
          <div key={event.id || idx} className="relative mb-6 last:mb-0">
            {/* Step Icon Node */}
            <div
              className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm ${iconBg} ${
                isLatest ? "ring-4 ring-orange-100" : ""
              }`}
            >
              <span className="material-symbols-outlined !text-[14px]">
                {iconName}
              </span>
            </div>

            {/* Event Content */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm ml-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-slate-800 text-sm">
                  {event.title}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {eventDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}{" "}
                  at{" "}
                  {eventDate.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                {event.description}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="material-symbols-outlined !text-[13px]">person</span>
                <span>
                  Updated by: <strong className="text-slate-700">{event.updatedBy}</strong>{" "}
                  ({event.role})
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
