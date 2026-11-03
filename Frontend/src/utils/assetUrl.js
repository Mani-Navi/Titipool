import { ENV } from "../config/validateEnv";

// الگوی مجاز برای Data URLهای تصویری امن (SVG و HTML به دلیل ریسک اجرای اسکریپت فیلتر شده‌اند)
const SAFE_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

// کش یک‌باره آدرس ریشه سرور جهت پرهیز از ارزیابی‌های رشته‌ای تکراری
const BACKEND_BASE = (ENV.API_BASE_URL || "http://localhost:8080").replace(/\/api\/?$/, "");

export function getFullAssetUrl(url) {
    if (!url) return "";
    const trimmed = String(url).trim();
    if (!trimmed) return "";

    // مسدودسازی پروتکل‌های مخرب اجرایی (XSS)
    const lower = trimmed.toLowerCase();
    if (
        lower.startsWith("javascript:") ||
        lower.startsWith("vbscript:") ||
        lower.startsWith("file:")
    ) {
        return "";
    }

    // اعتبارسنجی Data URL برای اطمینان از امن بودن MIME-Type
    if (lower.startsWith("data:")) {
        return SAFE_DATA_URL_REGEX.test(trimmed) ? trimmed : "";
    }

    // مسیرهای Blob امن و لینک‌های وب با پروتکل استاندارد
    if (
        lower.startsWith("blob:") ||
        lower.startsWith("http://") ||
        lower.startsWith("https://")
    ) {
        return trimmed;
    }

    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

    // فایل‌های استاتیک پیش‌فرض داخل پوشه public فرانت‌اند (/presets/ و /images/)
    if (cleanPath.startsWith("/presets/") || cleanPath.startsWith("/images/")) {
        return cleanPath;
    }

    // نرمال‌سازی مسیر آدرس‌های آپلودشده کاربران روی بک‌اند (/uploads/)
    return `${BACKEND_BASE}${cleanPath}`;
}