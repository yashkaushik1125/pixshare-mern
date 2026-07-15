// Single source of truth for roles and their capabilities.
// Mirrors the original mobile/Flask app.
export const ROLES = {
  admin: {
    label: "Admin",
    color: "#d4af37",
    can: { view: true, post: true, manageUsers: true, deleteAny: true },
  },
  editor: {
    label: "Editor",
    color: "#f5f5f5",
    can: { view: true, post: true, manageUsers: false, deleteAny: false },
  },
  viewer: {
    label: "Viewer",
    color: "#9ca3af",
    can: { view: true, post: false, manageUsers: false, deleteAny: false },
  },
};

export const ROLE_NAMES = Object.keys(ROLES);

export function can(role, capability) {
  return Boolean(ROLES[role]?.can?.[capability]);
}
