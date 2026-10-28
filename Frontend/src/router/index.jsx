import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RouteErrorBoundary } from "../components/ui/RouteErrorBoundary.jsx";
import LandingPage from "../pages/LandingPage/LandingPage.jsx";

const LoginPage = lazy(() =>
    import("../pages/auth/LoginPage.jsx").then((m) => ({ default: m.LoginPage || m.default }))
);
const RegisterPage = lazy(() =>
    import("../pages/auth/RegisterPage.jsx").then((m) => ({ default: m.RegisterPage || m.default }))
);
const DashboardPage = lazy(() =>
    import("../pages/dashboard/DashboardPage.jsx").then((m) => ({ default: m.DashboardPage || m.default }))
);

const PrivacyPolicyPage = lazy(() => import("../pages/legal/PrivacyPolicyPage.jsx"));
const TermsOfServicePage = lazy(() => import("../pages/legal/TermsOfServicePage.jsx"));
const CookiePolicyPage = lazy(() => import("../pages/legal/CookiePolicyPage.jsx"));
const RefundPolicyPage = lazy(() => import("../pages/legal/RefundPolicyPage.jsx"));

const ProfilePage = lazy(() =>
    import("../pages/profile/ProfilePage.jsx").then((m) => ({
        default: m.ProfilePage || m.default,
    }))
);

const RoomPage = lazy(() =>
    import("../pages/room/RoomPage.jsx").then((m) => ({
        default: m.RoomPage || m.default,
    }))
);

const WelcomePage = lazy(() => import("../pages/WelcomePage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));

const LoadingFallback = () => <div className="min-h-screen w-full bg-[#090a0f]" />;

export const router = createBrowserRouter([
    {
        path: "/",
        errorElement: <RouteErrorBoundary />,
        element: <LandingPage />,
    },
    {
        path: "/login",
        errorElement: <RouteErrorBoundary />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <LoginPage />
            </Suspense>
        ),
    },
    {
        path: "/register",
        errorElement: <RouteErrorBoundary />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <RegisterPage />
            </Suspense>
        ),
    },
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
    {
        element: <ProtectedRoute />,
        errorElement: <RouteErrorBoundary />,
        children: [
            {
                path: "/dashboard",
                errorElement: <RouteErrorBoundary />,
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <DashboardPage />
                    </Suspense>
                ),
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