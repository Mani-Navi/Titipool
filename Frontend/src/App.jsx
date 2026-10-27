import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "./router";
import { useAuthStore } from "./stores/auth.store";
import { userApi } from "./api/user.api";
import { ENV } from "./config/validateEnv";
import { decodeToken, isTokenExpired } from "./utils/jwt";
import { ToastContainer } from "./components/ui/ToastContainer.jsx";
import { ConfirmModal } from "./components/ui/ConfirmModal.jsx";
import { CookieBanner } from "./components/ui/CookieBanner.jsx";

export default function App() {
    const setAuth = useAuthStore((state) => state.setAuth);
    const updateUser = useAuthStore((state) => state.updateUser);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        const token = localStorage.getItem("vtt_jwt");
        if (!token) return;

        if (!isTokenExpired(token)) {
            // ۱. اولویت با اطلاعات ذخیره‌شده و کامل پروفایل در localStorage به جای کلیم‌های قدیمی توکن
            let currentUser = null;
            try {
                const saved = localStorage.getItem("vtt_user");
                currentUser = saved ? JSON.parse(saved) : null;
            } catch (e) {
                currentUser = null;
            }

            if (!currentUser) {
                currentUser = decodeToken(token);
            }

            if (currentUser) {
                setAuth(currentUser, token);
            }

            // ۲. استعلام پس‌زمینه از سرور جهت اطمینان از انطباق دائمی کلاینت با دیتابیس
            userApi
                .getProfile()
                .then((freshUser) => {
                    if (freshUser) {
                        updateUser(freshUser);
                    }
                })
                .catch(() => {
                    // در صورت قطعی اینترنت، داده‌های ذخیره‌شده معتبر محلی استفاده می‌شوند
                });
        } else {
            localStorage.removeItem("vtt_jwt");
            localStorage.removeItem("vtt_user");
            localStorage.removeItem("token");
            logout();
        }
    }, [setAuth, updateUser, logout]);

    return (
        <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID || "MOCK_GOOGLE_CLIENT_ID"}>
            <ToastContainer />
            <ConfirmModal />
            <CookieBanner />
            <RouterProvider router={router} />
        </GoogleOAuthProvider>
    );
}