import type { User } from "./api";

const KEY = "japlearn_portal_user";

export const session = {
  get: (): User | null => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  },
  set: (user: User) => localStorage.setItem(KEY, JSON.stringify(user)),
  clear: () => localStorage.removeItem(KEY),
};
