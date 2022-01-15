import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";
import { add, get } from "../image-registry";

const BACKGROUND_NORMAL = "#352a29";
const BACKGROUND_HOVER = "#57392f";
const WIDTH = 100;
const HEIGHT = 40;

add("/assets/bell.png");
add("/assets/bell-active.png");
add("/assets/bell-disabled.png");

export class BellState {
  public hover = false;
  public clicked = false;
  public disabled = false;
}

export class Bell extends GObject {
  constructor(private state: BellState) {
    super({
      position: new Vector2(10, 50),
      dimensions: new Vector2(WIDTH, HEIGHT),
      id: "bell",
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { hover, clicked, disabled } = this.state;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "black";

    if (clicked) {
      ctx.fillRect(
        this.position.x - 1,
        this.position.y + 1,
        WIDTH + 2,
        HEIGHT + 2
      );
    } else {
      ctx.fillRect(
        this.position.x - 1,
        this.position.y - 1,
        WIDTH + 2,
        HEIGHT + 4
      );
    }

    if (hover || clicked) {
      ctx.fillStyle = BACKGROUND_HOVER;
    } else {
      ctx.fillStyle = BACKGROUND_NORMAL;
    }

    if (clicked) {
      ctx.fillRect(
        this.position.x,
        this.position.y + 2,
        this.dimensions.x,
        this.dimensions.y
      );
    } else {
      ctx.fillRect(
        this.position.x,
        this.position.y,
        this.dimensions.x,
        this.dimensions.y
      );
    }

    if (clicked) {
      ctx.drawImage(
        get("/assets/bell-active.png"),
        this.position.x + (WIDTH - 30) / 2,
        this.position.y + 1 + (HEIGHT - 31) / 2
      );
    } else if (disabled) {
      ctx.drawImage(
        get("/assets/bell-disabled.png"),
        this.position.x + (WIDTH - 30) / 2,
        this.position.y + (HEIGHT - 29) / 2
      );
    } else {
      ctx.drawImage(
        get("/assets/bell.png"),
        this.position.x + (WIDTH - 30) / 2,
        this.position.y + (HEIGHT - 29) / 2
      );
    }

    ctx.restore();
  }
}
