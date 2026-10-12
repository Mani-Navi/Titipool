import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useAuthStore } from '../../stores/auth.store';
import { isTokenExpired } from '../../utils/jwt';
import { usePageTitle } from '../../hooks/usePageTitle';

import { Navbar } from '../../components/landing/Navbar';
import { Hero } from '../../components/landing/Hero';
import { BigStatement } from '../../components/landing/BigStatement';
import { DiceSection } from '../../components/landing/DiceSection';
import { ScenariosSection } from '../../components/landing/ScenariosSection';
import { GameMasterSection } from '../../components/landing/GameMasterSection';
import { PlayerSection } from '../../components/landing/PlayerSection';
import { FeaturesSequence } from '../../components/landing/FeaturesSequence';
import { HowItWorks } from '../../components/landing/HowItWorks';
import { PersianBrandSection } from '../../components/landing/PersianBrandSection';
import { FinalCta } from '../../components/landing/FinalCta';
import { Footer } from '../../components/landing/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
    usePageTitle("میز مجازی بازی‌های رومیزی و D&D");
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const isSessionValid = Boolean(isAuthenticated && token && !isTokenExpired(token));

    useEffect(() => {
        if (token && isTokenExpired(token)) {
            useAuthStore.getState().logout?.();
        }
    }, [token]);

    useEffect(() => {
        document.documentElement.style.overflowY = 'auto';
        document.documentElement.style.height = 'auto';
        document.body.style.overflowY = 'auto';
        document.body.style.height = 'auto';

        const timer = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 250);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    const handleStartGame = () => {
        if (isSessionValid) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleOpenAuth = () => {
        navigate('/login');
    };

    // هدایت مستقیم به صفحه پروفایل کاربر با کلیک روی نام/آواتار در نوبار
    const handleOpenProfile = () => {
        navigate('/profile');
    };

    const handleOpenRoomCode = () => {
        if (isSessionValid) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleSelectScenario = () => {
        if (isSessionValid) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="w-full min-h-screen bg-white text-[#121316] flex flex-col items-center justify-start overflow-x-hidden selection:bg-[#f59e0b] selection:text-black">
            <div className="w-full flex flex-col relative">
                {/* نوبار مجهز به نام نمایشی و آواتار RPG متصل به روت پروفایل */}
                <Navbar
                    onOpenAuth={handleOpenAuth}
                    onOpenProfile={handleOpenProfile}
                    onOpenRoomCode={handleOpenRoomCode}
                    onStartGame={handleStartGame}
                    user={isSessionValid ? user : null}
                />

                {/* بخش هیرو متصل به اطلاعات کاربر جهت شخصی‌سازی خودکار المان‌ها */}
                <Hero
                    user={isSessionValid ? user : null}
                    onStartGame={handleStartGame}
                    onExploreMore={() => {
                        const el = document.getElementById('dice');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onDiceClick={() => {
                        const el = document.getElementById('dice');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                />

                {/* بیانیه فشرده */}
                <BigStatement />

                {/* استیج سه‌بعدی تاس */}
                <DiceSection />

                {/* سناریوها */}
                <ScenariosSection onSelectScenario={handleSelectScenario} />

                {/* پنل دانجن‌مستر */}
                <GameMasterSection />

                {/* کارت تعاملی بازیکن */}
                <PlayerSection />

                {/* توالی قابلیت‌های ۶گانه */}
                <FeaturesSequence />

                {/* مراحل شروع سریع */}
                <HowItWorks onStartGame={handleStartGame} />

                {/* هویت فارسی */}
                <PersianBrandSection />

                {/* دعوت به اقدام پایانی */}
                <FinalCta
                    onStartGame={handleStartGame}
                    onOpenAuth={handleOpenAuth}
                />

                {/* فوتر */}
                <Footer />
            </div>
        </div>
    );
}