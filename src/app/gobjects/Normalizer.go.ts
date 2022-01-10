import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";

const WIDTH = 400;
const HEIGHT = 300;

interface Props {
  width: number;
  height: number;
  ratio: number;
  children?: GObject[];
}

export class Normalizer extends GObject {
  static scale = 1;
  static transform = new Vector2(0, 0);

  private width: number;
  private height: number;
  private ratio: number;
  private sratio: number;

  constructor({ width, height, ratio, children }: Props) {
    const sratio = width / height;

    const dimensions =
      sratio > ratio
        ? new Vector2(height * ratio, height)
        : new Vector2(width, width / ratio);

    super({ dimensions, children, position: new Vector2(0, 0) });

    this.width = width;
    this.height = height;
    this.ratio = ratio;
    this.sratio = sratio;

    Normalizer.scale = sratio > ratio ? height / HEIGHT : width / WIDTH;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    const height = this.dimensions.y;
    const scale = height / HEIGHT;
    ctx.scale(scale, scale);

    if (this.sratio > this.ratio) {
      ctx.translate(this.width / scale / 2 - this.dimensions.x / scale / 2, 0);
      Normalizer.transform = new Vector2(
        this.width / scale / 2 - this.dimensions.x / scale / 2,
        0
      );
    } else {
      ctx.translate(0, this.height / scale / 2 - this.dimensions.y / scale / 2);
      Normalizer.transform = new Vector2(
        0,
        this.height / scale / 2 - this.dimensions.y / scale / 2
      );
    }
  }
}
