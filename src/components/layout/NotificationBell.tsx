"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface NotificationItem {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string | null;
  is_read: boolean;
  created_at: string | null;
}

interface EmployeeOption {
  userId: string;
  name: string;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell({ isAdmin }: { isAdmin?: boolean }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [compose, setCompose] = useState({ employeeUserId: "", title: "", message: "", notificationType: "" });
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.status === 401) {
        window.location.href = "/signin";
        return;
      }
      const data = await res.json();
      if (data.success) setItems(data.data ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (notificationId: string) => {
    setItems((prev) =>
      prev.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n))
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, isRead: true }),
      });
    } catch {}
  };

  const removeNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications?notificationId=${notificationId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((n) => n.notification_id !== notificationId));
      } else {
        toast("error", data.error ?? "Delete failed");
      }
    } catch {
      toast("error", "Something went wrong");
    }
  };

  const openCompose = async () => {
    setShowCompose(true);
    if (employees.length === 0) {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setEmployees(
            data.data
              .filter((e: { userId?: string | null; firstName?: string; lastName?: string }) => e.userId)
              .map((e: { userId?: string | null; firstName?: string; lastName?: string; email?: string | null }) => ({
                userId: String(e.userId),
                name: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.email || String(e.userId),
              }))
          );
        }
      } catch {}
    }
  };

  const sendNotification = async () => {
    if (!compose.employeeUserId || !compose.title.trim() || !compose.message.trim()) {
      toast("error", "Employee, title and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: compose.employeeUserId,
          title: compose.title,
          message: compose.message,
          ...(compose.notificationType.trim() ? { notificationType: compose.notificationType } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Notification sent");
        setCompose({ employeeUserId: "", title: "", message: "", notificationType: "" });
        setShowCompose(false);
        fetchNotifications();
      } else {
        toast("error", data.error ?? "Failed to send");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setSending(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative text-primary p-2 hover:bg-surface-container-low rounded-full transition-colors"
      >
        <Icon name="notifications" className="text-[22px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface-pure border border-border-light rounded-xl ambient-shadow z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
            <span className="text-label-md uppercase tracking-wider text-secondary font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => items.filter((n) => !n.is_read).forEach((n) => markRead(n.notification_id))}
                className="text-label-md text-secondary hover:text-primary transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border-light">
            {loading ? (
              <div className="py-10 text-center text-body-sm text-secondary animate-pulse">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-body-sm text-secondary">No notifications yet.</div>
            ) : (
              items.map((n) => (
                <div key={n.notification_id} className={`px-4 py-3 flex gap-3 ${n.is_read ? "" : "bg-surface-container-low"}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? "bg-outline" : "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-primary truncate">{n.title}</p>
                    <p className="text-body-sm text-secondary line-clamp-2">{n.message}</p>
                    <p className="text-label-md text-on-surface-variant mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={() => markRead(n.notification_id)}
                        title="Mark as read"
                        className="text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <Icon name="done_all" className="text-[18px]" />
                      </button>
                    )}
                    <button
                      onClick={() => removeNotification(n.notification_id)}
                      title="Delete"
                      className="text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {isAdmin && (
            <div className="border-t border-border-light">
              {showCompose ? (
                <div className="p-4 space-y-3">
                  <select
                    value={compose.employeeUserId}
                    onChange={(e) => setCompose({ ...compose, employeeUserId: e.target.value })}
                    className="w-full bg-surface-pure border border-border-light px-3 py-2 rounded text-body-sm text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="">Select employee…</option>
                    {employees.map((employee) => (
                      <option key={employee.userId} value={employee.userId}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                  <Input label="Title" value={compose.title} onChange={(e) => setCompose({ ...compose, title: e.target.value })} />
                  <Input label="Message" value={compose.message} onChange={(e) => setCompose({ ...compose, message: e.target.value })} />
                  <Input
                    label="Type (optional)"
                    value={compose.notificationType}
                    onChange={(e) => setCompose({ ...compose, notificationType: e.target.value })}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>Cancel</Button>
                    <Button size="sm" arrow loading={sending} onClick={sendNotification}>Send</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openCompose}
                  className="w-full px-4 py-3 text-label-md uppercase tracking-wider text-secondary hover:text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="add" className="text-[18px]" /> Send notification
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
