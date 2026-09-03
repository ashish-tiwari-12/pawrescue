import React from "react";
import { Notification } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectComplaint?: (trackingId: string) => void;
}

export const NotificationDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectComplaint
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100 animate-slideLeft">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">notifications</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                <p className="text-xs text-slate-500">{unreadCount} unread updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="material-symbols-outlined !text-4xl mb-2 text-slate-300">
                  notifications_off
                </span>
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1 text-slate-400">
                  You'll be alerted when status updates occur
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                let icon = "info";
                let iconColor = "text-blue-500 bg-blue-50";

                if (notif.type === "urgent_alert") {
                  icon = "emergency";
                  iconColor = "text-red-600 bg-red-50";
                } else if (notif.type === "status_update") {
                  icon = "published_with_changes";
                  iconColor = "text-emerald-600 bg-emerald-50";
                } else if (notif.type === "assignment") {
                  icon = "person_check";
                  iconColor = "text-purple-600 bg-purple-50";
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) onMarkRead(notif.id);
                      if (notif.trackingId && onSelectComplaint) {
                        onSelectComplaint(notif.trackingId);
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer ${
                      notif.read ? "bg-white hover:bg-slate-50" : "bg-orange-50/40 hover:bg-orange-50 border-l-4 border-orange-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${iconColor} shrink-0`}>
                        <span className="material-symbols-outlined !text-base">{icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.trackingId && (
                          <span className="inline-block mt-1.5 text-[11px] font-semibold text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded">
                            #{notif.trackingId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
