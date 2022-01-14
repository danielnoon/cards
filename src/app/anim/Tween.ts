import { Vector2 } from "gamedeck/lib/Utils";
import { AnimationStep } from "./Animation";

interface TweenConfig<T> {
  from: T;
  to: T;
  duration: number;
  ease?: (t: number) => number;
  repeat?: boolean;
}

export class Tween<T extends number | Vector2> implements AnimationStep {
  from: T;
  to: T;
  duration: number;
  ease: (t: number) => number = (x) => x;
  repeat = true;

  done = false;

  constructor(private callback: (next: T) => void, config: TweenConfig<T>) {
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

    if (this.from instanceof Vector2 && this.to instanceof Vector2) {
      const next = new Vector2(
        this.from.x + (this.to.x - this.from.x) * progress,
        this.from.y + (this.to.y - this.from.y) * progress
      );

      this.callback(next as T);
    } else if (typeof this.from === "number" && typeof this.to === "number") {
      const next = this.from + (this.to - this.from) * progress;

      this.callback(next as T);
    }

    const done = progress >= 1;

    if (!this.repeat && done) {
      this.done = true;
    }

    return done;
  }

  public init() {}
}
