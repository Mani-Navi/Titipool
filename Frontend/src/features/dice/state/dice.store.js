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

    triggerRoll: (diceTypes = ['d20'], customPhysics = null) => {
        diceAudio.playThrow(diceTypes.length);
        const user = getCurrentUser();
        const tabId = getClientTabId();
        const theme = get().selectedTheme;

        const newDice = diceTypes.map((type, idx) => {
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
                id: `${type}-${Date.now()}-${idx}-${Math.random()}`,
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

        const updatedDice = [...activeDice];
        updatedDice[dieIdx] = { ...updatedDice[dieIdx], settled: true, value };

        const currentDie = updatedDice[dieIdx];
        const dieType = currentDie.type || 'd20';

        const existingResultIdx = results.findIndex((r) => r.id === dieId);
        const newResults = [...results];
        if (existingResultIdx !== -1) {
            newResults[existingResultIdx] = { id: dieId, type: dieType, value: Number(value) };
        } else {
            newResults.push({ id: dieId, type: dieType, value: Number(value) });
        }

        const updatedTransforms = transform
            ? { ...settledTransforms, [dieId]: transform }
            : settledTransforms;

        const allSettled = updatedDice.every((d) => d.settled);

        let sum = 0;
        const tensDie = newResults.find((r) => r.type === 'd100');
        const onesDie = newResults.find((r) => r.type === 'd10');

        if (tensDie && onesDie && newResults.length === 2) {
            const tensVal = Number(tensDie.value);
            const onesVal = Number(onesDie.value);
            sum = tensVal === 0 && onesVal === 0 ? 100 : tensVal + onesVal;
        } else {
            for (let i = 0; i < newResults.length; i++) {
                sum += newResults[i].value;
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