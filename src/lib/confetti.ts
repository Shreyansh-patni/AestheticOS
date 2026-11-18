import confetti from 'canvas-confetti';

export function fireWorkoutCelebration() {
  if (typeof window === 'undefined') return;
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#FAFAFA', '#A3A3A3', '#525252'],
    });
  } catch (e) {
    console.warn('Confetti could not be fired:', e);
  }
}

export function fireMilestoneCelebration() {
  if (typeof window === 'undefined') return;
  try {
    const end = Date.now() + 1.2 * 1000;
    const colors = ['#10B981', '#FAFAFA', '#737373'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (e) {
    console.warn('Confetti could not be fired:', e);
  }
}
