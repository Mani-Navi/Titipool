import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { isTokenExpired } from "../utils/jwt";

export const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);
    const logout = useAuthStore((state) => state.logout);
    const location = useLocation();

    const isSessionValid = Boolean(isAuthenticated && token && !isTokenExpired(token));

    useEffect(() => {
        if (isAuthenticated && token && isTokenExpired(token)) {
            logout();
        }
    }, [isAuthenticated, token, logout]);

    if (!isSessionValid) {
        // ذخیره کد دعوت یا مسیر کامل مقصد در sessionStorage تا پس از لاگین/ثبت‌نام حفظ شود
        try {
            const params = new URLSearchParams(location.search);
            const joinCode = params.get("join");
            if (joinCode) {
                sessionStorage.setItem("vtt_pending_join", joinCode.trim().toUpperCase());
            } else if (location.pathname.startsWith("/room/")) {
                sessionStorage.setItem("vtt_pending_room_path", location.pathname);
            }
        } catch {}

        const fullTarget = `${location.pathname}${location.search || ""}`;
        return <Navigate to="/login" state={{ from: fullTarget }} replace />;
    }

    return <Outlet />;
};