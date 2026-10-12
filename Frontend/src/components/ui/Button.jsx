import React from "react";
import { cn } from "../../utils/cn";

export const Button = React.forwardRef(
    (
        {
            className,
            variant = "secondary",
            size = "md",
            isLoading,
            children,
            disabled,
            type = "button",
            ...props
        },
        ref
    ) => {
        const variants = {
            primary:
                "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-sm border border-blue-500/30",
            secondary:
                "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700/60",
            amber:
                "bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400 active:bg-amber-600 shadow-sm border border-amber-400/40",
            danger:
                "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 border border-rose-500/30",
            outline:
                "bg-transparent text-zinc-200 border border-zinc-700 hover:bg-zinc-800 active:bg-zinc-900",
            ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800/80 active:bg-zinc-800",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
            md: "h-9 px-4 text-sm rounded-lg gap-2",
            lg: "h-11 px-6 text-base rounded-xl gap-2.5",
            icon: "h-9 w-9 p-0 rounded-lg flex items-center justify-center",
        };

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled || isLoading}
                aria-busy={isLoading}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <span
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
                        aria-hidden="true"
                    />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
export default Button;