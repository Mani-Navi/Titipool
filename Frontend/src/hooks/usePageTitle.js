import { useEffect } from "react";

export function usePageTitle(title) {
    useEffect(() => {
        const base = "Persian VTT";
        if (title) {
            document.title = `${title} — ${base}`;
        } else {
            document.title = `${base} — میز بازی مجازی`;
        }

        return () => {
            document.title = `${base} — میز بازی مجازی`;
        };
    }, [title]);
}