export function initials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  return (parts.slice(0, 2).map((p) => p[0]).join("") || "?").toUpperCase();
}

export function timeAgo(dateInput) {
  const ts = new Date(dateInput).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
