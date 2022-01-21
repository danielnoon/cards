import { AnimationStep } from "./Animation";

export class Wait implements AnimationStep {
  private elapsed = 0;

  get promise() {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), this.duration);
    });
  }

  constructor(private duration: number) {}

  init() {}

  public update(delta: number) {
    this.elapsed += delta;

    return this.elapsed >= this.duration;
  }
}
