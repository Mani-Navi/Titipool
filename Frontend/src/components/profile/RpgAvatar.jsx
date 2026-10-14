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

const AVATAR_MAP = Object.freeze(new Map(AVATAR_LIST.map((a) => [a.id, a])));
const DEFAULT_AVATAR = AVATAR_LIST[0];

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