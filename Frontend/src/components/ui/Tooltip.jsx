import React, { useState, useCallback, memo } from "react";
import { cn } from "../../utils/cn";

const TOOLTIP_POSITIONS = Object.freeze({
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
});

export const Tooltip = memo(
    ({ content, subContent, shortcut, position = "top", children }) => {
        const [isVisible, setIsVisible] = useState(false);

        const handleMouseEnter = useCallback(() => setIsVisible(true), []);
        const handleMouseLeave = useCallback(() => setIsVisible(false), []);

        return (
            <div
                className="relative inline-flex items-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
                {isVisible && (
                    <div
                        className={cn(
                            "hidden sm:flex absolute z-50 pointer-events-none px-2.5 py-1.5 bg-zinc-950/95 border border-zinc-800 text-zinc-100 text-xs rounded-xl shadow-xl backdrop-blur-md whitespace-nowrap items-center gap-2 animate-in fade-in zoom-in-95 duration-100",
                            TOOLTIP_POSITIONS[position] || TOOLTIP_POSITIONS.top
                        )}
                    >
                        <div className="flex flex-col text-right">
                            <span className="font-semibold">{content}</span>
                            {subContent && (
                                <span className="text-[10px] text-zinc-400 font-fa">{subContent}</span>
                            )}
                        </div>
                        {shortcut && (
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-amber-400 rounded-md">
                                {shortcut}
                            </kbd>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

Tooltip.displayName = "Tooltip";
export default Tooltip;