import React, { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "./router";
import { useAuthStore } from "./stores/auth.store";
import { ENV } from "./config/validateEnv";
import { decodeToken, isTokenExpired } from "./utils/jwt";
import { ToastContainer } from "./components/ui/ToastContainer.jsx";
import { ConfirmModal } from "./components/ui/ConfirmModal.jsx";
import { CookieBanner } from "./components/ui/CookieBanner.jsx";

export default function App() {
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        const token = localStorage.getItem("vtt_jwt");
        if (!token) {
            setIsCheckingAuth(false);
            return;
        }

        if (!isTokenExpired(token)) {
            const payload = decodeToken(token);
            setAuth(payload, token);
        } else {
            localStorage.removeItem("vtt_jwt");
            logout();
        }

        setIsCheckingAuth(false);
    }, [setAuth, logout]);

    if (isCheckingAuth) {
        return (
            <div
                className="min-h-screen bg-[#090a0f] flex items-center justify-center"
                role="status"
                aria-live="polite"
            >
                <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="sr-only">در حال بررسی اطلاعات کاربری و راه‌اندازی میز...</span>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID || "MOCK_GOOGLE_CLIENT_ID"}>
            <ToastContainer />
            <ConfirmModal />
            <CookieBanner />
            <RouterProvider router={router} />
        </GoogleOAuthProvider>
    );
}