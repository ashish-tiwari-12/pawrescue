import React from "react";
import { ComplaintPriority } from "../../types";

interface Props {
  priority: ComplaintPriority;
  size?: "sm" | "md";
}

export const PriorityBadge: React.FC<Props> = ({ priority, size = "md" }) => {
  let styleClasses = "bg-slate-100 text-slate-700 border-slate-200";

  switch (priority) {
    case "Critical":
      styleClasses = "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse";
      break;
    case "High":
      styleClasses = "bg-orange-50 text-orange-700 border-orange-200 font-semibold";
      break;
    case "Medium":
      styleClasses = "bg-amber-50 text-amber-700 border-amber-200 font-medium";
      break;
    case "Low":
      styleClasses = "bg-slate-50 text-slate-600 border-slate-200 font-medium";
      break;
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${styleClasses} ${sizeClasses}`}
    >
      {priority === "Critical" && <span className="text-red-500">🚨</span>}
      {priority}
    </span>
  );
};
