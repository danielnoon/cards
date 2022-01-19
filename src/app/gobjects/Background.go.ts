import { GObject } from "gamedeck/lib/GObject";
import { add, get } from "../image-registry";

interface Props {
  path: string;
  children?: GObject[];
  scale?: number;
  alpha?: number;
}

export class Background extends GObject {
  private path: string;
  private alpha: number = 1;

  constructor({ path, children, scale, alpha }: Props) {
    super({ children, scale });

    add(path);
    this.path = path;
    this.alpha = alpha || 1;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = this.alpha;
    ctx.scale(this.scale, this.scale);
    ctx.fillStyle = ctx.createPattern(get(this.path), "repeat")!;
    ctx.fillRect(
      -ctx.canvas.width,
      -ctx.canvas.height,
      ctx.canvas.width * (1 / this.scale) * 2,
      ctx.canvas.height * (1 / this.scale) * 2
    );
    ctx.restore();
  }
}
