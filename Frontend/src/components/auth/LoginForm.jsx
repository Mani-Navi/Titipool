import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { useAuth } from "../../hooks/useAuth";
import { ENV } from "../../config/validateEnv";

const loginSchema = z.object({
    email: z.string().email("ایمیل معتبر وارد کنید"),
    password: z.string().min(1, "رمز عبور را وارد کنید"),
});

export const LoginForm = ({ onSuccess }) => {
    const { login, loginWithGoogle } = useAuth();
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const googleButtonRef = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (!ENV.GOOGLE_CLIENT_ID) {
            return;
        }

        const handleCredentialResponse = async (response) => {
            try {
                setServerError("");
                await loginWithGoogle(response.credential);
                onSuccess?.();
            } catch (err) {
                const errorMsg =
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "خطا در ورود با حساب گوگل.";
                setServerError(errorMsg);
            }
        };

        const renderGoogleButton = () => {
            if (!window.google?.accounts?.id || !googleButtonRef.current) return;

            window.google.accounts.id.initialize({
                client_id: ENV.GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
            });

            const containerWidth = googleButtonRef.current.offsetWidth || 320;
            const validWidth = Math.min(Math.max(containerWidth, 230), 400);

            googleButtonRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                type: "standard",
                theme: "filled_black",
                size: "large",
                text: "continue_with",
                shape: "rectangular",
                logo_alignment: "center",
                width: validWidth,
            });
        };

        if (window.google?.accounts?.id) {
            renderGoogleButton();
        } else {
            const existingScript = document.getElementById("google-gsi-script");
            if (!existingScript) {
                const script = document.createElement("script");
                script.id = "google-gsi-script";
                script.src = "https://accounts.google.com/gsi/client";
                script.async = true;
                script.defer = true;
                script.onload = renderGoogleButton;
                document.body.appendChild(script);
            } else {
                existingScript.addEventListener("load", renderGoogleButton);
            }
        }
    }, [loginWithGoogle, onSuccess]);

    const onSubmit = async (data) => {
        setServerError("");
        try {
            await login(data.email, data.password);
            onSuccess?.();
        } catch (err) {
            if (err.response?.status === 401) {
                setServerError("ایمیل یا رمز عبور اشتباه است.");
            } else if (err.response?.status === 429) {
                setServerError("تعداد درخواست‌ها بیش از حد مجاز است — لطفاً کمی صبر کنید.");
            } else {
                const errorMsg = err.response?.data?.message || err.response?.data?.error;
                setServerError(errorMsg || "خطا در برقراری ارتباط با سرور.");
            }
        }
    };

    return (
        <div className="space-y-4 text-right w-full" dir="rtl">
            <div className="flex justify-center w-full min-h-[44px] overflow-hidden transition-all duration-200">
                <div ref={googleButtonRef} className="w-full flex justify-center max-w-[340px]" />
            </div>

            <div className="relative flex items-center justify-center my-3">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-full" />
                <span className="bg-zinc-950 px-3.5 text-[11px] text-zinc-500 font-medium shrink-0">
          یا ورود با ایمیل
        </span>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-full" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="ایمیل حساب کاربری"
                    type="email"
                    placeholder="name@example.com"
                    error={errors.email?.message}
                    disabled={isSubmitting}
                    className="h-11 sm:h-10 text-sm transition-colors duration-150"
                    {...register("email")}
                />

                <div className="relative">
                    <Input
                        label="رمز عبور"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        error={errors.password?.message}
                        disabled={isSubmitting}
                        className="h-11 sm:h-10 text-sm pl-11 transition-colors duration-150"
                        {...register("password")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-2.5 top-[39px] sm:top-[38px] -translate-y-1/2 text-zinc-400 hover:text-zinc-200 active:text-amber-400 p-2 cursor-pointer rounded-lg active:scale-90 transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                        tabIndex={-1}
                        aria-label="تغییر وضعیت نمایش رمز"
                    >
                        {showPassword ? (
                            <EyeOff className="w-4 h-4 transition-transform duration-200 rotate-0 scale-100" />
                        ) : (
                            <Eye className="w-4 h-4 transition-transform duration-200 rotate-0 scale-100" />
                        )}
                    </button>
                </div>

                {serverError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-shake-subtle">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{serverError}</span>
                    </div>
                )}

                <Button
                    type="submit"
                    variant="amber"
                    className="w-full mt-2 font-bold shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all duration-150 h-11 sm:h-11 text-xs sm:text-sm flex items-center justify-center"
                    isLoading={isSubmitting}
                    aria-busy={isSubmitting}
                >
                    {!isSubmitting && (
                        <LogIn className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-0.5" />
                    )}
                    <span>{isSubmitting ? "در حال ورود..." : "ورود به حساب کاربری"}</span>
                </Button>
            </form>
        </div>
    );
};

export default LoginForm;