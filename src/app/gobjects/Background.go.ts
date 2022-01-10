import { GObject } from "gamedeck/lib/GObject";
import { add, get } from "../image-registry";

interface Props {
  path: string;
  children?: GObject[];
  scale?: number;
}

export class Background extends GObject {
  private path: string;

  constructor({ path, children, scale }: Props) {
    super({ children, scale });

    add(path);
    this.path = path;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.fillStyle = ctx.createPattern(get(this.path), "repeat")!;
    ctx.fillRect(
      0,
      0,
      ctx.canvas.width * (1 / this.scale),
      ctx.canvas.height * (1 / this.scale)
    );
    ctx.restore();
  }
}
