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

    const progress = delta / this.duration;

    const eased = this.ease(progress);

    if (this.from instanceof Vector2 && this.to instanceof Vector2) {
      const next = new Vector2(
        this.from.x + (this.to.x - this.from.x) * eased,
        this.from.y + (this.to.y - this.from.y) * eased
      );

      this.callback(next as T);
    } else if (typeof this.from === "number" && typeof this.to === "number") {
      const next = this.from + (this.to - this.from) * eased;

      this.callback(next as T);
    }

    const done = progress >= 1;

    if (!this.repeat && done) {
      this.done = true;
    }

    if (done) {
      this.callback(this.to as T);
    }

    return done;
  }

  public init() {}
}
