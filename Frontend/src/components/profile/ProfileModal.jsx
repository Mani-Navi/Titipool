import React, { useState, useMemo, useEffect, useRef, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../../stores/auth.store";
import { userApi } from "../../api/user.api";
import { RpgAvatar, AVATAR_LIST } from "./RpgAvatar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
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
    Crown,
    Layers,
    Award,
} from "lucide-react";

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید"),
        newPassword: z.string().min(8, "حداقل ۸ کاراکتر").max(72, "حداکثر ۷۲ کاراکتر"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "رمز عبور جدید و تکرار آن یکسان نیستند",
        path: ["confirmPassword"],
    });

const emailSchema = z.object({
    newEmail: z.string().email("ایمیل معتبر وارد کنید"),
    password: z.string().min(1, "رمز عبور را وارد کنید"),
});

const checkPasswordCriteria = (pass = "") => [
    { label: "حداقل ۸ کاراکتر", valid: pass.length >= 8 },
    { label: "حروف کوچک و بزرگ (a-Z)", valid: /[a-z]/.test(pass) && /[A-Z]/.test(pass) },
    { label: "حداقل یک عدد (0-9)", valid: /\d/.test(pass) },
    { label: "حداقل یک نماد ویژه (!@#$%)", valid: /[^A-Za-z0-9]/.test(pass) },
];

export const ProfileModal = memo(({ isOpen, onClose }) => {
    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout);

    const [activeTab, setActiveTab] = useState("overview");
    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [usernameInput, setUsernameInput] = useState(user?.username || "");
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
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
    });

    const newPasswordValue = watchPass("newPassword", "");
    const criteria = useMemo(() => checkPasswordCriteria(newPasswordValue), [newPasswordValue]);
    const passedCriteriaCount = criteria.filter((c) => c.valid).length;

    const showFeedback = (type, text) => {
        setStatusMsg({ type, text });
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => setStatusMsg({ type: "", text: "" }), 4000);
    };

    const getErrorMsg = (err, fallback) =>
        err?.response?.data?.error || err?.response?.data?.message || fallback;

    const handleSaveAvatar = async (avatarId) => {
        try {
            setIsSavingAvatar(true);
            const updated = await userApi.updateProfile({ avatarUrl: avatarId });
            updateUser(updated);
            showFeedback("success", "آواتار کاراکتر شما با موفقیت تغییر کرد.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "خطا در به‌روزرسانی آواتار."));
        } finally {
            setIsSavingAvatar(false);
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
            showFeedback("success", "نام کاربری با موفقیت به‌روزرسانی شد.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "خطا در تغییر نام کاربری."));
        } finally {
            setIsUpdatingUsername(false);
        }
    };

    const onSubmitPassword = async (data) => {
        try {
            await userApi.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            resetPassForm();
            showFeedback("success", "رمز عبور با موفقیت تغییر یافت.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "رمز فعلی اشتباه است."));
        }
    };

    const onSubmitEmail = async (data) => {
        try {
            const response = await userApi.changeEmail(data);
            setAuth(response.user, response.token);
            resetEmailForm();
            showFeedback("success", "آدرس ایمیل تغییر کرد.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "خطا در تغییر ایمیل."));
        }
    };

    const handleVerifyEmail = async () => {
        try {
            await userApi.sendVerificationCode();
            showFeedback("success", "کد تایید به ایمیل شما ارسال شد.");
        } catch (err) {
            showFeedback("error", getErrorMsg(err, "خطا در ارسال کد تایید."));
        }
    };

    if (!isOpen) return null;

    const currentAvatarId = user?.avatarUrl || "cowboy";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn font-fa select-none"
            dir="rtl"
        >
            <div className="relative w-full max-w-5xl bg-zinc-950/95 border border-zinc-800/90 rounded-[2.5rem] shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 left-6 z-20 w-8 h-8 rounded-full bg-zinc-900/80 border border-zinc-700/60 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-all cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="relative p-6 sm:p-8 bg-gradient-to-b from-amber-500/10 via-zinc-900/40 to-transparent border-b border-zinc-800/80 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative mb-3 group">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 shadow-xl shadow-amber-500/20 flex items-center justify-center">
                            <RpgAvatar avatarId={currentAvatarId} className="w-full h-full border-2 border-zinc-950" />
                        </div>

                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-zinc-900 border border-amber-500/60 rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>Titipool</span>
                        </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-wide mt-1">
                        {user?.username || "ماجراجو"}
                    </h2>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-4 pt-4 border-t border-zinc-800/60">
                        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-2.5 flex flex-col items-center">
                            <Layers className="w-4 h-4 text-amber-400 mb-1" />
                            <span className="text-sm font-black text-zinc-100">{user?.roomsCount ?? 0}</span>
                            <span className="text-[10px] text-zinc-400">اتاق‌ها</span>
                        </div>

                        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-2.5 flex flex-col items-center">
                            <CheckCircle2 className={`w-4 h-4 mb-1 ${user?.isEmailVerified ? "text-emerald-400" : "text-amber-400"}`} />
                            <span className="text-sm font-black text-zinc-100">
                                {user?.isEmailVerified ? "تایید شده" : "تایید نشده"}
                            </span>
                            <span className="text-[10px] text-zinc-400">وضعیت ایمیل</span>
                        </div>
                    </div>
                </div>

                {statusMsg.text && (
                    <div
                        className={`mx-8 mt-4 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fadeIn ${
                            statusMsg.type === "success"
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                        }`}
                    >
                        {statusMsg.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{statusMsg.text}</span>
                    </div>
                )}

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto p-6 sm:p-8 gap-6">
                    <div className="md:col-span-4 flex flex-col justify-between space-y-4 border-l border-zinc-800/80 pl-0 md:pl-6">
                        <div className="space-y-1.5">
                            <button
                                type="button"
                                onClick={() => setActiveTab("overview")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
                                    activeTab === "overview"
                                        ? "bg-zinc-100 text-zinc-950 shadow-lg shadow-white/10"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
                                }`}
                            >
                                <UserIcon className="w-4 h-4" />
                                مشخصات عمومی
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("avatars")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
                                    activeTab === "avatars"
                                        ? "bg-zinc-100 text-zinc-950 shadow-lg shadow-white/10"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
                                }`}
                            >
                                <Award className="w-4 h-4" />
                                انتخاب آواتار RPG
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("security")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
                                    activeTab === "security"
                                        ? "bg-zinc-100 text-zinc-950 shadow-lg shadow-white/10"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
                                }`}
                            >
                                <Shield className="w-4 h-4" />
                                امنیت و پسورد
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("email")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-right ${
                                    activeTab === "email"
                                        ? "bg-zinc-100 text-zinc-950 shadow-lg shadow-white/10"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
                                }`}
                            >
                                <Mail className="w-4 h-4" />
                                تنظیمات ایمیل
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold mt-4"
                        >
                            <LogOut className="w-4 h-4" />
                            خروج از حساب
                        </button>
                    </div>

                    <div className="md:col-span-8">
                        {activeTab === "overview" && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-100">ویرایش نام کاربری</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        این نام در اتاق‌های بازی و لیست اعضای آنلاین نمایش داده می‌شود.
                                    </p>
                                </div>

                                <form onSubmit={handleUpdateUsername} className="space-y-4 max-w-md">
                                    <Input
                                        label="نام کاربری (Username)"
                                        value={usernameInput}
                                        onChange={(e) => setUsernameInput(e.target.value)}
                                        placeholder="dungeon_master"
                                    />
                                    <Button
                                        type="submit"
                                        variant="amber"
                                        size="sm"
                                        isLoading={isUpdatingUsername}
                                        disabled={!usernameInput || usernameInput === user?.username}
                                        className="font-bold text-xs"
                                    >
                                        ذخیره نام کاربری
                                    </Button>
                                </form>
                            </div>
                        )}

                        {activeTab === "avatars" && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-100">انتخاب آواتار آماده فانتزی</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        کاراکتر مورد علاقه خود را انتخاب کنید:
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                                    {AVATAR_LIST.map((avatar) => {
                                        const isSelected = currentAvatarId === avatar.id;
                                        return (
                                            <button
                                                key={avatar.id}
                                                type="button"
                                                onClick={() => handleSaveAvatar(avatar.id)}
                                                disabled={isSavingAvatar}
                                                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/20 scale-105"
                                                        : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                                                }`}
                                            >
                                                <RpgAvatar avatarId={avatar.id} className="w-14 h-14 shadow-md" />
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
                                className="space-y-4 max-w-md animate-fadeIn"
                            >
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-100">تغییر رمز عبور</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        برای افزایش امنیت، از ترکیب حروف بزرگ، کوچک، عدد و نماد استفاده کنید.
                                    </p>
                                </div>

                                <Input
                                    label="رمز عبور فعلی"
                                    type="password"
                                    placeholder="••••••••"
                                    error={passErrors.currentPassword?.message}
                                    disabled={isPassSubmitting}
                                    {...registerPass("currentPassword")}
                                />

                                <div className="space-y-1.5">
                                    <div className="relative">
                                        <Input
                                            label="رمز عبور جدید"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            error={passErrors.newPassword?.message}
                                            disabled={isPassSubmitting}
                                            {...registerPass("newPassword")}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-3 top-9 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {newPasswordValue.length > 0 && (
                                        <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-zinc-400">امنیت رمز جدید:</span>
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

                                            <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                                                {criteria.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center gap-1 ${
                                                            item.valid ? "text-emerald-400" : "text-zinc-500"
                                                        }`}
                                                    >
                                                        {item.valid ? (
                                                            <Check className="w-3 h-3 shrink-0 text-emerald-400" />
                                                        ) : (
                                                            <X className="w-3 h-3 shrink-0 text-zinc-600" />
                                                        )}
                                                        <span>{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Input
                                    label="تکرار رمز عبور جدید"
                                    type="password"
                                    placeholder="••••••••"
                                    error={passErrors.confirmPassword?.message}
                                    disabled={isPassSubmitting}
                                    {...registerPass("confirmPassword")}
                                />

                                <Button
                                    type="submit"
                                    variant="amber"
                                    size="sm"
                                    isLoading={isPassSubmitting}
                                    className="font-bold text-xs"
                                >
                                    به‌روزرسانی رمز عبور
                                </Button>
                            </form>
                        )}

                        {activeTab === "email" && (
                            <div className="space-y-6 max-w-md animate-fadeIn">
                                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] text-zinc-400">ایمیل ثبت‌شده:</span>
                                        <div className="text-sm font-bold text-zinc-200 mt-0.5">{user?.email}</div>
                                    </div>

                                    {user?.isEmailVerified ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            تایید شده
                                        </span>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleVerifyEmail}
                                            className="text-xs"
                                        >
                                            تایید ایمیل
                                        </Button>
                                    )}
                                </div>

                                <form onSubmit={handleEmailSubmit(onSubmitEmail)} className="space-y-3.5">
                                    <h4 className="text-xs font-bold text-zinc-300">تغییر آدرس ایمیل</h4>
                                    <Input
                                        label="ایمیل جدید"
                                        type="email"
                                        placeholder="new@example.com"
                                        error={emailErrors.newEmail?.message}
                                        disabled={isEmailSubmitting}
                                        {...registerEmail("newEmail")}
                                    />

                                    <Input
                                        label="رمز عبور فعلی جهت تایید"
                                        type="password"
                                        placeholder="••••••••"
                                        error={emailErrors.password?.message}
                                        disabled={isEmailSubmitting}
                                        {...registerEmail("password")}
                                    />

                                    <Button
                                        type="submit"
                                        variant="amber"
                                        size="sm"
                                        isLoading={isEmailSubmitting}
                                        className="font-bold text-xs"
                                    >
                                        ثبت ایمیل جدید
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

ProfileModal.displayName = "ProfileModal";
export default ProfileModal;