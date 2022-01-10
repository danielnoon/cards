import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";

const Y = 200;
const WIDTH = 450;
const HEIGHT = 100;

export class Hand extends GObject {
  static Y = Y;
  static WIDTH = WIDTH;
  static HEIGHT = HEIGHT;

  constructor() {
    super({
      position: new Vector2(0, Y),
      dimensions: new Vector2(WIDTH, HEIGHT),
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    ctx.fillStyle = "#392d2dcc";
    ctx.fillRect(
      this.position.x,
      this.position.y,
      this.dimensions.x,
      this.dimensions.y
    );

    ctx.restore();
  }
}
