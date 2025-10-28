let audioCtx;

function getCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = Ctx ? new Ctx() : null;
  }
  return audioCtx;
}

export function playBeep({ freq = 440, duration = 0.12, type = 'sine', gain = 0.05 } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);
  const now = ctx.currentTime;
  osc.start(now);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.stop(now + duration + 0.02);
}

export const sfx = {
  click: () => playBeep({ freq: 700, duration: 0.07 }),
  good: () => playBeep({ freq: 1200, duration: 0.12, type: 'triangle' }),
  bad: () => playBeep({ freq: 220, duration: 0.18, type: 'sawtooth' }),
  collect: () => playBeep({ freq: 900, duration: 0.08 }),
  mine: () => playBeep({ freq: 500, duration: 0.1 }),
  gameover: () => { playBeep({ freq: 300, duration: 0.15 }); setTimeout(() => playBeep({ freq: 200, duration: 0.2 }), 120); },
};


