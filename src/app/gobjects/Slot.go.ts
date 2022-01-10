import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";
import { Card } from "./Card.go";

interface Props {
  position: Vector2;
  hover?: boolean;
}

export class SlotState {
  position: Vector2;
  hover: boolean;

  constructor(props: Props) {
    this.position = props.position;
    this.hover = props.hover || false;
  }
}

export class Slot extends GObject {
  public state: SlotState;

  constructor(state: SlotState) {
    const { position } = state;

    super({
      position,
      dimensions: new Vector2(Card.WIDTH, Card.HEIGHT),
      className: "placeholder",
    });

    this.state = state;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    ctx.strokeStyle = "#ffa22b";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.position.x + 1,
      this.position.y + 1,
      Card.WIDTH - 2,
      Card.HEIGHT - 2
    );

    if (this.state.hover) {
      ctx.strokeStyle = "#e3efaf";
      ctx.lineWidth = 1;
      ctx.lineDashOffset = Card.marchShow;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(
        this.position.x - 1,
        this.position.y - 1,
        Card.WIDTH + 2,
        Card.HEIGHT + 2
      );
    }

    ctx.restore();
  }
}
