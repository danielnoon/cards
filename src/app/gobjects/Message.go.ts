import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";

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

    ctx.fillStyle =
      this.severity === "info"
        ? "#e3efaf"
        : this.severity === "warning"
        ? "#f9e3af"
        : "#f9afaf";
    ctx.font = "8px 'Press Start 2P'";

    const { width, actualBoundingBoxAscent: height } = ctx.measureText(
      this.message
    );

    ctx.fillText(this.message, 450 / 2 - width / 2, height + 10);

    ctx.restore();
  }
}
