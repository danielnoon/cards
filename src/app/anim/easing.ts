import BezierEasing from "bezier-easing";

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export const attackStart = BezierEasing(0.8, -0.8, 0.75, 1);
