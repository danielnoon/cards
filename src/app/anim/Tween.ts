import { Vector2 } from "gamedeck/lib/Utils";
import { AnimationStep } from "./Animation";

interface TweenConfig {
  from: Vector2;
  to: Vector2;
  duration: number;
  ease: (t: number) => number;
  repeat?: boolean;
}

export class Tween implements AnimationStep {
  from: Vector2;
  to: Vector2;
  duration: number;
  ease: (t: number) => number = (x) => x;
  repeat = true;

  done = false;

  constructor(private callback: (next: Vector2) => void, config: TweenConfig) {
    const { from, to, duration, ease, repeat } = config;
    this.from = from;
    this.to = to;
    this.duration = duration;

    if (ease !== undefined) {
      this.ease = ease;
    }

    if (repeat !== undefined) {
      this.repeat = repeat;
    }
  }

  public update(delta: number) {
    if (this.done) return true;

    const progress = this.ease(delta / this.duration);

    const next = new Vector2(
      this.from.x + (this.to.x - this.from.x) * progress,
      this.from.y + (this.to.y - this.from.y) * progress
    );

    this.callback(next);

    const done = progress >= 1;

    if (!this.repeat && done) {
      this.done = true;
    }

    return done;
  }

  public init() {}
}
