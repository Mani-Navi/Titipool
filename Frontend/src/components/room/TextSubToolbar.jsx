import React, { useState, useEffect, useRef, memo } from "react";
import {
    Bold,
    Italic,
    Heading1,
    Heading2,
    Smile,
    Palette,
    Layers,
    Check,
} from "lucide-react";
import { useCanvasStore } from "../../stores/canvas.store";
import { TOOLS } from "../../constants/tools";
import { cn } from "../../utils/cn";

const EMOJI_LIST = Object.freeze([
    "⚔️", "🛡️", "🐉", "💀", "🔥",
    "💎", "📜", "🏹", "✨", "🎲",
    "❤️", "☠️", "👑", "🗡️", "🪄",
]);

const TEXT_FONTS_LIST = Object.freeze([
    { id: "Vazirmatn", label: "وزیرمتن (اصلی)" },
    { id: "Sahel", label: "ساحل" },
    { id: "Shabnam", label: "شبنم" },
    { id: "Lalezar", label: "لاله‌زار (عنوان)" },
    { id: "Cinzel", label: "Cinzel (فانتزی)" },
    { id: "Arial", label: "Arial" },
]);

const PRESET_COLORS = Object.freeze([
    "#f59e0b",
    "#ef4444",
    "#10b981",
    "#38bdf8",
    "#a855f7",
    "#ffffff",
    "#000000",
]);

export const TextSubToolbar = memo(() => {
    const activeTool = useCanvasStore((state) => state.activeTool);

    const textFontFamily = useCanvasStore((state) => state.textFontFamily);
    const setTextFontFamily = useCanvasStore((state) => state.setTextFontFamily);

    const textColor = useCanvasStore((state) => state.textColor);
    const setTextColor = useCanvasStore((state) => state.setTextColor);

    const textIsBold = useCanvasStore((state) => state.textIsBold);
    const setTextIsBold = useCanvasStore((state) => state.setTextIsBold);

    const textIsItalic = useCanvasStore((state) => state.textIsItalic);
    const setTextIsItalic = useCanvasStore((state) => state.setTextIsItalic);

    const textHeading = useCanvasStore((state) => state.textHeading);
    const setTextHeading = useCanvasStore((state) => state.setTextHeading);

    const textHasStroke = useCanvasStore((state) => state.textHasStroke);
    const setTextHasStroke = useCanvasStore((state) => state.setTextHasStroke);

    const textStrokeColor = useCanvasStore((state) => state.textStrokeColor);
    const setTextStrokeColor = useCanvasStore((state) => state.setTextStrokeColor);

    const textStrokeWidth = useCanvasStore((state) => state.textStrokeWidth);
    const setTextStrokeWidth = useCanvasStore((state) => state.setTextStrokeWidth);

    const setPendingEmoji = useCanvasStore((state) => state.setPendingEmoji);

    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const [isColorOpen, setIsColorOpen] = useState(false);
    const [isStrokeMenuOpen, setIsStrokeMenuOpen] = useState(false);

    const textContainerRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (textContainerRef.current && !textContainerRef.current.contains(e.target)) {
                setIsEmojiOpen(false);
                setIsColorOpen(false);
                setIsStrokeMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
        };
    }, []);

    if (activeTool !== TOOLS.TEXT) return null;

    return (
        <div
            ref={textContainerRef}
            className="relative flex flex-wrap sm:flex-nowrap items-center justify-center gap-1 sm:gap-1.5 p-1.5 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl backdrop-blur-2xl text-zinc-200 max-w-[95vw] sm:max-w-none overflow-visible"
            dir="rtl"
        >
            <select
                value={textFontFamily}
                onChange={(e) => setTextFontFamily(e.target.value)}
                aria-label="انتخاب فونت متن"
                className="px-2 sm:px-2.5 h-8 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] sm:text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer max-w-[112px] sm:max-w-none truncate"
                style={{ fontFamily: textFontFamily }}
            >
                {TEXT_FONTS_LIST.map((font) => (
                    <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>
                        {font.label}
                    </option>
                ))}
            </select>

            <div className="hidden sm:block h-5 w-px bg-zinc-800 mx-0.5" aria-hidden="true" />

            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80">
                <button
                    type="button"
                    onClick={() => setTextIsBold(!textIsBold)}
                    aria-label="متن درشت (Bold)"
                    aria-pressed={textIsBold}
                    className={cn(
                        "w-7.5 h-7.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-90",
                        textIsBold ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-200"
                    )}
                    title="درشت (Bold)"
                >
                    <Bold className="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    onClick={() => setTextIsItalic(!textIsItalic)}
                    aria-label="متن مورب (Italic)"
                    aria-pressed={textIsItalic}
                    className={cn(
                        "w-7.5 h-7.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-90",
                        textIsItalic ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-200"
                    )}
                    title="مورب (Italic)"
                >
                    <Italic className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80">
                <button
                    type="button"
                    onClick={() => setTextHeading("h1")}
                    aria-label="تیتر بزرگ H1"
                    aria-pressed={textHeading === "h1"}
                    className={cn(
                        "w-7.5 h-7.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-90",
                        textHeading === "h1" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-200"
                    )}
                    title="تیتر بزرگ (H1)"
                >
                    <Heading1 className="w-3.5 h-3.5" />
                </button>

                <button
                    type="button"
                    onClick={() => setTextHeading("h2")}
                    aria-label="تیتر متوسط H2"
                    aria-pressed={textHeading === "h2"}
                    className={cn(
                        "w-7.5 h-7.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-90",
                        textHeading === "h2" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-200"
                    )}
                    title="تیتر متوسط (H2)"
                >
                    <Heading2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="hidden sm:block h-5 w-px bg-zinc-800 mx-0.5" aria-hidden="true" />

            <div className="sm:relative">
                <button
                    type="button"
                    onClick={() => {
                        setIsColorOpen(!isColorOpen);
                        setIsStrokeMenuOpen(false);
                        setIsEmojiOpen(false);
                    }}
                    aria-label="انتخاب رنگ نوشته"
                    className="flex items-center gap-1.5 px-2 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer active:scale-95"
                    title="انتخاب رنگ نوشته"
                >
                    <div
                        className="w-4 h-4 rounded-full border border-zinc-700 shadow-sm shrink-0"
                        style={{ backgroundColor: textColor }}
                    />
                    <Palette className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {isColorOpen && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 p-3 bg-zinc-950/98 border border-zinc-800 rounded-2xl shadow-2xl z-[100] flex flex-col gap-2 min-w-[165px] backdrop-blur-2xl animate-fade-in-up">
                        <span className="text-[10px] text-zinc-400 font-medium text-right">رنگ نوشته</span>
                        <div className="grid grid-cols-4 gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                        setTextColor(c);
                                        setIsColorOpen(false);
                                    }}
                                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg border border-zinc-700 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                    style={{ backgroundColor: c }}
                                >
                                    {textColor === c && (
                                        <Check
                                            className={cn("w-3.5 h-3.5", c === "#ffffff" ? "text-zinc-950" : "text-white")}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="sm:relative">
                <button
                    type="button"
                    onClick={() => {
                        setIsStrokeMenuOpen(!isStrokeMenuOpen);
                        setIsColorOpen(false);
                        setIsEmojiOpen(false);
                    }}
                    aria-label="تنظیمات حاشیه دور متن"
                    className={cn(
                        "flex items-center gap-1.5 px-2.5 h-8 rounded-xl bg-zinc-900 border transition-all cursor-pointer active:scale-95",
                        textHasStroke
                            ? "border-amber-500/60 text-amber-400"
                            : "border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    )}
                    title="حاشیه دور متن (Stroke)"
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">حاشیه</span>
                </button>

                {isStrokeMenuOpen && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 p-3 bg-zinc-950/98 border border-zinc-800 rounded-2xl shadow-2xl z-[100] flex flex-col gap-3 min-w-[195px] backdrop-blur-2xl animate-fade-in-up">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200">حاشیه متن</span>
                            <input
                                type="checkbox"
                                checked={textHasStroke}
                                onChange={(e) => setTextHasStroke(e.target.checked)}
                                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                            />
                        </div>

                        {textHasStroke && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] text-zinc-400">رنگ حاشیه:</span>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PRESET_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setTextStrokeColor(c)}
                                                className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg border border-zinc-700 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                                style={{ backgroundColor: c }}
                                            >
                                                {textStrokeColor === c && (
                                                    <Check
                                                        className={cn(
                                                            "w-3.5 h-3.5",
                                                            c === "#ffffff" ? "text-zinc-950" : "text-white"
                                                        )}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[10px] text-zinc-400">
                                        <span>ضخامت:</span>
                                        <span className="font-mono">{textStrokeWidth}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="8"
                                        value={textStrokeWidth}
                                        onChange={(e) => setTextStrokeWidth(Number(e.target.value))}
                                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="hidden sm:block h-5 w-px bg-zinc-800 mx-0.5" aria-hidden="true" />

            <div className="sm:relative">
                <button
                    type="button"
                    onClick={() => {
                        setIsEmojiOpen(!isEmojiOpen);
                        setIsColorOpen(false);
                        setIsStrokeMenuOpen(false);
                    }}
                    aria-label="درج ایموجی RPG"
                    className={cn(
                        "w-8 h-8 rounded-xl bg-zinc-900 border flex items-center justify-center text-amber-400 transition-all cursor-pointer active:scale-95",
                        isEmojiOpen ? "border-amber-500 bg-zinc-800" : "border-zinc-800 hover:bg-zinc-800"
                    )}
                    title="درج ایموجی RPG"
                >
                    <Smile className="w-4 h-4" />
                </button>

                {isEmojiOpen && (
                    <div
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:-right-2 p-2.5 bg-zinc-950/98 border border-zinc-800 rounded-2xl shadow-2xl w-52 sm:w-48 backdrop-blur-2xl z-[100] animate-fade-in-up"
                        dir="ltr"
                    >
                        <div
                            className="text-[10px] text-zinc-400 font-medium mb-2 text-right px-1"
                            dir="rtl"
                        >
                            درج مستقیم ایموجی:
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 justify-items-center">
                            {EMOJI_LIST.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        setPendingEmoji(emoji);
                                        if (navigator.clipboard) {
                                            navigator.clipboard.writeText(emoji).catch(() => {});
                                        }
                                        setIsEmojiOpen(false);
                                    }}
                                    className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-zinc-900/60 hover:bg-amber-500/20 hover:scale-110 border border-zinc-800/80 flex items-center justify-center text-base cursor-pointer transition-all active:scale-95"
                                    title="درج ایموجی"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

TextSubToolbar.displayName = "TextSubToolbar";
export default TextSubToolbar;