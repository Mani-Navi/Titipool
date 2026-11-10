import React, { memo } from "react";

export const AVATAR_LIST = Object.freeze([
    { id: "cowboy", name: "ماجراجوی کلاه‌چرمی", col: 0, row: 0 },
    { id: "gamer", name: "خنیاگر نئونی", col: 1, row: 0 },
    { id: "catgirl", name: "روگ گربه‌ای", col: 0, row: 1 },
    { id: "fox", name: "روباه اشرافی", col: 1, row: 1 },
    { id: "warrior", name: "جنگجوی هدبند آبی", col: 0, row: 2 },
    { id: "aviator", name: "مخترع بادها", col: 1, row: 2 },
    { id: "wizard", name: "کیمیاگر کهن", col: 0, row: 3 },
    { id: "druid", name: "دروئید طبیعت", col: 1, row: 3 },
    { id: "birdfolk", name: "مسافر پرنده‌نما", col: 0, row: 4 },
    { id: "artificer", name: "مهندس موآبی", col: 1, row: 4 },
]);

export const AVATAR_MAP = Object.freeze(new Map(AVATAR_LIST.map((a) => [a.id, a])));
const DEFAULT_AVATAR = AVATAR_LIST[0];

export const isRpgAvatarId = (id) => {
    if (!id || typeof id !== "string") return false;
    return AVATAR_MAP.has(id.trim());
};

let sheetImgPromise = null;
const croppedAvatarCache = new Map();

const getSheetImage = () => {
    if (sheetImgPromise) return sheetImgPromise;
    sheetImgPromise = new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = "/images/avatars-sheet.jpg";
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            sheetImgPromise = null;
            reject(err);
        };
    });
    return sheetImgPromise;
};

/**
 * برش دقیق آواتار RPG از روی شیت برای رندر شدن مستقیم روی توکن‌های Konva Canvas
 */
export const loadRpgAvatarCanvasImage = async (avatarId) => {
    const cleanId = avatarId && AVATAR_MAP.has(avatarId.trim()) ? avatarId.trim() : "cowboy";
    if (croppedAvatarCache.has(cleanId)) {
        return croppedAvatarCache.get(cleanId);
    }

    const avatar = AVATAR_MAP.get(cleanId) || DEFAULT_AVATAR;
    const sheet = await getSheetImage();

    const imgW = sheet.naturalWidth || sheet.width;
    const imgH = sheet.naturalHeight || sheet.height;

    const cropW = imgW / 2.18;
    const cropH = imgH / 5.45;
    const pctX = avatar.col === 0 ? 0.03 : 0.97;
    const pctY = (avatar.row * 24.8 + 1) / 100;

    const sx = (imgW - cropW) * pctX;
    const sy = (imgH - cropH) * pctY;

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(sheet, sx, sy, cropW, cropH, 0, 0, 256, 256);

    const croppedImg = new window.Image();
    croppedImg.src = canvas.toDataURL("image/png");
    await new Promise((res) => {
        croppedImg.onload = res;
        croppedImg.onerror = res;
    });

    croppedAvatarCache.set(cleanId, croppedImg);
    return croppedImg;
};

export const RpgAvatar = memo(({ avatarId = "cowboy", className = "w-16 h-16" }) => {
    const avatar = AVATAR_MAP.get(avatarId) || DEFAULT_AVATAR;

    const posX = avatar.col === 0 ? "3%" : "97%";
    const posY = `${avatar.row * 24.8 + 1}%`;

    return (
        <div
            className={`rounded-full overflow-hidden shrink-0 select-none bg-zinc-950 ${className}`}
            style={{
                backgroundImage: "url(/images/avatars-sheet.jpg)",
                backgroundSize: "218% 545%",
                backgroundPosition: `${posX} ${posY}`,
                backgroundRepeat: "no-repeat",
            }}
        />
    );
});

RpgAvatar.displayName = "RpgAvatar";
export default RpgAvatar;