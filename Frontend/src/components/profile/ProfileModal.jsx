import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../../stores/auth.store";
import { userApi } from "../../api/user.api";
import { usePageTitle } from "../../hooks/usePageTitle";
import { RpgAvatar, AVATAR_LIST } from "../../components/profile/RpgAvatar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
    User as UserIcon,
    Shield,
    Mail,
    Check,
    X,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    LogOut,
    Layers,
    Crown,
    ArrowRight,
    Send,
    Timer,
    Award,
    ShieldCheck,
    KeyRound,
} from "lucide-react";

const emailSchema = z.object({
    newEmail: z.string().email("ایمیل معتبر وارد کنید"),
    password: z.string().min(1, "رمز عبور را وارد کنید"),
});

const checkPasswordCriteria = (pass = "") => [
    { label: "حداقل ۸ کاراکتر", valid: pass.length >= 8 },
    { label: "حروف کوچک و بزرگ", valid: /[a-z]/.test(pass) && /[A-Z]/.test(pass) },
    { label: "حداقل یک عدد", valid: /\d/.test(pass) },
    { label: "نماد خاص (!@#$)", valid: /[^A-Za-z0-9]/.test(pass) },
];

export const ProfilePage = () => {
    usePageTitle("پروفایل کاربری");

    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout);

    // اگر کاربر با گوگل ثبت‌نام کرده و هنوز رمز تعیین نکرده باشد، hasPassword برابر false است
    const hasPassword = user?.hasPassword !== false;

    const passwordSchema = useMemo(
        () =>
            z
                .object({
                    currentPassword: hasPassword
                        ? z.string().min(1, "رمز عبور فعلی را وارد کنید")
                        : z.string().optional(),
                    newPassword: z.string().min(8, "حداقل ۸ کاراکتر").max(72, "حداکثر ۷۲ کاراکتر"),
                    confirmPassword: z.string(),
                })
                .refine((data) => data.newPassword === data.confirmPassword, {
                    message: "رمز جدید و تکرار آن یکسان نیستند",
                    path: ["confirmPassword"],
                }),
        [hasPassword]
    );

    const [activeTab, setActiveTab] = useState("overview");
    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [showEmailPass, setShowEmailPass] = useState(false);

    const [usernameInput, setUsernameInput] = useState(user?.username || "");
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

    const [verificationCode, setVerificationCode] = useState("");
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [timer, setTimer] = useState(0);

    const feedbackTimerRef = useRef(null);

    useEffect(() => {
        userApi
            .getProfile()
            .then((data) => {
                updateUser(data);
                setUsernameInput(data.username);
            })
            .catch(() => {});
    }, [updateUser]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((t) => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    useEffect(() => {
        return () => {
            if (feedbackTimerRef.current) {
                clearTimeout(feedbackTimerRef.current);
            }
        };
    }, []);

    const {
        register: registerPass,
        handleSubmit: handlePassSubmit,
        reset: resetPassForm,
        watch: watchPass,
        formState: { errors: passErrors, isSubmitting: isPassSubmitting },
    } = useForm({
        resolver: zodResolver(passwordSchema),
        mode: "onChange",
    });

    const {
        register: registerEmail,
        handleSubmit: handleEmailSubmit,
        reset: resetEmailForm,
        formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
    } = useForm({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            newEmail: "",
            password: "",
        },
    });

    const newPasswordValue = watchPass("newPassword", "");
    const criteria = useMemo(() => checkPasswordCriteria(newPasswordValue), [newPasswordValue]);
    const passedCriteriaCount = criteria.filter((c) => c.valid).length;

    const showFeedback = (type, text) => {
        setStatusMsg({ type, text });
        if (feedbackTimerRef.current) {
            clearTimeout(feedbackTimerRef.current);
        }
        feedbackTimerRef.current = setTimeout(() => {
            setStatusMsg({ type: "", text: "" });
        }, 4000);
    };

    const getErrorMsg = (err, fallback) =>
        err?.response?.data?.error || err?.response?.data?.message || fallback;

    const handleAvatarSelect = async (avatarId) => {
        try {
            const updated = await userApi.updateProfile({ avatarUrl: avatarId });
            updateUser(updated);
            showFeedback("success", "آواتار شما با موفقیت تغییر کرد.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "خطا در تغییر آواتار."));
        }
    };

    const handleUpdateUsername = async (e) => {
        e.preventDefault();
        const cleanUsername = String(usernameInput || "").trim();

        if (!cleanUsername || cleanUsername === user?.username) return;
        if (cleanUsername.length < 3) {
            showFeedback("error", "نام کاربری باید حداقل ۳ کاراکتر باشد.");
            return;
        }

        try {
            setIsUpdatingUsername(true);
            const updated = await userApi.updateProfile({ username: cleanUsername });
            updateUser(updated);
            setUsernameInput(cleanUsername);
            showFeedback("success", "نام کاربری به‌روزرسانی شد.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "این نام کاربری قبلاً انتخاب شده است."));
        } finally {
            setIsUpdatingUsername(false);
        }
    };

    const onSubmitPassword = async (data) => {
        try {
            const updatedUser = await userApi.changePassword({
                currentPassword: hasPassword ? data.currentPassword : null,
                newPassword: data.newPassword,
            });
            if (updatedUser) {
                updateUser(updatedUser);
            } else {
                updateUser({ hasPassword: true });
            }
            resetPassForm();
            showFeedback(
                "success",
                hasPassword
                    ? "رمز عبور با موفقیت تغییر کرد."
                    : "رمز عبور با موفقیت تعیین شد! اکنون می‌توانید مستقیماً با ایمیل و رمز عبور نیز وارد شوید."
            );
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "رمز عبور فعلی اشتباه است."));
        }
    };

    const onSubmitEmail = async (data) => {
        try {
            const response = await userApi.changeEmail(data);
            setAuth(response.user, response.token);
            resetEmailForm();
            setCodeSent(false);
            setVerificationCode("");
            setTimer(0);
            showFeedback("success", "ایمیل با موفقیت تغییر یافت. اکنون می‌توانید کد تایید را برای ایمیل جدید دریافت کنید.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "خطا در تغییر ایمیل."));
        }
    };

    const handleSendCode = async () => {
        try {
            setIsSendingCode(true);
            await userApi.sendVerificationCode();
            setCodeSent(true);
            setTimer(60);
            showFeedback("success", "کد تایید ۶ رقمی به ایمیل شما ارسال شد.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "خطا در ارسال کد تایید."));
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (verificationCode.length !== 6) {
            showFeedback("error", "لطفاً کد ۶ رقمی را به صورت کامل وارد کنید.");
            return;
        }

        try {
            setIsVerifyingCode(true);
            const updated = await userApi.verifyCode(verificationCode);
            updateUser(updated);
            setCodeSent(false);
            setVerificationCode("");
            setTimer(0);
            showFeedback("success", "ایمیل شما با موفقیت تایید هویت شد.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "کد وارد شده اشتباه یا منقضی است."));
        } finally {
            setIsVerifyingCode(false);
        }
    };

    const currentAvatarId = user?.avatarUrl || "cowboy";
    const isVerified = user?.isEmailVerified ?? user?.emailVerified ?? false;

    return (
        <div
            className="fixed inset-0 w-full h-[100dvh] bg-[#090a0f] text-zinc-100 font-fa select-none overflow-y-auto overflow-x-hidden flex flex-col"
            style={{ WebkitOverflowScrolling: "touch" }}
            dir="rtl"
        >
            <header className="h-16 shrink-0 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-amber-400 active:scale-95 transition-all p-2 rounded-xl hover:bg-zinc-900"
                    >
                        <ArrowRight className="w-4 h-4" />
                        <span className="hidden sm:inline">بازگشت به داشبورد</span>
                        <span className="sm:hidden">داشبورد</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={logout}
                        className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        خروج
                    </button>
                </div>
            </header>

            <div className="flex-1 w-full">
                <main className="max-w-4xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6 pb-20 animate-fade-in-up">
                    {/* کارت مشخصات بالا */}
                    <div className="relative glass-card border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative mb-3">
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 shadow-xl shadow-amber-500/20 flex items-center justify-center transition-transform duration-300 hover:scale-105">
                                <RpgAvatar avatarId={currentAvatarId} className="w-full h-full border-2 border-zinc-950" />
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-zinc-950 border border-amber-500/60 rounded-full px-2.5 py-0.5 shadow-md flex items-center gap-1 text-[10px] text-amber-300 font-bold whitespace-nowrap">
                                <Crown className="w-3 h-3 text-amber-400" />
                                <span>{user?.isPremium ? "عضو ویژه" : "Titipool"}</span>
                            </div>
                        </div>

                        <h1 dir="auto" className="text-lg sm:text-2xl font-black text-zinc-100">
                            {user?.username}
                        </h1>
                        <p dir="ltr" className="text-xs text-zinc-400 mt-0.5 font-mono">
                            {user?.email}
                        </p>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-lg mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-zinc-800/60">
                            <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col items-center transition-all hover:border-zinc-700">
                                <Layers className="w-4 h-4 text-amber-400 mb-1" />
                                <span className="text-sm sm:text-base font-black text-zinc-100 font-mono">{user?.roomsCount ?? 0}</span>
                                <span className="text-[10px] sm:text-[11px] text-zinc-400">اتاق‌ها</span>
                            </div>

                            <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col items-center transition-all hover:border-zinc-700">
                                <Crown className="w-4 h-4 text-amber-400 mb-1" />
                                <span className="text-xs sm:text-sm font-black text-zinc-100 truncate max-w-full">
                                    {user?.isPremium ? "پرمیوم" : "استاندارد"}
                                </span>
                                <span className="text-[10px] sm:text-[11px] text-zinc-400">اشتراک</span>
                            </div>

                            <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col items-center transition-all hover:border-zinc-700">
                                <CheckCircle2 className={`w-4 h-4 mb-1 ${isVerified ? "text-emerald-400" : "text-amber-400"}`} />
                                <span className="text-xs sm:text-sm font-black text-zinc-100">
                                    {isVerified ? "تایید شده" : "تایید نشده"}
                                </span>
                                <span className="text-[10px] sm:text-[11px] text-zinc-400">ایمیل</span>
                            </div>
                        </div>
                    </div>

                    {statusMsg.text && (
                        <div
                            className={`p-3 sm:p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fade-in-up ${
                                statusMsg.type === "success"
                                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                    : "bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-shake-subtle"
                            }`}
                        >
                            {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                            <span>{statusMsg.text}</span>
                        </div>
                    )}

                    <div className="glass-card border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl space-y-5">
                        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
                            <button
                                type="button"
                                onClick={() => setActiveTab("overview")}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
                                    activeTab === "overview"
                                        ? "bg-zinc-100 text-zinc-950 shadow-md"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                                }`}
                            >
                                <UserIcon className="w-3.5 h-3.5" />
                                اطلاعات حساب
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("avatars")}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
                                    activeTab === "avatars"
                                        ? "bg-zinc-100 text-zinc-950 shadow-md"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                                }`}
                            >
                                <Award className="w-3.5 h-3.5" />
                                آواتار RPG
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("security")}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
                                    activeTab === "security"
                                        ? "bg-zinc-100 text-zinc-950 shadow-md"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                                }`}
                            >
                                <Shield className="w-3.5 h-3.5" />
                                امنیت و پسورد
                                {!hasPassword && (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="نیاز به تعیین رمز عبور" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("email")}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
                                    activeTab === "email"
                                        ? "bg-zinc-100 text-zinc-950 shadow-md"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                                }`}
                            >
                                <Mail className="w-3.5 h-3.5" />
                                تنظیمات ایمیل
                            </button>
                        </div>

                        {activeTab === "overview" && (
                            <div className="space-y-4 max-w-md animate-fade-in-up">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-100">نام کاربری</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">نام نمایشی شما در میزها و بازی‌ها</p>
                                </div>

                                <form
                                    onSubmit={handleUpdateUsername}
                                    autoComplete="off"
                                    data-form-type="other"
                                    className="space-y-3.5"
                                >
                                    <Input
                                        label="نام کاربری (Username)"
                                        name="profileDisplayHandle"
                                        dir="auto"
                                        autoComplete="off"
                                        data-lpignore="true"
                                        value={usernameInput}
                                        onChange={(e) => setUsernameInput(e.target.value)}
                                        placeholder="مثلا: master_of_dungeons"
                                        className="h-10 text-sm"
                                    />

                                    <Button
                                        type="submit"
                                        variant="amber"
                                        size="sm"
                                        isLoading={isUpdatingUsername}
                                        disabled={!usernameInput || usernameInput === user?.username}
                                        className="font-bold text-xs w-full sm:w-auto h-10 active:scale-[0.98] transition-transform"
                                    >
                                        ذخیره تغییرات
                                    </Button>
                                </form>
                            </div>
                        )}

                        {activeTab === "avatars" && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-100">انتخاب کاراکتر ماجراجو</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">کاراکتر خود را برای نمایش در میزها انتخاب کنید:</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                                    {AVATAR_LIST.map((avatar) => {
                                        const isSelected = currentAvatarId === avatar.id;
                                        return (
                                            <button
                                                key={avatar.id}
                                                type="button"
                                                onClick={() => handleAvatarSelect(avatar.id)}
                                                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-150 cursor-pointer active:scale-95 ${
                                                    isSelected
                                                        ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/20 scale-102"
                                                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90"
                                                }`}
                                            >
                                                <RpgAvatar avatarId={avatar.id} className="w-14 h-14 sm:w-16 sm:h-16 shadow-md transition-transform duration-200 group-hover:scale-105" />
                                                <span className="text-[11px] font-bold text-zinc-300 truncate w-full text-center">
                                                    {avatar.name}
                                                </span>
                                                {isSelected && (
                                                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                                        <Check className="w-3 h-3" /> فعال
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <form
                                onSubmit={handlePassSubmit(onSubmitPassword)}
                                autoComplete="off"
                                data-form-type="other"
                                className="space-y-3.5 max-w-md animate-fade-in-up"
                            >
                                {!hasPassword ? (
                                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                                        <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="block text-amber-200 mb-0.5">تعیین رمز عبور اولیه (ورود مستقل از گوگل)</strong>
                                            حساب شما با گوگل ساخته شده است. با تعیین یک رمز عبور در فرم زیر، می‌توانید در مواقع عدم دسترسی به گوگل، مستقیماً با ایمیل و رمز عبور خود وارد شوید.
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="text-sm font-bold text-zinc-100">تغییر رمز عبور</h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">رمز عبور فعلی و رمز جدید را وارد کنید</p>
                                    </div>
                                )}

                                {hasPassword && (
                                    <div className="relative">
                                        <Input
                                            label="رمز عبور فعلی"
                                            type="text"
                                            dir="ltr"
                                            placeholder="••••••••"
                                            autoComplete="off"
                                            data-lpignore="true"
                                            style={!showCurrentPass ? { WebkitTextSecurity: "disc" } : undefined}
                                            error={passErrors.currentPassword?.message}
                                            disabled={isPassSubmitting}
                                            className="h-10 text-sm pl-11 text-left font-mono"
                                            {...registerPass("currentPassword")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                                            className="absolute left-2.5 top-[38px] -translate-y-1/2 text-zinc-400 hover:text-zinc-200 active:text-amber-400 p-1.5 cursor-pointer rounded-lg active:scale-90 transition-all flex items-center justify-center focus-visible:outline-none"
                                            tabIndex={-1}
                                            aria-label="تغییر وضعیت نمایش رمز فعلی"
                                        >
                                            {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <div className="relative">
                                        <Input
                                            label={hasPassword ? "رمز عبور جدید" : "تعیین رمز عبور"}
                                            type="text"
                                            dir="ltr"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            data-lpignore="true"
                                            style={!showNewPass ? { WebkitTextSecurity: "disc" } : undefined}
                                            error={passErrors.newPassword?.message}
                                            disabled={isPassSubmitting}
                                            className="h-10 text-sm pl-11 text-left font-mono"
                                            {...registerPass("newPassword")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPass(!showNewPass)}
                                            className="absolute left-2.5 top-[38px] -translate-y-1/2 text-zinc-400 hover:text-zinc-200 active:text-amber-400 p-1.5 cursor-pointer rounded-lg active:scale-90 transition-all flex items-center justify-center focus-visible:outline-none"
                                            tabIndex={-1}
                                            aria-label="تغییر وضعیت نمایش رمز جدید"
                                        >
                                            {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {newPasswordValue.length > 0 && (
                                        <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[10px] space-y-1.5 animate-fade-in-up">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-zinc-400">قدرت رمز:</span>
                                                <span
                                                    className={`font-bold ${
                                                        passedCriteriaCount <= 1
                                                            ? "text-rose-400"
                                                            : passedCriteriaCount === 2
                                                                ? "text-amber-400"
                                                                : passedCriteriaCount === 3
                                                                    ? "text-cyan-400"
                                                                    : "text-emerald-400"
                                                    }`}
                                                >
                                                    {passedCriteriaCount <= 1
                                                        ? "ضعیف"
                                                        : passedCriteriaCount === 2
                                                            ? "متوسط"
                                                            : passedCriteriaCount === 3
                                                                ? "خوب"
                                                                : "بسیار قوی"}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                                {criteria.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center gap-1 transition-colors duration-150 ${
                                                            item.valid ? "text-emerald-400" : "text-zinc-500"
                                                        }`}
                                                    >
                                                        {item.valid ? (
                                                            <Check className="w-3 h-3 shrink-0 text-emerald-400" />
                                                        ) : (
                                                            <X className="w-3 h-3 shrink-0 text-zinc-600" />
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
                                        label={hasPassword ? "تکرار رمز عبور جدید" : "تکرار رمز عبور"}
                                        type="text"
                                        dir="ltr"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        data-lpignore="true"
                                        style={!showConfirmPass ? { WebkitTextSecurity: "disc" } : undefined}
                                        error={passErrors.confirmPassword?.message}
                                        disabled={isPassSubmitting}
                                        className="h-10 text-sm pl-11 text-left font-mono"
                                        {...registerPass("confirmPassword")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                                        className="absolute left-2.5 top-[38px] -translate-y-1/2 text-zinc-400 hover:text-zinc-200 active:text-amber-400 p-1.5 cursor-pointer rounded-lg active:scale-90 transition-all flex items-center justify-center focus-visible:outline-none"
                                        tabIndex={-1}
                                        aria-label="تغییر وضعیت نمایش تکرار رمز"
                                    >
                                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <Button
                                    type="submit"
                                    variant="amber"
                                    size="sm"
                                    isLoading={isPassSubmitting}
                                    className="font-bold text-xs w-full sm:w-auto h-10 mt-1 active:scale-[0.98] transition-transform"
                                >
                                    {hasPassword ? "ثبت رمز عبور جدید" : "تعیین رمز عبور و فعال‌سازی ورود ایمیلی"}
                                </Button>
                            </form>
                        )}

                        {activeTab === "email" && (
                            <div className="space-y-5 max-w-md animate-fade-in-up">
                                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-zinc-400">ایمیل حساب کاربری:</span>
                                            <div dir="ltr" className="text-xs sm:text-sm font-bold text-zinc-200 mt-0.5 truncate max-w-[180px] sm:max-w-none font-mono text-left">
                                                {user?.email}
                                            </div>
                                        </div>

                                        {isVerified ? (
                                            <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                تایید شده
                                            </span>
                                        ) : (
                                            <span className="text-[11px] sm:text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                                                تایید نشده
                                            </span>
                                        )}
                                    </div>

                                    {isVerified ? (
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 shrink-0" />
                                            <span>ایمیل شما تایید هویت شده و فعال است.</span>
                                        </div>
                                    ) : (
                                        <div className="pt-3 border-t border-zinc-800 space-y-3">
                                            {!codeSent ? (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleSendCode}
                                                    isLoading={isSendingCode}
                                                    className="w-full text-xs font-bold h-10 active:scale-[0.98] transition-transform"
                                                >
                                                    <Send className="w-3.5 h-3.5 ml-1.5" />
                                                    ارسال کد ۶ رقمی به ایمیل
                                                </Button>
                                            ) : (
                                                <form onSubmit={handleVerifyCode} autoComplete="off" className="space-y-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            dir="ltr"
                                                            inputMode="numeric"
                                                            autoComplete="one-time-code"
                                                            maxLength={6}
                                                            value={verificationCode}
                                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                                                            placeholder="کد ۶ رقمی"
                                                            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-zinc-100 focus:border-amber-400 focus:outline-none"
                                                        />
                                                        <Button
                                                            type="submit"
                                                            variant="amber"
                                                            size="sm"
                                                            isLoading={isVerifyingCode}
                                                            className="text-xs font-bold shrink-0 h-10 px-3 active:scale-[0.98]"
                                                        >
                                                            تایید کد
                                                        </Button>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                                                        {timer > 0 ? (
                                                            <span className="flex items-center gap-1 text-amber-400 font-mono">
                                                                <Timer className="w-3.5 h-3.5" /> {timer} ثانیه تا ارسال مجدد
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={handleSendCode}
                                                                disabled={isSendingCode}
                                                                className="text-amber-400 hover:underline cursor-pointer font-bold"
                                                            >
                                                                ارسال مجدد کد تایید
                                                            </button>
                                                        )}
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <form
                                    onSubmit={handleEmailSubmit(onSubmitEmail)}
                                    autoComplete="off"
                                    data-form-type="other"
                                    className="space-y-3.5 pt-1"
                                >
                                    <h4 className="text-xs font-bold text-zinc-300">درخواست تغییر آدرس ایمیل</h4>
                                    <Input
                                        label="ایمیل جدید"
                                        type="email"
                                        dir="ltr"
                                        autoComplete="off"
                                        data-lpignore="true"
                                        placeholder="new@example.com"
                                        error={emailErrors.newEmail?.message}
                                        disabled={isEmailSubmitting}
                                        className="h-10 text-sm text-left font-mono"
                                        {...registerEmail("newEmail")}
                                    />

                                    <div className="relative">
                                        <Input
                                            label="رمز عبور فعلی جهت تایید"
                                            type="text"
                                            dir="ltr"
                                            autoComplete="off"
                                            data-lpignore="true"
                                            style={!showEmailPass ? { WebkitTextSecurity: "disc" } : undefined}
                                            placeholder="••••••••"
                                            error={emailErrors.password?.message}
                                            disabled={isEmailSubmitting}
                                            className="h-10 text-sm pl-11 text-left font-mono"
                                            {...registerEmail("password")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEmailPass(!showEmailPass)}
                                            className="absolute left-2.5 top-[38px] -translate-y-1/2 text-zinc-400 hover:text-zinc-200 active:text-amber-400 p-1.5 cursor-pointer rounded-lg active:scale-90 transition-all flex items-center justify-center focus-visible:outline-none"
                                            tabIndex={-1}
                                            aria-label="تغییر وضعیت نمایش رمز"
                                        >
                                            {showEmailPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="amber"
                                        size="sm"
                                        isLoading={isEmailSubmitting}
                                        className="font-bold text-xs w-full sm:w-auto h-10 active:scale-[0.98] transition-transform"
                                    >
                                        ثبت و تغییر ایمیل
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;