import { create } from 'zustand';
import { diceAudio } from '../engine/diceAudio';
import { wsService } from '../../../services/websocket.service';

const getClientTabId = () => {
    let tabId = sessionStorage.getItem('vtt_tab_id');
    if (!tabId) {
        tabId = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        sessionStorage.setItem('vtt_tab_id', tabId);
    }
    return tabId;
};

const getCurrentUser = () => {
    try {
        const stored = localStorage.getItem('vtt_user');
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { username: 'بازیکن' };
};

const getSavedTheme = () => {
    try {
        const saved = localStorage.getItem('vtt_dice_theme');
        if (saved) return saved;
    } catch (e) {}
    return 'midnight';
};

export const useDiceStore = create((set, get) => ({
    isOpen: false,
    isRolling: false,
    activeDice: [],
    results: [],
    totalSum: 0,
    rollerName: null,
    isRemoteRoll: false,
    remoteReThrow: null,
    settledTransforms: {},
    rollHistory: [],
    selectedTheme: getSavedTheme(),

    setSelectedTheme: (theme) => {
        try {
            localStorage.setItem('vtt_dice_theme', theme);
        } catch (e) {}
        set({ selectedTheme: theme });
    },

    setOpen: (isOpen) => set({ isOpen }),

    triggerRoll: (diceSpecs = ['d20'], customPhysics = null) => {
        diceAudio.playThrow(diceSpecs.length);
        const user = getCurrentUser();
        const tabId = getClientTabId();
        const defaultTheme = get().selectedTheme;
        const rollTimestamp = Date.now();

        // در هر پرتاب برای تمام تاس‌ها شناسه کاملاً جدید تولید می‌شود تا نمونه‌های قبلی Re-mount شوند
        const newDice = diceSpecs.map((item, idx) => {
            const type = typeof item === 'string' ? item : item.type || 'd20';
            const theme = typeof item === 'object' && item.theme ? item.theme : defaultTheme;
            const freshDieId = `${type}-${rollTimestamp}-${idx}-${Math.random().toString(36).slice(2, 8)}`;

            const spreadX = (Math.random() - 0.5) * 1.5;
            const spreadZ = (Math.random() - 0.5) * 1.5;

            let initialPos;
            let initialLinearVelocity;
            let initialAngularVelocity;

            if (customPhysics) {
                const { origin, velocity, power } = customPhysics;
                initialPos = [
                    origin[0] + spreadX,
                    5.5 + Math.random() * 1.5,
                    origin[1] + spreadZ,
                ];
                initialLinearVelocity = [
                    velocity[0] + (Math.random() - 0.5) * 2,
                    -4 - (power * 0.15) - Math.random() * 3,
                    velocity[1] + (Math.random() - 0.5) * 2,
                ];
                const spinFactor = 15 + power * 0.35;
                initialAngularVelocity = [
                    (Math.random() > 0.5 ? 1 : -1) * (spinFactor + Math.random() * 15),
                    (Math.random() > 0.5 ? 1 : -1) * (spinFactor + Math.random() * 15),
                    (Math.random() > 0.5 ? 1 : -1) * (spinFactor + Math.random() * 15),
                ];
            } else {
                initialPos = [
                    (Math.random() - 0.5) * 4,
                    6 + Math.random() * 2,
                    (Math.random() - 0.5) * 4,
                ];
                initialLinearVelocity = [
                    (Math.random() - 0.5) * 12,
                    -7 - Math.random() * 5,
                    (Math.random() - 0.5) * 12,
                ];
                initialAngularVelocity = [
                    (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 25),
                    (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 25),
                    (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 25),
                ];
            }

            return {
                id: freshDieId,
                type,
                theme,
                settled: false,
                value: null,
                initialPos,
                initialRotation: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                ],
                initialLinearVelocity,
                initialAngularVelocity,
            };
        });

        set({
            isOpen: true,
            isRolling: true,
            isRemoteRoll: false,
            rollerName: null,
            settledTransforms: {},
            activeDice: newDice,
            results: [],
            totalSum: 0,
        });

        wsService.send('DICE_ROLL', {
            senderTabId: tabId,
            senderId: user.id || user.userId || tabId,
            rollerName: user.displayName || user.username || user.name || 'بازیکن',
            dice: newDice,
        });
    },

    triggerRemoteRoll: (remoteDice, rollerName) => {
        if (!remoteDice || !Array.isArray(remoteDice) || remoteDice.length === 0) return;

        diceAudio.playThrow(remoteDice.length);

        set({
            isOpen: false,
            isRolling: true,
            isRemoteRoll: true,
            rollerName: rollerName || 'هم‌تیمی',
            settledTransforms: {},
            activeDice: remoteDice,
            results: [],
            totalSum: 0,
        });
    },

    broadcastReThrow: (dieId, translation, velocity, angularVelocity) => {
        const tabId = getClientTabId();
        wsService.send('DICE_RETHROW', {
            senderTabId: tabId,
            dieId,
            translation,
            velocity,
            angularVelocity,
        });
    },

    applyRemoteReThrow: (data) => {
        set({ remoteReThrow: { ...data, timestamp: Date.now() }, isRolling: true });
    },

    setRemoteResults: (results, totalSum, transforms = {}) => {
        set({
            results,
            totalSum,
            settledTransforms: transforms || {},
            isRolling: false,
        });
    },

    setDieResult: (dieId, value, transform = null) => {
        const { activeDice, results, isRemoteRoll, settledTransforms } = get();

        const dieIdx = activeDice.findIndex((d) => d.id === dieId);
        if (dieIdx === -1) return;

        const currentDie = activeDice[dieIdx];
        const updatedDice = [...activeDice];
        updatedDice[dieIdx] = { ...currentDie, settled: true, value };

        const dieType = currentDie.type || 'd20';
        const dieTheme = currentDie.theme || 'midnight';

        const existingResultIdx = results.findIndex((r) => r.id === dieId);
        const newResults = [...results];
        const resultItem = {
            id: dieId,
            type: dieType,
            theme: dieTheme,
            value: Number(value),
            label: currentDie.label || null,
        };

        if (existingResultIdx !== -1) {
            newResults[existingResultIdx] = resultItem;
        } else {
            newResults.push(resultItem);
        }

        const updatedTransforms = transform
            ? { ...settledTransforms, [dieId]: transform }
            : settledTransforms;

        const allSettled = updatedDice.every((d) => d.settled);

        // محاسبه دقیق درصدگان D&D (جفت کردن d100 دهگان با d10 یکان)
        let sum = 0;
        const d100List = newResults.filter((r) => r.type === 'd100');
        const d10List = newResults.filter((r) => r.type === 'd10');

        if (d100List.length > 0 && d10List.length > 0) {
            const pairCount = Math.min(d100List.length, d10List.length);
            const pairedIds = new Set();

            for (let i = 0; i < pairCount; i++) {
                const tensVal = Number(d100List[i].value) || 0;
                const onesVal = Number(d10List[i].value) || 0;
                sum += (tensVal === 0 && onesVal === 0 ? 100 : tensVal + onesVal);
                pairedIds.add(d100List[i].id);
                pairedIds.add(d10List[i].id);
            }

            for (let i = 0; i < newResults.length; i++) {
                if (!pairedIds.has(newResults[i].id)) {
                    sum += Number(newResults[i].value) || 0;
                }
            }
        } else {
            for (let i = 0; i < newResults.length; i++) {
                sum += Number(newResults[i].value) || 0;
            }
        }

        set({
            activeDice: updatedDice,
            results: newResults,
            totalSum: sum,
            settledTransforms: updatedTransforms,
            isRolling: !allSettled,
        });

        if (allSettled) {
            if (!isRemoteRoll) {
                const tabId = getClientTabId();
                wsService.send('DICE_SETTLED', {
                    senderTabId: tabId,
                    results: newResults,
                    totalSum: sum,
                    transforms: updatedTransforms,
                });
            }

            set((state) => ({
                rollHistory: [
                    { id: Date.now(), results: newResults, total: sum, timestamp: new Date() },
                    ...state.rollHistory.slice(0, 19),
                ],
            }));
        }
    },

    clearDice: () => set({ activeDice: [], results: [], totalSum: 0, isRolling: false, rollerName: null, isRemoteRoll: false, settledTransforms: {} }),
}));