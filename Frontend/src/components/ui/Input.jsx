import React, { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";

export const Input = React.forwardRef(
    ({ className, label, error, helperText, id, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id || generatedId;
        const errorId = `${inputId}-error`;
        const helperId = `${inputId}-helper`;

        return (
            <div className="w-full space-y-1.5 text-right font-fa" dir="rtl">
                {label && (
                    <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-300">
                        {label}
                    </label>
                )}
                <input
                    id={inputId}
                    ref={ref}
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : helperText ? helperId : undefined}
                    className={cn(
                        "w-full h-11 sm:h-10 px-3.5 bg-zinc-900/90 text-zinc-100 placeholder-zinc-500 rounded-xl border border-zinc-700/80 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors shadow-inner",
                        error && "border-rose-500/90 focus:ring-rose-500/40 focus:border-rose-500 bg-rose-500/5",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        aria-live="polite"
                        className="text-xs text-rose-400 font-medium flex items-center gap-1.5 mt-1 animate-fade-in-up"
                    >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                        <span>{error}</span>
                    </p>
                )}
                {helperText && !error && (
                    <p id={helperId} className="text-xs text-zinc-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
export default Input;