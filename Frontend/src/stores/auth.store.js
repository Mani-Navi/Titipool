import { create } from "zustand";
import { authApi } from "../api/auth.api";

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem("vtt_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialToken = () => {
  return localStorage.getItem("vtt_jwt") || localStorage.getItem("token") || null;
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: Boolean(getInitialToken()),

  setAuth: (user, token) => {
    if (token) localStorage.setItem("vtt_jwt", token);
    if (user) {
      // ادغام داده‌ها تا فیلدهای آواتار اختصاصی RPG در صورت ارسال کلیم‌های جزئی حفظ شوند
      const existing = getInitialUser();
      const mergedUser = existing ? { ...existing, ...user } : user;
      localStorage.setItem("vtt_user", JSON.stringify(mergedUser));
      set({ user: mergedUser, token, isAuthenticated: true });
      return;
    }
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      const nextUser = state.user ? { ...state.user, ...updatedFields } : updatedFields;
      if (nextUser) {
        localStorage.setItem("vtt_user", JSON.stringify(nextUser));
      }
      return { user: nextUser };
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // در صورت قطعی شبکه کلاینت در هر صورت وضعیت محلی را پاک می‌کند
    } finally {
      localStorage.removeItem("vtt_jwt");
      localStorage.removeItem("vtt_user");
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));