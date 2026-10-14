import React, { useEffect } from "react";
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
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        const token = localStorage.getItem("vtt_jwt");
        if (!token) return;

        if (!isTokenExpired(token)) {
            const payload = decodeToken(token);
            if (payload) {
                setAuth(payload, token);
            }
        } else {
            localStorage.removeItem("vtt_jwt");
            localStorage.removeItem("vtt_user");
            logout();
        }
    }, [setAuth, logout]);

    return (
        <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID || "MOCK_GOOGLE_CLIENT_ID"}>
            <ToastContainer />
            <ConfirmModal />
            <CookieBanner />
            <RouterProvider router={router} />
        </GoogleOAuthProvider>
    );
}