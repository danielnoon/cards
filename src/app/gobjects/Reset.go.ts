import { GObject } from "gamedeck/lib/GObject";

export class Reset extends GObject {
  constructor() {
    super({});
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}
