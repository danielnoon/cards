export interface AnimationStep {
  init: () => void;
  update: (delta: number) => boolean;
}

interface AnimationConfig {
  repeat?: boolean;
  onFinish?: () => void;
  onUpdate?: () => void;
}

export default class Animation {
  private delta = 0;
  private step = 0;
  private doCancel = false;
  private doPause = false;
  private lastTime = 0;

  constructor(
    private steps: AnimationStep[],
    private config: AnimationConfig = {}
  ) {
    this.init();
  }

  private now() {
    return Date.now();
  }

  public init() {
    this.steps.forEach((step) => step.init());
    this.lastTime = this.now();
  }

  public update() {
    if (this.doCancel) {
      this.config?.onFinish?.();
      return true;
    }

    if (this.doPause) {
      return false;
    }

    this.config?.onUpdate?.();

    const stepDone = this.steps[this.step].update(this.delta);

    if (stepDone) {
      this.delta = 0;
      this.step += 1;
    } else {
      this.delta += this.now() - this.lastTime;
      this.lastTime = this.now();
    }

    if (this.step >= this.steps.length) {
      if (this.config.repeat) {
        this.step = 0;
      } else {
        this.config.onFinish?.();
        return true;
      }
    }

    return false;
  }

  public cancel() {
    this.doCancel = true;
  }

  public pause() {
    this.doPause = true;
  }

  public resume() {
    this.doPause = false;
  }
}
