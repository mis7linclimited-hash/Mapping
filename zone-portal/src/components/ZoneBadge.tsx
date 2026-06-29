export function ZoneBadge({ zone, zones }: { zone: string; zones?: string[] }) {
  if (!zone) return <span className="text-gray-400">No Zone</span>;
  
  // If it's a single zone
  if (!zones || zones.length === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {zone}
      </span>
    );
  }
  
  // If it's multiple zones
  const zoneList = zones.join(', ');
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {zoneList}
    </span>
  );
}
