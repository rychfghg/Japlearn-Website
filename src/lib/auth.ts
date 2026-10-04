import type { User } from "./api";

const KEY = "japlearn_portal_user";

// Admin sign-ins live only in sessionStorage: closing the browser signs the admin out.
// Teachers keep localStorage so they stay signed in through a school day.
function read(storage: Storage): User | null {
  try {
    return JSON.parse(storage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export const session = {
  get: (): User | null => read(sessionStorage) || read(localStorage),
  set: (user: User) => {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
    const store = String(user?.role).toLowerCase() === "admin" ? sessionStorage : localStorage;
    store.setItem(KEY, JSON.stringify(user));
  },
  clear: () => {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  },
};
