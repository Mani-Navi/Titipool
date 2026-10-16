import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DiceCanvas } from './DiceCanvas';
import { useDiceStore } from '../state/dice.store';
import { DICE_THEMES } from '../engine/textureGenerator';
import { diceAudio } from '../engine/diceAudio';
import { RotateCcw, X, Trash2, Dices, Zap, User, Sparkles, Coins, Flame } from 'lucide-react';
import { cn } from '../../../utils/cn';

const ALL_DICE_BUTTONS = Object.freeze([
    { type: 'd2', label: 'D2 سکه', maxVal: 2, icon: Coins },
    { type: 'd4', label: 'D4', maxVal: 4 },
    { type: 'd6', label: 'D6', maxVal: 6 },
    { type: 'forge', label: 'Forge', maxVal: 2, icon: Flame },
    { type: 'd8', label: 'D8', maxVal: 8 },
    { type: 'd10', label: 'D10', maxVal: 9 },
    { type: 'd12', label: 'D12', maxVal: 12 },
    { type: 'd20', label: 'D20', maxVal: 20 },
    { type: 'd100', label: 'D100', maxVal: 100 },
    { type: 'd1000', label: 'D1000', maxVal: 900 },
]);

const FORGE_SYMBOL_MAP = Object.freeze({
    2: '⚒️ +2',
    '-2': '💀 -2',
    1: '⚔️ +1',
    '-1': '🔥 -1',
    0: '⚡ 0',
});

export function DiceOverlay() {
    const isOpen = useDiceStore((s) => s.isOpen);
    const isRolling = useDiceStore((s) => s.isRolling);
    const results = useDiceStore((s) => s.results);
    const totalSum = useDiceStore((s) => s.totalSum);
    const rollerName = useDiceStore((s) => s.rollerName);
    const isRemoteRoll = useDiceStore((s) => s.isRemoteRoll);
    const setOpen = useDiceStore((s) => s.setOpen);
    const triggerRoll = useDiceStore((s) => s.triggerRoll);
    const clearDice = useDiceStore((s) => s.clearDice);
    const activeDiceLength = useDiceStore((s) => s.activeDice.length);
    const selectedTheme = useDiceStore((s) => s.selectedTheme);
    const setSelectedTheme = useDiceStore((s) => s.setSelectedTheme);

    const [mode, setMode] = useState('quick');
    // استخر تاس حاوی آیتم‌های تفکیک‌شده با تم مشخص: [{ id, type, theme }]
    const [dicePool, setDicePool] = useState([]);
    const [lastRollSpecs, setLastRollSpecs] = useState([{ type: 'd20', theme: selectedTheme }]);
    const playedCritAudioRef = useRef(false);

    const isAnyCritical = useMemo(() => {
        if (results.length === 0 || isRolling) return false;
        return results.some((r) => {
            const config = ALL_DICE_BUTTONS.find((d) => d.type === r.type);
            if (!config) return false;
            if (r.type === 'd10') return r.value === 0 || r.value === 9;
            return r.value === config.maxVal;
        });
    }, [results, isRolling]);

    useEffect(() => {
        if (isAnyCritical && !playedCritAudioRef.current) {
            diceAudio.playCriticalSuccess();
            playedCritAudioRef.current = true;
        }
        if (isRolling) {
            playedCritAudioRef.current = false;
        }
    }, [isAnyCritical, isRolling]);

    const handleQuickRoll = useCallback((type) => {
        let specs = [];
        if (type === 'd100') {
            specs = [
                { type: 'd100', theme: selectedTheme },
                { type: 'd10', theme: selectedTheme },
            ];
        } else {
            specs = [{ type, theme: selectedTheme }];
        }
        setLastRollSpecs(specs);
        triggerRoll(specs);
    }, [selectedTheme, triggerRoll]);

    const handleAddDieToPool = useCallback((type) => {
        setDicePool((prev) => [
            ...prev,
            {
                id: `pool-${Date.now()}-${Math.random()}`,
                type,
                theme: selectedTheme,
            },
        ]);
    }, [selectedTheme]);

    const handleRemoveDieFromPool = useCallback((index, e) => {
        e.stopPropagation();
        setDicePool((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleClearPool = useCallback(() => {
        setDicePool([]);
    }, []);

    const handleRollPool = useCallback(() => {
        if (dicePool.length === 0) return;
        setLastRollSpecs(dicePool);
        triggerRoll(dicePool);
    }, [dicePool, triggerRoll]);

    const handleReRoll = useCallback(() => {
        if (lastRollSpecs.length > 0) {
            triggerRoll(lastRollSpecs);
        } else {
            triggerRoll([{ type: 'd20', theme: selectedTheme }]);
        }
    }, [lastRollSpecs, selectedTheme, triggerRoll]);

    const formatDieDisplayValue = (r) => {
        if (r.type === 'd2') {
            return r.value === 1 ? 'شیر' : 'خط';
        }
        if (r.type === 'forge') {
            return FORGE_SYMBOL_MAP[r.value] || r.value;
        }
        if (r.type === 'd1000') {
            return String(r.value).padStart(3, '0');
        }
        return r.value;
    };

    if (!isOpen && activeDiceLength === 0) return null;

    return (
        <div className="fixed inset-0 z-[110] pointer-events-none select-none font-fa" dir="rtl">
            <div className="absolute inset-0">
                <DiceCanvas overlayMode={true} />
            </div>

            {/* بنر نتیجه نهایی: اسکرول‌پذیر و ضد بیرون‌زدگی از صفحه */}
            {results.length > 0 && (
                <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1.5 max-w-[95vw] sm:max-w-2xl w-auto animate-fade-in-up">
                    <div
                        className={cn(
                            "flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-3xl backdrop-blur-2xl transition-all duration-300 shadow-2xl w-full border",
                            isAnyCritical
                                ? "bg-gradient-to-b from-amber-950/95 via-zinc-950/95 to-zinc-950/95 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)]"
                                : "bg-zinc-950/95 border-zinc-800 shadow-[0_12px_45px_rgba(0,0,0,0.8)]"
                        )}
                    >
                        {/* هدر نتیجه و مجموع کل */}
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-2">
                            <div className="flex items-center gap-2">
                                {isAnyCritical && (
                                    <div className="flex items-center gap-1 text-amber-300 text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/50 animate-pulse">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                                        <span>کریتیکال!</span>
                                    </div>
                                )}

                                {isRemoteRoll && rollerName ? (
                                    <div className="flex items-center gap-1 text-amber-300 text-xs font-bold">
                                        <User className="w-3.5 h-3.5 text-amber-400" />
                                        <span>{rollerName}:</span>
                                    </div>
                                ) : (
                                    <span className="text-zinc-400 text-xs font-semibold">مجموع امتیاز:</span>
                                )}

                                <span
                                    className={cn(
                                        "text-2xl sm:text-3xl font-black font-mono tracking-tight",
                                        isRolling
                                            ? "text-zinc-500 animate-pulse"
                                            : isAnyCritical
                                                ? "text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.85)]"
                                                : "text-amber-400"
                                    )}
                                >
                                    {totalSum}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {!isRemoteRoll && (
                                    <button
                                        type="button"
                                        onClick={handleReRoll}
                                        className="p-1.5 text-zinc-400 hover:text-amber-300 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                        title="پرتاب مجدد تمام تاس‌ها"
                                        aria-label="پرتاب مجدد"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => clearDice()}
                                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                    title="بستن"
                                    aria-label="بستن کارت نتایج"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* گرید هوشمند نمایش ریزالت و تم هر تاس با اسکرول ارگونومیک */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[38vh] overflow-y-auto pr-1 custom-scrollbar">
                            {results.map((r) => {
                                const themeCfg = DICE_THEMES[r.theme] || DICE_THEMES.midnight;
                                const cfg = ALL_DICE_BUTTONS.find((d) => d.type === r.type);
                                const isCritDie = cfg && (r.value === cfg.maxVal || (r.type === 'd10' && r.value === 0));

                                return (
                                    <div
                                        key={r.id}
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded-xl border text-xs transition-all",
                                            isCritDie
                                                ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)]"
                                                : "bg-zinc-900/80 border-zinc-800 text-zinc-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {/* نشانگر رنگ تم اختصاصی تاس */}
                                            <span
                                                className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                                                style={{ background: themeCfg.bgCenter }}
                                                title={`تم: ${themeCfg.name}`}
                                            />
                                            <span className="font-mono uppercase font-bold text-[11px] text-zinc-400">
                                                {r.type}
                                            </span>
                                        </div>

                                        <span className="font-mono font-black text-sm text-amber-300">
                                            {formatDieDisplayValue(r)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* داک شناور پرتاب تاس با قابلیت چندرنگی */}
            {isOpen && !isRemoteRoll && (
                <div className="absolute bottom-20 sm:bottom-6 left-3 sm:left-6 pointer-events-auto flex flex-col gap-2 max-w-[94vw] animate-fade-in-up">
                    {/* استخر تاس‌های چندرنگ */}
                    {mode === 'pool' && dicePool.length > 0 && (
                        <div className="bg-zinc-950/95 border border-amber-500/30 p-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 max-w-md w-full">
                            <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                {dicePool.map((item, idx) => {
                                    const tCfg = DICE_THEMES[item.theme] || DICE_THEMES.midnight;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={(e) => handleRemoveDieFromPool(idx, e)}
                                            title="کلیک برای حذف"
                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold hover:border-rose-500 hover:text-rose-300 transition-all cursor-pointer shadow-sm active:scale-95"
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ background: tCfg.bgCenter }}
                                            />
                                            <span className="uppercase text-[11px]">{item.type}</span>
                                            <span className="text-[10px] text-zinc-500">×</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleClearPool}
                                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                    title="پاکسازی استخر"
                                    aria-label="پاکسازی تمام تاس‌های استخر"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRollPool}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Dices className="w-3.5 h-3.5" />
                                    <span>پرتاب ({dicePool.length})</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ردیف دکمه‌های کنترل و انتخاب تاس‌ها */}
                    <div className="flex items-center gap-1.5 bg-zinc-950/95 border border-zinc-800/80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-x-auto max-w-[92vw] sm:max-w-none">
                        {/* انتخاب‌گر تم فعال (هر تاس با تم انتخابی فعلی به استخر اضافه می‌شود) */}
                        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 shrink-0">
                            {Object.values(DICE_THEMES).map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setSelectedTheme(t.id)}
                                    title={`تم ${t.name} (کلیک برای فعال‌سازی)`}
                                    aria-label={`انتخاب تم ${t.name}`}
                                    className={cn(
                                        "w-5 h-5 rounded-full transition-all duration-150 relative cursor-pointer active:scale-90",
                                        selectedTheme === t.id
                                            ? "ring-2 ring-amber-400 scale-110 shadow-[0_0_8px_rgba(251,191,36,0.6)] z-10"
                                            : "opacity-60 hover:opacity-100"
                                    )}
                                    style={{
                                        background: `linear-gradient(135deg, ${t.bgCenter} 0%, ${t.bgEdge} 100%)`,
                                        border: `1.5px solid ${t.borderColor || '#ca8a04'}`,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="w-px h-5 bg-zinc-800 shrink-0 mx-0.5" />

                        {/* تغییر حالت بین پرتاب سریع و استخر */}
                        <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-xl border border-zinc-800 shrink-0">
                            <button
                                type="button"
                                onClick={() => setMode('quick')}
                                aria-label="پرتاب سریع تک‌تاس"
                                className={cn(
                                    "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
                                    mode === 'quick' ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                                )}
                                title="پرتاب سریع تک‌تاس"
                            >
                                <Zap className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('pool')}
                                aria-label="حالت استخر پرتاب همزمان چند تاس"
                                className={cn(
                                    "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
                                    mode === 'pool' ? "bg-amber-500 text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                                )}
                                title="استخر پرتاب همزمان چند تاس با رنگ‌های مختلف"
                            >
                                <Dices className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="w-px h-5 bg-zinc-800 shrink-0 mx-0.5" />

                        {/* لیست کامل ۱۰ نوع تاس */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            {ALL_DICE_BUTTONS.map((d) => {
                                const IconComp = d.icon;
                                const inPoolCount = dicePool.filter((item) => item.type === d.type).length;

                                return (
                                    <button
                                        key={d.type}
                                        type="button"
                                        onClick={() => {
                                            if (mode === 'quick') {
                                                handleQuickRoll(d.type);
                                            } else {
                                                handleAddDieToPool(d.type);
                                            }
                                        }}
                                        aria-label={`تاس ${d.label}`}
                                        className="relative px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-amber-200 font-mono text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                                    >
                                        {IconComp && <IconComp className="w-3.5 h-3.5 text-amber-400" />}
                                        <span>{d.label}</span>
                                        {mode === 'pool' && inPoolCount > 0 && (
                                            <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-sans font-black flex items-center justify-center -mr-1">
                                                {inPoolCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="w-px h-5 bg-zinc-800 shrink-0 mx-0.5" />

                        <button
                            type="button"
                            onClick={() => {
                                clearDice();
                                setOpen(false);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer shrink-0"
                            title="بستن منوی تاس"
                            aria-label="بستن منوی تاس"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DiceOverlay;