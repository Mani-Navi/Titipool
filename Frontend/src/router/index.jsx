import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { RegisterPage } from "../pages/auth/RegisterPage.jsx";
import { DashboardPage } from "../pages/dashboard/DashboardPage.jsx";
import { ProtectedRoute } from "./ProtectedRoute";
import { RouteErrorBoundary } from "../components/ui/RouteErrorBoundary.jsx";

// لود تنبل صفحه لندینگ اصلی
const LandingPage = lazy(() => import("../pages/LandingPage/LandingPage.jsx"));

// لود تنبل صفحات حقوقی الزامی
const PrivacyPolicyPage = lazy(() => import("../pages/legal/PrivacyPolicyPage.jsx"));
const TermsOfServicePage = lazy(() => import("../pages/legal/TermsOfServicePage.jsx"));
const CookiePolicyPage = lazy(() => import("../pages/legal/CookiePolicyPage.jsx"));
const RefundPolicyPage = lazy(() => import("../pages/legal/RefundPolicyPage.jsx"));

// لود تنبل صفحه پروفایل
const ProfilePage = lazy(() =>
    import("../pages/profile/ProfilePage.jsx").then((m) => ({
        default: m.ProfilePage || m.default,
    }))
);

// لود تنبل صفحه اتاق بازی
const RoomPage = lazy(() =>
    import("../pages/room/RoomPage.jsx").then((m) => ({
        default: m.RoomPage || m.default,
    }))
);

// لود تنبل صفحه خوش‌آمدگویی پس از ثبت‌نام
const WelcomePage = lazy(() => import("../pages/WelcomePage.jsx"));

// لود تنبل صفحه ۴۰۴
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));

// پس‌زمینه خام بدون هیچ انیمیشن یا اسپینر لودینگ
const LoadingFallback = () => <div className="min-h-screen w-full bg-[#090a0f]" />;

export const router = createBrowserRouter([
    // روت اصلی: نمایش لندینگ پیج مدرن
    {
        path: "/",
        errorElement: <RouteErrorBoundary />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <LandingPage />
            </Suspense>
        ),
    },
    {
        path: "/login",
        element: <LoginPage />,
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
        errorElement: <RouteErrorBoundary />,
    },

    // مسیرهای عمومی الزامات قانونی
    {
        path: "/privacy-policy",
        errorElement: <RouteErrorBoundary />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <PrivacyPolicyPage />
            </Suspense>
        ),
    },
    {
        path: "/terms-of-service",
        errorElement: <RouteErrorBoundary />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <TermsOfServicePage />
            </Suspense>
        ),
    },
    {
        path: "/cookie-policy",
        errorElement: <RouteErrorBoundary />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <CookiePolicyPage />
            </Suspense>
        ),
    },
    {
        path: "/refund-policy",
        errorElement: <RouteErrorBoundary />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <RefundPolicyPage />
            </Suspense>
        ),
    },

    // مسیرهای محافظت‌شده کاربری
    {
        element: <ProtectedRoute />,
        errorElement: <RouteErrorBoundary />,
        children: [
            {
                path: "/dashboard",
                element: <DashboardPage />,
                errorElement: <RouteErrorBoundary />,
            },
            {
                path: "/welcome",
                errorElement: <RouteErrorBoundary />,
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <WelcomePage />
                    </Suspense>
                ),
            },
            {
                path: "/profile",
                errorElement: <RouteErrorBoundary />,
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <ProfilePage />
                    </Suspense>
                ),
            },
            {
                path: "/room/:roomId",
                errorElement: <RouteErrorBoundary />,
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <RoomPage />
                    </Suspense>
                ),
            },
        ],
    },

    // روت Catch-all برای صفحات ۴۰۴
    {
        path: "*",
        errorElement: <RouteErrorBoundary />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <NotFoundPage />
            </Suspense>
        ),
    },
]);