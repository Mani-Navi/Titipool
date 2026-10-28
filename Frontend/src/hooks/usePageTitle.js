import { useEffect } from "react";

const BASE_BRAND = "Titipool (تیتی‌پول) — میز بازی مجازی فارسی D&D";
const DEFAULT_DESC =
    "تیتی‌پول (Titipool)؛ اولین و سریع‌ترین میز بازی مجازی فارسی (Persian VTT) برای D&D 5e و بازی‌های نقش‌آفرینی با تاس سه‌بعدی، مه جنگ و چت صوتی زنده.";

export function usePageTitle(title, customDescription = null) {
    useEffect(() => {
        const fullTitle = title ? `${title} | ${BASE_BRAND}` : BASE_BRAND;
        document.title = fullTitle;

        // ۱. به‌روزرسانی پویای Canonical URL بر اساس مسیر فعلی (بدون پارامترهای اضافی)
        if (typeof window !== "undefined") {
            const cleanPath = window.location.pathname === "/" ? "" : window.location.pathname.replace(/\/+$/, "");
            const canonicalUrl = `https://titipool.ir${cleanPath || "/"}`;

            let canonicalLink = document.querySelector('link[rel="canonical"]');
            if (!canonicalLink) {
                canonicalLink = document.createElement("link");
                canonicalLink.setAttribute("rel", "canonical");
                document.head.appendChild(canonicalLink);
            }
            canonicalLink.setAttribute("href", canonicalUrl);

            const ogUrlMeta = document.querySelector('meta[property="og:url"]');
            if (ogUrlMeta) {
                ogUrlMeta.setAttribute("content", canonicalUrl);
            }
        }

        // ۲. به‌روزرسانی پویای Meta Description در صورت ارسال
        if (customDescription) {
            const descMeta = document.querySelector('meta[name="description"]');
            if (descMeta) {
                descMeta.setAttribute("content", customDescription);
            }
        }

        return () => {
            document.title = BASE_BRAND;
            if (customDescription) {
                const descMeta = document.querySelector('meta[name="description"]');
                if (descMeta) {
                    descMeta.setAttribute("content", DEFAULT_DESC);
                }
            }
        };
    }, [title, customDescription]);
}