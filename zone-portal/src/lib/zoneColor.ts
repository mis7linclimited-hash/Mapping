// Every Zone gets a stable color the moment it's typed anywhere in the app —
// no config table needed. The same hash is used in the sidebar legend, table
// row accents, and badges, so a Zone's color means the same thing everywhere.

const PALETTE = [
  { bg: "#E6F3F2", fg: "#0E7C7B" }, // teal
  { bg: "#FBEDD8", fg: "#B6711F" }, // amber
  { bg: "#E9E5F7", fg: "#5B3FA0" }, // violet
  { bg: "#FBE7E4", fg: "#A8392E" }, // rust
  { bg: "#E4F3EA", fg: "#2A7A4D" }, // green
  { bg: "#E3EEFB", fg: "#2E5FA3" }, // blue
  { bg: "#F7E8F1", fg: "#9C3F76" }, // magenta
  { bg: "#F0F0E6", fg: "#6B6B3A" }, // olive
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function zoneColor(zoneName: string): { bg: string; fg: string } {
  const index = hashString(zoneName.trim().toLowerCase()) % PALETTE.length;
  return PALETTE[index];
}
