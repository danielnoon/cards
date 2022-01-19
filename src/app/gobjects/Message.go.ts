import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";
import { text } from "../text";

interface Props {
  message: string;
  severity: "info" | "warning" | "error";
}

export class Message extends GObject {
  private message: string;
  private severity: "info" | "warning" | "error";

  constructor({ message, severity }: Props) {
    super({ position: new Vector2(0, 0), dimensions: new Vector2(0, 0) });

    this.message = message;
    this.severity = severity;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const color =
      this.severity === "info"
        ? "green"
        : this.severity === "warning"
        ? "red"
        : "red";

    const { width, height, draw } = text(this.message);

    draw(ctx, 450 / 2 - width / 2, height + 10, color);

    ctx.restore();
  }
}
