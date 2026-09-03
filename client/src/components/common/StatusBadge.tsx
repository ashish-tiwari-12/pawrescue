import React from "react";
import { ComplaintStatus } from "../../types";

interface Props {
  status: ComplaintStatus;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<Props> = ({ status, size = "md" }) => {
  let colorClasses = "bg-blue-100 text-blue-800 border-blue-200";
  let dotColor = "bg-blue-500";
  let icon = "schedule";

  switch (status) {
    case "Reported":
      colorClasses = "bg-amber-50 text-amber-800 border-amber-200";
      dotColor = "bg-amber-500";
      icon = "pending_actions";
      break;
    case "Accepted":
      colorClasses = "bg-purple-50 text-purple-800 border-purple-200";
      dotColor = "bg-purple-500";
      icon = "thumb_up";
      break;
    case "In Progress":
      colorClasses = "bg-orange-50 text-orange-800 border-orange-200";
      dotColor = "bg-[#f97316]";
      icon = "ambulance";
      break;
    case "Resolved":
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200";
      dotColor = "bg-emerald-500";
      icon = "task_alt";
      break;
    case "Closed":
      colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
      dotColor = "bg-slate-500";
      icon = "verified";
      break;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-semibold"
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses} transition-all`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status === "In Progress" || status === "Reported" ? "animate-ping" : ""}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};
