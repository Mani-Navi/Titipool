import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Compass,
    Eye,
    EyeOff,
    Mic,
    MicOff,
    Grid,
    Image as ImageIcon,
    Zap,
    CheckCircle2,
    MousePointer,
    Hand,
    Pencil,
    Type,
    Ruler,
    Dices,
    Settings,
    Scissors,
    Circle,
    Square,
    PenTool,
    MapPin,
    Sparkles,
    Upload,
} from 'lucide-react';
import { sound } from '../../utils/tableAudio';
import { FEATURES } from '../../data/landingData';
import { GsapHeadingReveal } from './GsapHeadingReveal';

const FEATURE_ICONS = Object.freeze([Compass, Eye, Mic, Grid, ImageIcon, Zap]);

export const FeaturesSequence = memo(() => {
    const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);
    const current = FEATURES[selectedFeatureIndex];

    const [isFogCovered, setIsFogCovered] = useState(true);
    const [fogAction, setFogAction] = useState('reveal');
    const [fogBrush, setFogBrush] = useState('circle');
    const [isMicOn, setIsMicOn] = useState(false);
    const [gridType, setGridType] = useState('square');
    const [gridSize, setGridSize] = useState(60);
    const [isSnapping, setIsSnapping] = useState(true);
    const [assetTab, setAssetTab] = useState('maps');
    const [tokenPos, setTokenPos] = useState({ x: 140, y: 55 });

    const handleSelect = useCallback((idx) => {
        sound.playTokenClick();
        setSelectedFeatureIndex(idx);
    }, []);

    return (
        <section id="features" className="py-16 sm:py-28 px-3 sm:px-8 overflow-hidden w-full" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <GsapHeadingReveal
                    eyebrow="معماری فنی و قابلیت‌ها · DEEP FEATURES"
                    lines={['تکامل ابزارهای بازی،', 'روی میز مجازی.']}
                    subtitle="رابط‌های کاربری زیر دقیقاً همان ابزارهای زنده، مدرن و شیشه‌ای هستند که در اتاق بازی تجربه می‌کنید."
                    containerClassName="max-w-2xl mx-auto mb-8 sm:mb-14 pt-2 sm:pt-4"
                />

                <div
                    className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 sm:pb-4 mb-6 sm:mb-12 border-b border-neutral-200 scrollbar-none"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {FEATURES.map((item, idx) => {
                        const isSelected = selectedFeatureIndex === idx;
                        const Icon = FEATURE_ICONS[idx];
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(idx)}
                                aria-label={`مشاهده قابلیت: ${item.title}`}
                                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                    isSelected
                                        ? 'bg-neutral-950 text-white shadow-md'
                                        : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#f59e0b]' : ''}`} aria-hidden="true" />
                                <span className="font-mono text-[10px] sm:text-[11px] opacity-70">{item.number}</span>
                                <span className="text-[11px] sm:text-xs">{item.title}</span>
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-3xl bg-[#090a10] border border-[#222434] p-4 sm:p-10 md:p-12 shadow-[0_30px_90px_rgba(0,0,0,0.2)] text-right overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transform-gpu" />

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center relative z-10">
                            <div className="lg:col-span-5">
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <span className="font-mono text-2xl sm:text-3xl font-black text-[#f59e0b]">
                                        {current.number}
                                    </span>
                                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#181b28] border border-[#2b3044] text-[10px] sm:text-[11px] font-mono text-neutral-300">
                                        {current.badge}
                                    </span>
                                </div>

                                <h3 className="text-xl sm:text-3xl font-black text-white mt-3 sm:mt-4 tracking-tight leading-snug">
                                    {current.headline}
                                </h3>

                                <p className="text-xs sm:text-sm text-neutral-300 mt-2.5 sm:mt-4 leading-relaxed">
                                    {current.description}
                                </p>

                                <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-2.5">
                                    {current.details.map((detail, dIdx) => (
                                        <div key={dIdx} className="flex items-start gap-2 sm:gap-2.5 text-xs text-neutral-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f59e0b] shrink-0 mt-0.5" aria-hidden="true" />
                                            <span>{detail}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-7">
                                <div className="rounded-2xl bg-[#0d0f17] border border-[#232637] p-2.5 sm:p-4 shadow-2xl relative overflow-hidden min-h-[350px] sm:min-h-[380px] flex flex-col justify-center">
                                    {current.mockUiType === 'map' && (
                                        <div className="space-y-3">
                                            <div className="relative h-56 sm:h-60 rounded-xl bg-[#07080d] border border-zinc-800 overflow-hidden select-none touch-none">
                                                <div
                                                    className="absolute inset-0 opacity-20 pointer-events-none"
                                                    style={{
                                                        backgroundImage: 'linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)',
                                                        backgroundSize: '36px 36px',
                                                    }}
                                                />

                                                <motion.div
                                                    drag
                                                    dragMomentum={false}
                                                    dragConstraints={{ left: 10, right: 280, top: 10, bottom: 110 }}
                                                    style={{ x: tokenPos.x, y: tokenPos.y, touchAction: 'none' }}
                                                    onDragEnd={(_, info) => setTokenPos((prev) => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }))}
                                                    className="absolute z-20 cursor-grab active:cursor-grabbing flex flex-col items-center select-none touch-none"
                                                >
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-lg sm:text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                                        🧙‍♂️
                                                    </div>
                                                    <div className="mt-1 px-1.5 py-0.2 rounded bg-zinc-950/90 border border-zinc-700 text-[8px] sm:text-[9px] text-white font-bold">
                                                        ویزارد (مانی)
                                                    </div>
                                                    <div className="w-8 sm:w-10 h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5 border border-zinc-700">
                                                        <div className="w-[85%] h-full bg-emerald-400 rounded-full" />
                                                    </div>
                                                </motion.div>

                                                <div className="absolute bottom-2 left-2 flex items-center gap-1 p-1 bg-zinc-950/90 border border-zinc-800 rounded-lg text-[9px] sm:text-[10px] text-zinc-300">
                                                    <span>100%</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center overflow-x-auto py-1">
                                                <div className="flex items-center gap-1 p-1 sm:p-1.5 bg-zinc-950/90 border border-zinc-800/90 rounded-2xl shadow-xl backdrop-blur-2xl">
                                                    <button type="button" aria-label="ابزار انتخاب" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-zinc-950 font-bold flex items-center justify-center shadow-md">
                                                        <MousePointer className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label="ابزار حرکت در نقشه" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center">
                                                        <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label="ابزار مداد و ترسیم" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center">
                                                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label="ابزار نوشتار" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center">
                                                        <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label="ابزار مه جنگ" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center">
                                                        <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label="ابزار خط‌کش" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center">
                                                        <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                    <div className="h-4 sm:h-5 w-px bg-zinc-800 mx-0.5" />
                                                    <button type="button" aria-label="پرتاب تاس" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-amber-400 flex items-center justify-center">
                                                        <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label="کتابخانه منابع" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center">
                                                        <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label="تنظیمات" className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center">
                                                        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {current.mockUiType === 'fog' && (
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="relative h-40 sm:h-44 rounded-xl bg-[#090a10] border border-zinc-800 overflow-hidden flex items-center justify-center">
                                                <div
                                                    className="absolute inset-0 opacity-20 pointer-events-none"
                                                    style={{
                                                        backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)',
                                                        backgroundSize: '24px 24px',
                                                    }}
                                                />
                                                <div className="text-xl sm:text-2xl">🏰 تالار سلطنتی</div>

                                                <div
                                                    className={`absolute inset-0 bg-zinc-950/90 transition-opacity duration-300 flex items-center justify-center ${
                                                        isFogCovered ? 'opacity-90' : 'opacity-0'
                                                    }`}
                                                >
                                                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-amber-400 font-bold flex items-center gap-1.5 shadow-lg">
                                                        <EyeOff className="w-4 h-4" />
                                                        <span>محیط در تاریکی پنهان است</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center">
                                                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-2xl text-zinc-100 flex-wrap justify-center">
                                                    <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                sound.playTokenClick();
                                                                setFogAction('reveal');
                                                                setIsFogCovered(false);
                                                            }}
                                                            aria-label="آشکارسازی مه جنگ"
                                                            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                                                fogAction === 'reveal'
                                                                    ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                                                                    : 'text-zinc-400 hover:text-white'
                                                            }`}
                                                        >
                                                            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                                                            <span>آشکارساز</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                sound.playTokenClick();
                                                                setFogAction('hide');
                                                                setIsFogCovered(true);
                                                            }}
                                                            aria-label="پوشاندن با مه جنگ"
                                                            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                                                fogAction === 'hide'
                                                                    ? 'bg-rose-600 text-white shadow-md'
                                                                    : 'text-zinc-400 hover:text-white'
                                                            }`}
                                                        >
                                                            <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                                                            <span>پوشاندن</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                sound.playTokenClick();
                                                                setFogAction('slice');
                                                            }}
                                                            aria-label="برش خطی مه"
                                                            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                                                                fogAction === 'slice'
                                                                    ? 'bg-purple-600 text-white shadow-md'
                                                                    : 'text-zinc-400 hover:text-white'
                                                            }`}
                                                        >
                                                            <Scissors className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                                                            <span>برش</span>
                                                        </button>
                                                    </div>

                                                    <div className="h-4 sm:h-5 w-px bg-zinc-800 mx-0.5" />

                                                    {/* اشکال براش */}
                                                    <div className="flex items-center gap-0.5 p-0.5 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                                        {[
                                                            { id: 'circle', label: 'براش دایره‌ای', icon: Circle },
                                                            { id: 'rect', label: 'براش مستطیلی', icon: Square },
                                                            { id: 'poly', label: 'براش چندضلعی', icon: PenTool },
                                                        ].map((sh) => {
                                                            const Icon = sh.icon;
                                                            return (
                                                                <button
                                                                    key={sh.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        sound.playTokenClick();
                                                                        setFogBrush(sh.id);
                                                                    }}
                                                                    aria-label={sh.label}
                                                                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all ${
                                                                        fogBrush === sh.id
                                                                            ? 'bg-zinc-800 text-amber-400 border border-amber-500/50 font-bold'
                                                                            : 'text-zinc-400 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="h-4 sm:h-5 w-px bg-zinc-800 mx-0.5" />

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            sound.playTokenClick();
                                                            setIsFogCovered(!isFogCovered);
                                                        }}
                                                        aria-label={isFogCovered ? 'خالی کردن مه' : 'پر کردن کامل مه'}
                                                        className="px-2 sm:px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-[11px] sm:text-xs font-bold text-zinc-300 hover:text-white cursor-pointer active:scale-95"
                                                    >
                                                        {isFogCovered ? 'خالی کردن مه' : 'Fill Fog'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {current.mockUiType === 'voice' && (
                                        <div className="space-y-2.5 sm:space-y-3">
                                            <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2">
                                                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs">
                                                    <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                                                        <Dices className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>ماجراجویی D&D</span>
                                                    </div>
                                                    <span className="font-mono text-amber-400 text-[10px] sm:text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                                        کد: 75B4EE
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/50 shadow-sm">
                                                    <div className="flex items-center gap-2 sm:gap-2.5">
                                                        <div className="relative">
                                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                                                                MA
                                                            </div>
                                                            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 absolute -bottom-0.5 -right-0.5 animate-pulse" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                                                <span>Mani (میزبان)</span>
                                                                <div className="flex items-center gap-[2px]">
                                                                    <div className="w-[2px] h-2 bg-amber-400 rounded-full animate-pulse" />
                                                                    <div className="w-[2px] h-3 bg-amber-400 rounded-full animate-bounce" />
                                                                    <div className="w-[2px] h-2 bg-amber-400 rounded-full animate-pulse" />
                                                                </div>
                                                            </div>
                                                            <div className="text-[9px] sm:text-[10px] text-zinc-400">دانجن‌مستر (DM)</div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                        میزبان
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
                                                    <div className="flex items-center gap-2 sm:gap-2.5">
                                                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold text-xs">
                                                            AM
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-zinc-200">امیر (پالادین)</div>
                                                            <div className="text-[9px] sm:text-[10px] text-zinc-400">بازیکن آنلاین</div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400">
                                                        بازیکن
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const nextState = !isMicOn;
                                                    setIsMicOn(nextState);
                                                    sound.playPttBeep(nextState);
                                                }}
                                                aria-label={isMicOn ? 'قطع میکروفون' : 'اتصال میکروفون'}
                                                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md select-none active:scale-[0.98] ${
                                                    isMicOn
                                                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-750'
                                                }`}
                                            >
                                                {isMicOn ? <Mic className="w-4 h-4 text-zinc-950" /> : <MicOff className="w-4 h-4" />}
                                                <span>{isMicOn ? 'میکروفون فعال (برای قطع کلیک کنید)' : 'میکروفون غیرفعال (برای وصل کلیک کنید)'}</span>
                                            </button>
                                        </div>
                                    )}

                                    {current.mockUiType === 'grid' && (
                                        <div className="space-y-2.5 sm:space-y-3">
                                            <div className="bg-zinc-950/95 border border-zinc-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2 sm:space-y-2.5">
                                                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-xs font-bold text-zinc-200">
                                                    <span className="flex items-center gap-1.5">
                                                        <Grid className="w-4 h-4 text-amber-400" />
                                                        <span>پیکربندی گرید تاکتیکال</span>
                                                    </span>
                                                    <span className="text-[10px] text-amber-400 font-mono">GM Panel</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                                                    {[
                                                        { id: 'square', label: 'مربعی (Square)', desc: 'استاندارد D&D 5e' },
                                                        { id: 'isometric', label: 'لوزی (Isometric)', desc: 'دید پرسپکتیو' },
                                                        { id: 'hex_h', label: 'شش‌ضلعی افقی', desc: 'Hex Flat-Top' },
                                                        { id: 'hex_v', label: 'شش‌ضلعی عمودی', desc: 'Hex Pointy-Top' },
                                                    ].map((gt) => (
                                                        <button
                                                            key={gt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                sound.playTokenClick();
                                                                setGridType(gt.id);
                                                            }}
                                                            aria-label={`تغییر نوع گرید به ${gt.label}`}
                                                            className={`p-1.5 sm:p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-0.5 ${
                                                                gridType === gt.id
                                                                    ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 font-bold'
                                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                                                            }`}
                                                        >
                                                            <span className="text-[10px] sm:text-[11px] font-bold">{gt.label}</span>
                                                            <span className="text-[8px] sm:text-[9px] text-zinc-400">{gt.desc}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="p-1.5 sm:p-2 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                                                    <span className="text-zinc-300 flex items-center gap-1 text-[11px]">
                                                        <Ruler className="w-3 h-3 text-amber-400" />
                                                        <span>محاسبه فاصله:</span>
                                                    </span>
                                                    <span className="font-mono text-amber-400 font-bold text-[10px] sm:text-[11px]">
                                                        قانون D&D 5e (۵، ۱۰، ۱۵)
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-zinc-300 text-[11px]">اندازه سلول:</span>
                                                        <span className="font-mono text-amber-400 font-bold text-xs">{gridSize} px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={30}
                                                        max={100}
                                                        value={gridSize}
                                                        onChange={(e) => setGridSize(Number(e.target.value))}
                                                        aria-label="تنظیم اندازه سلول گرید"
                                                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[11px] sm:text-xs text-zinc-200 font-bold">چسبیدن به سلول‌ها (Snapping)</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsSnapping(!isSnapping)}
                                                        aria-label={isSnapping ? "غیرفعال کردن اسنپ گرید" : "فعال کردن اسنپ گرید"}
                                                        className={`w-9 h-4.5 sm:w-10 sm:h-5 rounded-full transition-colors relative cursor-pointer ${
                                                            isSnapping ? 'bg-amber-500' : 'bg-zinc-800'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-zinc-950 transition-transform absolute top-0.5 ${
                                                                isSnapping ? 'right-0.5' : 'right-4.5 sm:right-5.5'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {current.mockUiType === 'assets' && (
                                        <div className="space-y-2.5 sm:space-y-3">
                                            <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2 sm:space-y-2.5">
                                                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                                            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        </div>
                                                        <span className="text-xs font-bold text-zinc-100">کتابخانه منابع (Asset Library)</span>
                                                    </div>
                                                    <span className="text-[9px] sm:text-[10px] text-zinc-400">ذخیره ابری</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAssetTab('maps')}
                                                        aria-label="تب نقشه‌ها"
                                                        className={`flex items-center justify-center gap-1 py-1 text-xs font-bold rounded-lg transition-all ${
                                                            assetTab === 'maps'
                                                                ? 'bg-amber-500 text-zinc-950 font-black'
                                                                : 'text-zinc-400 hover:text-white'
                                                        }`}
                                                    >
                                                        <MapPin className="w-3 h-3" />
                                                        <span>نقشه‌ها</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setAssetTab('tokens')}
                                                        aria-label="تب توکن‌ها"
                                                        className={`flex items-center justify-center gap-1 py-1 text-xs font-bold rounded-lg transition-all ${
                                                            assetTab === 'tokens'
                                                                ? 'bg-amber-500 text-zinc-950 font-black'
                                                                : 'text-zinc-400 hover:text-white'
                                                        }`}
                                                    >
                                                        <Sparkles className="w-3 h-3" />
                                                        <span>توکن‌ها</span>
                                                    </button>
                                                </div>

                                                {assetTab === 'maps' ? (
                                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                                        <div className="group rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 hover:border-amber-500 cursor-pointer transition-all">
                                                            <div className="h-14 sm:h-16 bg-gradient-to-br from-amber-950 to-zinc-900 flex items-center justify-center text-lg sm:text-xl">
                                                                🏰
                                                            </div>
                                                            <div className="p-1 sm:p-1.5 bg-zinc-900/90 flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-zinc-200">
                                                                <span>قلعه باستانی</span>
                                                                <MapPin className="w-3 h-3 text-amber-400" />
                                                            </div>
                                                        </div>

                                                        <div className="group rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 hover:border-amber-500 cursor-pointer transition-all">
                                                            <div className="h-14 sm:h-16 bg-gradient-to-br from-purple-950 to-zinc-900 flex items-center justify-center text-lg sm:text-xl">
                                                                🌲
                                                            </div>
                                                            <div className="p-1 sm:p-1.5 bg-zinc-900/90 flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-zinc-200">
                                                                <span>جنگل مه مرموز</span>
                                                                <MapPin className="w-3 h-3 text-amber-400" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                                                        {['🧙‍♂️ ویزارد', '🛡️ پالادین', '🐉 اژدها'].map((tok, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="p-1 sm:p-1.5 rounded-xl border border-zinc-800 bg-zinc-900 flex flex-col items-center gap-0.5 sm:gap-1 hover:border-amber-500 cursor-pointer transition-all"
                                                            >
                                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 border border-amber-500/30 flex items-center justify-center text-base sm:text-lg">
                                                                    {tok.split(' ')[0]}
                                                                </div>
                                                                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-300 truncate max-w-full">
                                                                    {tok.split(' ')[1]}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <button type="button" aria-label="آپلود فایل به کتابخانه" className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md">
                                                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                                                    <span>آپلود فایل جدید</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {current.mockUiType === 'sync' && (
                                        <div className="space-y-2.5 sm:space-y-3">
                                            <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-xl space-y-2 sm:space-y-3">
                                                <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-zinc-800 text-xs">
                                                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] sm:text-xs">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                        <span>STOMP Connected</span>
                                                    </div>
                                                    <span className="font-mono text-zinc-400 text-[10px] sm:text-[11px]">Ping: 34ms</span>
                                                </div>

                                                <div className="space-y-1.5 font-mono text-[10px] sm:text-[11px]">
                                                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                                                        <span className="text-amber-400 truncate">GM: Token_Move (X:180, Y:120)</span>
                                                        <span className="text-emerald-400 text-[9px] sm:text-[10px] shrink-0 mr-1">ACK 12ms</span>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                                                        <span className="text-indigo-400 truncate">Player 1: Roll D20 -&gt; Nat 20!</span>
                                                        <span className="text-emerald-400 text-[9px] sm:text-[10px] shrink-0 mr-1">SYNCED</span>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                                                        <span className="text-purple-400 truncate">GM: Fog_Slice (Layer 2)</span>
                                                        <span className="text-emerald-400 text-[9px] sm:text-[10px] shrink-0 mr-1">BROADCAST</span>
                                                    </div>
                                                </div>

                                                <div className="text-[10px] sm:text-[11px] text-zinc-400 text-center font-bold flex items-center justify-center gap-1 text-emerald-400">
                                                    <span>تأخیر زیر ۵۰ میلی‌ثانیه در سراسر کشور</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
});

FeaturesSequence.displayName = "FeaturesSequence";
export default FeaturesSequence;