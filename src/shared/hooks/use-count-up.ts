import { useEffect, useState } from "react";

const DEFAULT_DURATION_IN_MS = 1400;

const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

export const interpolateCountUp = (target: number, progress: number): number =>
  target * easeOutCubic(Math.min(1, Math.max(0, progress)));

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fait défiler un nombre de 0 jusqu'à sa valeur. Sans mouvement si l'utilisateur
// a demandé de réduire les animations.
export const useCountUp = (
  target: number | null,
  durationInMs = DEFAULT_DURATION_IN_MS,
): number | null => {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    if (target === null) {
      return;
    }

    const duration = prefersReducedMotion() ? 0 : durationInMs;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = duration === 0 ? 1 : (now - startTime) / duration;
      setValue(interpolateCountUp(target, progress));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [target, durationInMs]);

  return target === null ? null : (value ?? 0);
};
