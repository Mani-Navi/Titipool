import React, { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Check, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { useAuth } from "../../hooks/useAuth";
import { ENV } from "../../config/validateEnv";

const registerSchema = z
    .object({
        username: z
            .string()
            .min(3, "حداقل ۳ کاراکتر")
            .max(50, "حداکثر ۵۰ کاراکتر")
            .regex(/^[a-zA-Z0-9_]+$/, "فقط حروف انگلیسی، عدد و _"),
        email: z.string().email("ایمیل معتبر وارد کنید"),
        password: z.string().min(8, "حداقل ۸ کاراکتر").max(72, "حداکثر ۷۲ کاراکتر"),
        confirmPassword: z.string(),
        acceptTerms: z.boolean().refine((val) => val === true, {
            message: "پذیرش قوانین و مقررات الزامی است",
        }),
        acceptPrivacy: z.boolean().refine((val) => val === true, {
            message: "پذیرش سیاست حریم خصوصی الزامی است",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "رمزها یکسان نیستند",
        path: ["confirmPassword"],
    });

const checkPasswordCriteria = (pass = "") => [
    { label: "حداقل ۸ کاراکتر", valid: pass.length >= 8 },
    { label: "حروف کوچک و بزرگ", valid: /[a-z]/.test(pass) && /[A-Z]/.test(pass) },
    { label: "حداقل یک عدد", valid: /\d/.test(pass) },
    { label: "نماد خاص (!@#$)", valid: /[^A-Za-z0-9]/.test(pass) },
];

export const RegisterForm = ({ onSuccess }) => {
    const { register: registerUser, loginWithGoogle } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [serverError, setServerError] = useState("");
    const googleButtonRef = useRef(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            acceptTerms: false,
            acceptPrivacy: false,
        },
    });

    const passwordValue = watch("password", "");
    const criteria = useMemo(() => checkPasswordCriteria(passwordValue), [passwordValue]);
    const passedCriteriaCount = criteria.filter((c) => c.valid).length;

    const strengthInfo = useMemo(() => {
        if (!passwordValue) return { label: "", color: "bg-zinc-700", width: "0%" };
        if (passedCriteriaCount <= 1) return { label: "ضعیف", color: "bg-rose-500", width: "25%" };
        if (passedCriteriaCount === 2) return { label: "متوسط", color: "bg-amber-500", width: "50%" };
        if (passedCriteriaCount === 3) return { label: "خوب", color: "bg-cyan-500", width: "75%" };
        return { label: "بسیار قوی", color: "bg-emerald-500", width: "100%" };
    }, [passwordValue, passedCriteriaCount]);

    useEffect(() => {
        if (!ENV.GOOGLE_CLIENT_ID) return;

        const handleCredentialResponse = async (response) => {
            try {
                setServerError("");
                await loginWithGoogle(response.credential);
                onSuccess?.();
            } catch (err) {
                const errorMsg =
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "خطا در ثبت‌نام با حساب گوگل.";
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
                text: "signup_with",
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
            await registerUser(data.username, data.email, data.password);
            onSuccess?.();
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.response?.data?.error;
            if (err.response?.status === 409) {
                setServerError(serverMsg || "این ایمیل یا نام کاربری قبلاً ثبت شده است.");
            } else if (err.response?.status === 400 && serverMsg) {
                setServerError(serverMsg);
            } else {
                setServerError(serverMsg || "خطا در ارتباط با سرور — لطفاً دوباره تلاش کنید.");
            }
        }
    };

    return (
        <div className="space-y-2.5 text-right w-full" dir="rtl">
            <div className="flex justify-center w-full min-h-[42px] overflow-hidden">
                <div
                    ref={googleButtonRef}
                    className="w-full flex justify-center max-w-[340px]"
                    aria-label="ورود و ثبت‌نام سریع با حساب کاربری گوگل"
                />
            </div>

            <div className="relative flex items-center justify-center my-1.5" aria-hidden="true">
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-full" />
                <span className="bg-zinc-950 px-3 text-[10px] text-zinc-500 font-medium shrink-0">
                    یا تکمیل فرم زیر
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-full" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5" noValidate>
                {serverError && (
                    <div
                        role="alert"
                        aria-live="assertive"
                        className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-shake-subtle"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
                        <span>{serverError}</span>
                    </div>
                )}

                <Input
                    label="نام کاربری (Username)"
                    placeholder="مثلا: dungeon_master"
                    error={errors.username?.message}
                    disabled={isSubmitting}
                    className="h-9 sm:h-9.5 text-xs sm:text-sm"
                    aria-required="true"
                    aria-invalid={!!errors.username}
                    {...register("username")}
                />

                <Input
                    label="ایمیل"
                    type="email"
                    placeholder="name@example.com"
                    error={errors.email?.message}
                    disabled={isSubmitting}
                    className="h-9 sm:h-9.5 text-xs sm:text-sm"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                />

                <div className="space-y-1">
                    <div className="relative">
                        <Input
                            label="رمز عبور"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            error={errors.password?.message}
                            disabled={isSubmitting}
                            className="h-9 sm:h-9.5 text-xs sm:text-sm pl-10"
                            aria-required="true"
                            aria-invalid={!!errors.password}
                            {...register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-2 top-[34px] sm:top-[33px] -translate-y-1/2 text-zinc-400 hover:text-zinc-200 active:text-amber-400 p-1.5 cursor-pointer rounded-lg active:scale-90 transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                            aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
                        </button>
                    </div>

                    {passwordValue.length > 0 && (
                        <div
                            className="p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[10px] space-y-1.5 animate-fade-in-up"
                            aria-live="polite"
                        >
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-400">امنیت رمز:</span>
                                <span
                                    className={`font-bold transition-colors duration-200 ${
                                        passedCriteriaCount <= 1
                                            ? "text-rose-400"
                                            : passedCriteriaCount === 2
                                                ? "text-amber-400"
                                                : passedCriteriaCount === 3
                                                    ? "text-cyan-400"
                                                    : "text-emerald-400"
                                    }`}
                                >
                                    {strengthInfo.label}
                                </span>
                            </div>

                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden" aria-hidden="true">
                                <div
                                    className={`h-full transition-all duration-300 ease-out ${strengthInfo.color}`}
                                    style={{ width: strengthInfo.width }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-0.5">
                                {criteria.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-1 transition-colors duration-200 ${
                                            item.valid ? "text-emerald-400" : "text-zinc-500"
                                        }`}
                                    >
                                        {item.valid ? (
                                            <Check className="w-3 h-3 shrink-0 text-emerald-400" aria-hidden="true" />
                                        ) : (
                                            <X className="w-3 h-3 shrink-0 text-zinc-600" aria-hidden="true" />
                                        )}
                                        <span className="truncate">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <Input
                        label="تکرار رمز عبور"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        error={errors.confirmPassword?.message}
                        disabled={isSubmitting}
                        className="h-9 sm:h-9.5 text-xs sm:text-sm pl-10"
                        aria-required="true"
                        aria-invalid={!!errors.confirmPassword}
                        {...register("confirmPassword")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-2 top-[34px] sm:top-[33px] -translate-y-1/2 text-zinc-400 hover:text-zinc-200 active:text-amber-400 p-1.5 cursor-pointer rounded-lg active:scale-90 transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                        aria-label={showConfirmPassword ? "پنهان کردن تکرار رمز عبور" : "نمایش تکرار رمز عبور"}
                        aria-pressed={showConfirmPassword}
                    >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
                    </button>
                </div>

                {/* چک‌باکس رضایت صریح به قوانین و مقررات */}
                <div className="pt-1 space-y-2">
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="acceptTerms"
                            {...register("acceptTerms")}
                            disabled={isSubmitting}
                            className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400/30 accent-amber-500 cursor-pointer"
                            aria-describedby={errors.acceptTerms ? "acceptTermsError" : undefined}
                            aria-invalid={!!errors.acceptTerms}
                        />
                        <label htmlFor="acceptTerms" className="text-xs text-zinc-300 leading-snug cursor-pointer select-none">
                            <a
                                href="/terms-of-service"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 hover:underline underline-offset-2"
                            >
                                شرایط و قوانین استفاده
                            </a>
                            {" "}از پلتفرم را خوانده و می‌پذیرم.
                        </label>
                    </div>
                    {errors.acceptTerms && (
                        <p id="acceptTermsError" role="alert" className="text-rose-400 text-[11px] font-medium pr-6 animate-fade-in-up">
                            {errors.acceptTerms.message}
                        </p>
                    )}

                    {/* چک‌باکس رضایت صریح به سیاست حریم خصوصی */}
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="acceptPrivacy"
                            {...register("acceptPrivacy")}
                            disabled={isSubmitting}
                            className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400/30 accent-amber-500 cursor-pointer"
                            aria-describedby={errors.acceptPrivacy ? "acceptPrivacyError" : undefined}
                            aria-invalid={!!errors.acceptPrivacy}
                        />
                        <label htmlFor="acceptPrivacy" className="text-xs text-zinc-300 leading-snug cursor-pointer select-none">
                            <a
                                href="/privacy-policy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 hover:underline underline-offset-2"
                            >
                                سیاست حفظ حریم خصوصی
                            </a>
                            {" "}را مطالعه کرده و موافقم.
                        </label>
                    </div>
                    {errors.acceptPrivacy && (
                        <p id="acceptPrivacyError" role="alert" className="text-rose-400 text-[11px] font-medium pr-6 animate-fade-in-up">
                            {errors.acceptPrivacy.message}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    variant="amber"
                    className="w-full !mt-3 font-bold shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all duration-150 h-10 sm:h-10 text-xs sm:text-sm flex items-center justify-center"
                    isLoading={isSubmitting}
                    aria-busy={isSubmitting}
                >
                    {!isSubmitting && (
                        <UserPlus className="w-4 h-4 ml-1.5" aria-hidden="true" />
                    )}
                    <span>{isSubmitting ? "در حال ساخت حساب کاربری..." : "ساخت حساب و شروع بازی"}</span>
                </Button>
            </form>
        </div>
    );
};

export default RegisterForm;