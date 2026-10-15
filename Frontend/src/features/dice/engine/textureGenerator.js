import * as THREE from 'three';

export const DICE_THEMES = {
    midnight: {
        id: 'midnight',
        name: 'Midnight',
        bgCenter: '#1b223d',
        bgMid: '#0c1224',
        bgEdge: '#050711',
        vein1: 'rgba(56, 92, 168, 0.40)',
        vein2: 'rgba(96, 165, 250, 0.22)',
        borderColor: 'rgba(234, 179, 8, 0.55)',
        goldLight: '#fef08a',
        goldMid: '#eab308',
        goldDark: '#a16207',
        accentShadow: 'rgba(0, 0, 0, 0.95)',
        palette: ['#1e293b', '#0f172a', '#3b82f6', '#facc15'],
    },
    forest: {
        id: 'forest',
        name: 'Forest',
        bgCenter: '#143d2c',
        bgMid: '#0a2318',
        bgEdge: '#04110a',
        vein1: 'rgba(34, 197, 94, 0.32)',
        vein2: 'rgba(74, 222, 128, 0.22)',
        borderColor: 'rgba(234, 179, 8, 0.55)',
        goldLight: '#fef08a',
        goldMid: '#eab308',
        goldDark: '#a16207',
        accentShadow: 'rgba(0, 0, 0, 0.95)',
        palette: ['#064e3b', '#022c22', '#10b981', '#facc15'],
    },
    ember: {
        id: 'ember',
        name: 'Ember',
        bgCenter: '#631812',
        bgMid: '#380a07',
        bgEdge: '#170302',
        vein1: 'rgba(249, 115, 22, 0.42)',
        vein2: 'rgba(239, 68, 68, 0.32)',
        borderColor: 'rgba(253, 224, 71, 0.60)',
        goldLight: '#fffbeb',
        goldMid: '#f59e0b',
        goldDark: '#b45309',
        accentShadow: 'rgba(0, 0, 0, 0.95)',
        palette: ['#7f1d1d', '#450a0a', '#f97316', '#fbbf24'],
    },
    ocean: {
        id: 'ocean',
        name: 'Ocean',
        bgCenter: '#0b4869',
        bgMid: '#062d42',
        bgEdge: '#021520',
        vein1: 'rgba(56, 189, 248, 0.35)',
        vein2: 'rgba(45, 212, 191, 0.25)',
        borderColor: 'rgba(253, 224, 71, 0.55)',
        goldLight: '#fef08a',
        goldMid: '#eab308',
        goldDark: '#a16207',
        accentShadow: 'rgba(0, 0, 0, 0.95)',
        palette: ['#0369a1', '#075985', '#38bdf8', '#facc15'],
    },
    ivory: {
        id: 'ivory',
        name: 'Ivory',
        bgCenter: '#f5efe6',
        bgMid: '#e7d9c6',
        bgEdge: '#cbb79c',
        vein1: 'rgba(168, 142, 114, 0.38)',
        vein2: 'rgba(212, 191, 163, 0.45)',
        borderColor: 'rgba(146, 92, 38, 0.55)',
        goldLight: '#a16207',
        goldMid: '#78350f',
        goldDark: '#451a03',
        accentShadow: 'rgba(255, 255, 255, 0.7)',
        palette: ['#fafaf9', '#e7e5e4', '#d6d3d1', '#78350f'],
    },
    amethyst: {
        id: 'amethyst',
        name: 'Amethyst',
        bgCenter: '#3b1659',
        bgMid: '#240d3a',
        bgEdge: '#120520',
        vein1: 'rgba(192, 132, 252, 0.35)',
        vein2: 'rgba(232, 121, 249, 0.22)',
        borderColor: 'rgba(250, 204, 21, 0.55)',
        goldLight: '#fef08a',
        goldMid: '#eab308',
        goldDark: '#a16207',
        accentShadow: 'rgba(0, 0, 0, 0.95)',
        palette: ['#581c87', '#3b0764', '#c084fc', '#facc15'],
    },
};

const textureCache = new Map();

export function createThemedMarbleTexture(text, type = 'd20', themeName = 'amethyst', size = 256) {
    const cacheKey = `${type}-${themeName}-${text}-${size}`;
    if (textureCache.has(cacheKey)) {
        return textureCache.get(cacheKey);
    }

    const theme = DICE_THEMES[themeName] || DICE_THEMES.amethyst;
    const isIvory = theme.id === 'ivory';

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // ۱. پس‌زمینه مرمر طبیعی شعاعی
    const bgGrad = ctx.createRadialGradient(
        size * 0.45, size * 0.42, size * 0.08,
        size * 0.5, size * 0.5, size * 0.72
    );
    bgGrad.addColorStop(0, theme.bgCenter);
    bgGrad.addColorStop(0.55, theme.bgMid);
    bgGrad.addColorStop(1, theme.bgEdge);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // ۲. رگه‌های ابری سنگ مرمر
    ctx.save();
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.filter = 'blur(6px)';

    ctx.strokeStyle = theme.vein1;
    ctx.beginPath();
    ctx.moveTo(size * 0.12, size * 0.15);
    ctx.bezierCurveTo(size * 0.4, size * 0.28, size * 0.52, size * 0.75, size * 0.88, size * 0.88);
    ctx.stroke();

    ctx.strokeStyle = theme.vein2;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(size * 0.88, size * 0.18);
    ctx.bezierCurveTo(size * 0.62, size * 0.42, size * 0.38, size * 0.62, size * 0.12, size * 0.82);
    ctx.stroke();
    ctx.restore();

    // ۳. رسم خطوط فرورفته کادر دور هر وجه
    ctx.save();
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';

    if (type === 'd6') {
        ctx.strokeRect(size * 0.11, size * 0.11, size * 0.78, size * 0.78);
    } else if (type === 'd4' || type === 'd8' || type === 'd20') {
        ctx.beginPath();
        ctx.moveTo(size * 0.5, size * 0.13);
        ctx.lineTo(size * 0.87, size * 0.85);
        ctx.lineTo(size * 0.13, size * 0.85);
        ctx.closePath();
        ctx.stroke();
    } else if (type === 'd12') {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = size * 0.5 + Math.cos(a) * size * 0.39;
            const y = size * 0.5 + Math.sin(a) * size * 0.39;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    } else if (type === 'd10' || type === 'd100') {
        ctx.beginPath();
        ctx.moveTo(size * 0.5, size * 0.11);
        ctx.lineTo(size * 0.87, size * 0.52);
        ctx.lineTo(size * 0.5, size * 0.89);
        ctx.lineTo(size * 0.13, size * 0.52);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();

    // ۴. رسم اعداد حکاکی شده
    const textStr = String(text);
    const isPercentile = type === 'd100';
    const fontSize = isPercentile ? 64 : textStr.length >= 2 ? 74 : 96;

    ctx.font = `bold ${fontSize}px "Cinzel", "Times New Roman", Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerY = (type === 'd4' || type === 'd8' || type === 'd20') ? size * 0.55 : size * 0.51;

    if (isIvory) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 2;
    } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 3;
    }

    const goldGrad = ctx.createLinearGradient(0, size * 0.25, 0, size * 0.75);
    goldGrad.addColorStop(0, theme.goldLight);
    goldGrad.addColorStop(0.4, theme.goldMid);
    goldGrad.addColorStop(1, theme.goldDark);

    ctx.fillStyle = goldGrad;
    ctx.fillText(textStr, size * 0.5, centerY);

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = isIvory ? 'rgba(69, 26, 3, 0.6)' : 'rgba(254, 240, 138, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.strokeText(textStr, size * 0.5, centerY);

    if (text === 6 || text === 9) {
        ctx.fillStyle = goldGrad;
        ctx.fillRect(size * 0.38, centerY + 40, size * 0.24, 6);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    textureCache.set(cacheKey, texture);
    return texture;
}

export function createMaterialsForType(type, values, themeName = 'amethyst') {
    const isIvory = themeName === 'ivory';
    return values.map((val) => {
        const isCrit = type === 'd20' && val === 20;
        const tex = createThemedMarbleTexture(val, type, themeName);

        return new THREE.MeshStandardMaterial({
            map: tex,
            roughness: isCrit ? 0.14 : isIvory ? 0.22 : 0.18,
            metalness: isIvory ? 0.08 : 0.18,
            flatShading: true,
            side: THREE.DoubleSide,
        });
    });
}