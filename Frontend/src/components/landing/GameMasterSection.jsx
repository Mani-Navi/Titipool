import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import { Crown, Layers, Eye } from 'lucide-react';
import { sound } from '../../utils/tableAudio';
import { GsapHeadingReveal } from './GsapHeadingReveal';

export const GameMasterSection = memo(() => {
    const [activeLayer, setActiveLayer] = useState('tokens');

    return (
        <section id="gm" className="py-20 sm:py-32 px-4 sm:px-8 overflow-hidden" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                    <div className="lg:col-span-6 text-right">
                        <GsapHeadingReveal
                            align="right"
                            eyebrow="قدرت دانجن‌مستر · GM WORKBENCH"
                            lines={['برای ساختن دنیا،', 'همه‌چیز دست توست.']}
                            subtitle="نقشه را آماده کن. بازیکن‌ها را مدیریت کن. ماجراجویی را شروع کن."
                        />

                        <div className="mt-8 space-y-4">
                            {[
                                {
                                    id: 'map',
                                    title: 'آپلود بدون محدودیت نقشه',
                                    desc: 'تصویر نبرد را با هر ابعادی از کتابخانه است‌ها بارگذاری کنید و گرید را با یک کلیک تطبیق دهید.',
                                    icon: Layers,
                                },
                                {
                                    id: 'fog',
                                    title: 'کنترل کامل مه جنگ',
                                    desc: 'محیط را با مه پنهان کرده و با پیشروی بازیکنان، خط دید واقعی را آشکار کنید.',
                                    icon: Eye,
                                },
                                {
                                    id: 'tokens',
                                    title: 'چیدمان هیولاها و تله‌ها',
                                    desc: 'توکن‌های مخفی بسازید که تا زمان مناسب فقط برای دانجن‌مستر نمایان باشند.',
                                    icon: Crown,
                                },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.id}
                                        className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-start gap-3.5 text-right transition-all hover:border-neutral-400"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#d97706] shrink-0 mt-0.5">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-neutral-900">{item.title}</h4>
                                            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-6">
                        <div className="relative rounded-3xl bg-[#090a10] border border-[#242738] p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.18)] overflow-hidden text-right">
                            <div
                                className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)',
                                    backgroundSize: '32px 32px',
                                }}
                            />

                            <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1e2b] mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-[#271d0e] flex items-center justify-center text-[#f59e0b]">
                                        <Crown className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-white">میزبان: GM</span>
                                        <span className="text-[10px] text-neutral-400 mr-2">دسترسی کامل مدیریت</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>SYNCED</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 bg-[#12141e] p-1 rounded-xl border border-[#202334] text-xs text-neutral-400 mb-5">
                                {[
                                    { id: 'tokens', label: 'لایه توکن‌ها' },
                                    { id: 'fog', label: 'لایه مه' },
                                    { id: 'grid', label: 'لایه گرید' },
                                    { id: 'map', label: 'لایه نقشه' },
                                ].map((layer) => (
                                    <button
                                        key={layer.id}
                                        onClick={() => {
                                            sound.playTokenClick();
                                            setActiveLayer(layer.id);
                                        }}
                                        className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                                            activeLayer === layer.id
                                                ? 'bg-[#1e2233] text-[#f59e0b] shadow-sm'
                                                : 'hover:text-white'
                                        }`}
                                    >
                                        {layer.label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative h-64 sm:h-72 rounded-2xl bg-[#0e1017] border border-[#1e2130] overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-4 rounded-xl border border-dashed border-amber-500/20 bg-gradient-to-br from-[#12141f] to-[#0a0c12] p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                        <span>اتاق فرماندهی قلعه</span>
                                        <span className="font-mono">Grid: 5ft</span>
                                    </div>

                                    <div className="flex items-center justify-around">
                                        <motion.div
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                            className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-center"
                                        >
                                            <div className="text-2xl">🧙‍♂️</div>
                                            <div className="text-[10px] text-purple-300 font-bold mt-1">ویزارد</div>
                                            <div className="text-[9px] text-emerald-400 font-mono">HP 34/34</div>
                                        </motion.div>

                                        <motion.div
                                            animate={{ y: [0, 4, 0] }}
                                            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                                            className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-center"
                                        >
                                            <div className="text-2xl">🐉</div>
                                            <div className="text-[10px] text-rose-300 font-bold mt-1">اژدهای جوان</div>
                                            <div className="text-[9px] text-rose-400 font-mono">HP 110/110</div>
                                        </motion.div>
                                    </div>

                                    <div className="text-[10px] text-neutral-400 text-center">
                                        برای تغییر موقعیت، توکن را روی صفحه جابجا کنید.
                                    </div>
                                </div>

                                {activeLayer === 'fog' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-[2px] flex items-center justify-center p-6 text-center"
                                    >
                                        <div className="p-4 rounded-xl bg-[#161824] border border-[#2e3146]">
                                            <Eye className="w-5 h-5 text-[#f59e0b] mx-auto mb-1" />
                                            <div className="text-xs font-bold text-white">ویرایش مه جنگ فعال است</div>
                                            <div className="text-[10px] text-neutral-400 mt-1">
                                                با براش دستی بخش‌های دلخواه نقشه را برای بازیکنان پنهان یا آشکار کنید.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});

GameMasterSection.displayName = "GameMasterSection";
export default GameMasterSection;