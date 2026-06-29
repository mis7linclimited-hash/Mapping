import { zoneColor } from "@/lib/zoneColor";

export function ZoneBadge({ zone }: { zone: string }) {
  const { bg, fg } = zoneColor(zone);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color: fg }}
    >
      {zone}
    </span>
  );
}
