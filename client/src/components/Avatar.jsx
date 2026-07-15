import { resolveImageUrl } from "../api/client";
import { initials } from "../lib/format";

// Shows a user's profile picture when available, otherwise their initials.
export default function Avatar({ name, url, size = 44, className = "" }) {
  const dims = { width: size, height: size };

  if (url) {
    return (
      <img
        className={`avatar-img ${className}`}
        src={resolveImageUrl(url)}
        alt={name || "avatar"}
        style={dims}
        loading="lazy"
      />
    );
  }

  return (
    <span className={`avatar ${className}`} style={{ ...dims, fontSize: Math.round(size * 0.38) }}>
      {initials(name)}
    </span>
  );
}
