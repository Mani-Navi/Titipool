import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuthStore } from "./stores/auth.store";
import { userApi } from "./api/user.api";
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
            let currentUser = null;
            try {
                const saved = localStorage.getItem("vtt_user");
                currentUser = saved ? JSON.parse(saved) : null;
            } catch {
                currentUser = null;
            }

            if (!currentUser) {
                currentUser = decodeToken(token);
            }

            if (currentUser) {
                setAuth(currentUser, token);
            }

            userApi
                .getProfile()
                .then((freshUser) => {
                    if (freshUser) {
                        updateUser(freshUser);
                    }
                })
                .catch(() => {});
        } else {
            localStorage.removeItem("vtt_jwt");
            localStorage.removeItem("vtt_user");
            localStorage.removeItem("token");
            logout();
        }
    }, [setAuth, updateUser, logout]);

    return (
        <>
            <ToastContainer />
            <ConfirmModal />
            <CookieBanner />
            <RouterProvider router={router} />
        </>
    );
}