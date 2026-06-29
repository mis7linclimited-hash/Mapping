import { EditStatus } from "@/lib/types";

const STYLES: Record<EditStatus, string> = {
  Pending: "bg-pending-light text-pending",
  Approved: "bg-approved-light text-approved",
  Rejected: "bg-rejected-light text-rejected",
};

export function StatusBadge({ status }: { status: EditStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}
