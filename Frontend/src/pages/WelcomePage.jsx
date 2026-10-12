import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Dices, ArrowRight, Plus, KeyRound } from "lucide-react";
import { useAuthStore } from "../stores/auth.store";
import { usePageTitle } from "../hooks/usePageTitle";
import { RpgAvatar } from "../components/profile/RpgAvatar";

export default function WelcomePage() {
    usePageTitle("به دنیای ماجراجویی خوش آمدید");
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    return (
        <main
            className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 font-fa select-none relative overflow-hidden"
            dir="rtl"
        >
            {/* نور پس‌زمینه محیطی فانتزی */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[32rem] h-80 sm:h-[32rem] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none transform-gpu" />

            <div className="relative w-full max-w-lg glass-card border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 animate-fade-in-up">
                {/* نشان خوش‌آمدگویی */}
                <div className="relative inline-block mx-auto">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 shadow-xl shadow-amber-500/20 flex items-center justify-center mx-auto">
                        <RpgAvatar avatarId={user?.avatarUrl || "cowboy"} className="w-full h-full border-2 border-zinc-950" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md">
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                        حساب کاربری با موفقیت ساخته شد
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 pt-1">
                        خوش آمدید، {user?.username || "ماجراجو"}!
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                        میز مجازی شما آماده است. اکنون می‌توانید اولین اتاق بازی خود را بسازید یا با کد دعوت دوستانتان ملحق شوید.
                    </p>
                </div>

                {/* اقدامات پیشنهادی بعدی */}
                <div className="space-y-3 pt-2">
                    <Link
                        to="/dashboard"
                        className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer active:scale-[0.98]"
                    >
                        <span>ورود به داشبورد و ساخت ماجرا</span>
                        <ArrowRight className="w-4 h-4 rotate-180 stroke-[2.5]" />
                    </Link>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard?action=join")}
                            className="py-2.5 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>ورود با کد اتاق</span>
                        </button>

                        <Link
                            to="/profile"
                            className="py-2.5 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                            <Dices className="w-3.5 h-3.5 text-amber-400" />
                            <span>انتخاب آواتار RPG</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}