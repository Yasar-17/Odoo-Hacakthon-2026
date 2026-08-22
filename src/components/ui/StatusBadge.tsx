type Status =
  | "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE"
  | "PENDING" | "APPROVED" | "REJECTED"
  | "ACTIVE" | "ON_LEAVE"
  | "PAID" | "PROCESSING";

const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PRESENT:   { bg: "bg-success-light", text: "text-success-text", dot: "bg-success", label: "Present" },
  APPROVED:  { bg: "bg-success-light", text: "text-success-text", dot: "bg-success", label: "Approved" },
  ACTIVE:    { bg: "bg-success-light", text: "text-success-text", dot: "bg-success", label: "Active" },
  PAID:      { bg: "bg-success-light", text: "text-success-text", dot: "bg-success", label: "Paid" },
  ABSENT:    { bg: "bg-danger-light", text: "text-danger-text", dot: "bg-danger", label: "Absent" },
  REJECTED:  { bg: "bg-danger-light", text: "text-danger-text", dot: "bg-danger", label: "Rejected" },
  HALF_DAY:  { bg: "bg-warning-light", text: "text-warning-text", dot: "bg-warning", label: "Half Day" },
  PENDING:   { bg: "bg-warning-light", text: "text-warning-text", dot: "bg-warning", label: "Pending" },
  PROCESSING:{ bg: "bg-warning-light", text: "text-warning-text", dot: "bg-warning", label: "Processing" },
  LEAVE:     { bg: "bg-info-light", text: "text-info-text", dot: "bg-info", label: "Leave" },
  ON_LEAVE:  { bg: "bg-info-light", text: "text-info-text", dot: "bg-info", label: "On Leave" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const s = config[status] ?? { bg: "bg-surface-100", text: "text-surface-600", dot: "bg-surface-400", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
