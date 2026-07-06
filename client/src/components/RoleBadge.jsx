import { useConfig } from "../context/ConfigContext.jsx";

export default function RoleBadge({ role }) {
  const { roles } = useConfig();
  const def = roles?.[role] || { label: role, color: "#888" };
  return (
    <span
      className="badge"
      style={{ color: def.color, borderColor: def.color, background: `${def.color}1a` }}
    >
      <span className="dot" style={{ background: def.color }} />
      {def.label}
    </span>
  );
}
