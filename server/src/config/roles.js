// Single source of truth for roles and their capabilities.
// Mirrors the original mobile/Flask app.
export const ROLES = {
  admin: {
    label: "Admin",
    color: "#E74C3C",
    can: { view: true, post: true, manageUsers: true, deleteAny: true },
  },
  editor: {
    label: "Editor",
    color: "#6C5CE7",
    can: { view: true, post: true, manageUsers: false, deleteAny: false },
  },
  viewer: {
    label: "Viewer",
    color: "#00B894",
    can: { view: true, post: false, manageUsers: false, deleteAny: false },
  },
};

export const ROLE_NAMES = Object.keys(ROLES);

export function can(role, capability) {
  return Boolean(ROLES[role]?.can?.[capability]);
}
