const BLOCKED_EMAIL_DOMAINS = new Set([
    "example.com",
    "example.org",
    "example.net",
    "example.edu",
    "test.com",
    "test.org",
    "test.ir",
    "localhost",
    "invalid.com",
    "tempmail.com",
    "temp-mail.org",
    "mailinator.com",
    "guerrillamail.com",
    "10minutemail.com",
    "yopmail.com",
    "trashmail.com",
    "fakeinbox.com",
    "sharklasers.com",
    "getnada.com",
    "maildrop.cc",
    "dispostable.com",
]);

const BLOCKED_TLDS = new Set([
    "example",
    "test",
    "invalid",
    "localhost",
    "local",
]);

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,15}$/;

export function isValidRealEmail(email) {
    if (!email || typeof email !== "string") return false;
    const trimmed = email.trim().toLowerCase();

    if (!STRICT_EMAIL_REGEX.test(trimmed)) return false;

    const parts = trimmed.split("@");
    if (parts.length !== 2) return false;

    const [localPart, domain] = parts;
    if (localPart.length < 2 || domain.length < 4) return false;
    if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;

    if (BLOCKED_EMAIL_DOMAINS.has(domain)) return false;

    const domainSegments = domain.split(".");
    const tld = domainSegments[domainSegments.length - 1];
    const sld = domainSegments[0];

    if (BLOCKED_TLDS.has(tld) || BLOCKED_TLDS.has(sld)) return false;

    return true;
}

export const REAL_EMAIL_ERROR_MSG =
    "لطفاً یک آدرس ایمیل واقعی و معتبر وارد کنید (دامنه‌های آزمایشی مانند example مجاز نیستند)";