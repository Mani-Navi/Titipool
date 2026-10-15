class TableAudioEngine {
    constructor() {
        this.ctx = null;
    }

    initCtx() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    playDiceRoll() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const times = [0, 0.08, 0.17, 0.28];
            times.forEach((t, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = i % 2 === 0 ? 'sine' : 'triangle';
                const baseFreq = 220 + Math.random() * 120 - i * 30;
                osc.frequency.setValueAtTime(baseFreq, now + t);
                osc.frequency.exponentialRampToValueAtTime(80, now + t + 0.08);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now + t);

                gain.gain.setValueAtTime(0, now + t);
                gain.gain.linearRampToValueAtTime(0.08 / (i + 1), now + t + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.07);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + t);
                osc.stop(now + t + 0.08);
            });
        } catch (_) {}
    }

    playCritChime() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const chord = [523.25, 659.25, 783.99, 1046.5];
            chord.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);

                gain.gain.setValueAtTime(0, now + idx * 0.06);
                gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.06 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.6);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.65);
            });
        } catch (_) {}
    }

    playTokenClick() {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (_) {}
    }

    playPttBeep(on) {
        try {
            this.initCtx();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(on ? 880 : 440, now);

            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.04);
        } catch (_) {}
    }
}

export const sound = new TableAudioEngine();