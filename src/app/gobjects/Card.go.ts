import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";
import Animation from "../anim/Animation";
import { easeInOutCubic, easeOutCubic } from "../anim/easing";
import { Tween } from "../anim/Tween";
import ICard from "../types/Card.model";

const FONT = "6px 'Press Start 2P'";
const PADDING = 2;
const OUTLINE_WIDTH = 1;

const WIDTH = 45;
const HEIGHT = 60;
const dimensions = new Vector2(WIDTH, HEIGHT);

export class CardState {
  public hover = false;
  public clicked = false;
  public dragging = false;
  public animations: Animation[] = [];
  public animationState = "idle";
  public home: Vector2;

  constructor(
    public id: number,
    public data: ICard,
    public position: Vector2,
    public selectable: boolean
  ) {
    this.home = position;
  }

  private tweenUpdate = (next: Vector2) => (this.position = next);

  setHover(hover: boolean) {
    this.hover = hover;
  }

  update() {
    if (this.animationState === "idle" && !this.dragging) {
      if (this.position.x !== this.home.x && this.position.y !== this.home.y) {
        this.animationState = "return";

        this.animations[0]?.cancel();

        this.animations.push(
          new Animation(
            [
              new Tween(this.tweenUpdate, {
                from: this.position,
                to: this.home,
                duration: 20,
                ease: easeOutCubic,
              }),
            ],
            {
              onFinish: () => {
                this.animationState = "idle";
              },
            }
          )
        );
      }
    }

    if (this.clicked && this.animationState === "idle") {
      this.animations.push(
        new Animation(
          [
            new Tween(this.tweenUpdate, {
              from: this.position,
              to: this.position.add(new Vector2(0, -10)),
              duration: 20,
              ease: easeOutCubic,
              repeat: false,
            }),
            new Tween(this.tweenUpdate, {
              from: this.position.add(new Vector2(0, -10)),
              to: this.position.add(new Vector2(0, -5)),
              duration: 50,
              ease: easeInOutCubic,
            }),
            new Tween(this.tweenUpdate, {
              from: this.position.add(new Vector2(0, -5)),
              to: this.position.add(new Vector2(0, -10)),
              duration: 50,
              ease: easeInOutCubic,
            }),
          ],
          { repeat: true }
        )
      );

      this.animationState = "selected";
    }

    if (!this.clicked && this.animationState === "selected") {
      this.animations[0].cancel();

      this.animations.push(
        new Animation([
          new Tween(this.tweenUpdate, {
            from: this.position,
            to: this.home,
            duration: 10,
            ease: easeInOutCubic,
          }),
        ])
      );

      this.animationState = "idle";
    }

    this.animations.forEach((animation) => {
      if (animation.update()) {
        this.animations.splice(this.animations.indexOf(animation), 1);
      }
    });
  }
}

export class Card extends GObject {
  static WIDTH = WIDTH;
  static HEIGHT = HEIGHT;
  static march = 0;
  static marchShow = 0;

  private data: ICard;
  private hover: boolean;
  private animationState: string;

  constructor({ data, position, hover, id, animationState }: CardState) {
    super({ position, dimensions, className: "card", id: `card-${id}` });

    this.data = data;
    this.hover = hover ?? false;
    this.animationState = animationState;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = "#e3efaf";
    ctx.fillRect(this.position.x, this.position.y, WIDTH, HEIGHT);
    ctx.fillStyle = "#7b8165";
    ctx.fillRect(this.position.x, this.position.y, WIDTH, HEIGHT / 2);

    ctx.strokeStyle = "black";
    ctx.lineWidth = OUTLINE_WIDTH;
    ctx.strokeRect(this.position.x, this.position.y, WIDTH, HEIGHT);
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y + HEIGHT / 2);
    ctx.lineTo(this.position.x + WIDTH, this.position.y + HEIGHT / 2);
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = FONT;
    ctx.fillText(
      this.data.attack.toString(),
      this.position.x + PADDING,
      this.position.y + this.dimensions.y - PADDING
    );

    const { width: healthWidth } = ctx.measureText(this.data.health.toString());

    ctx.fillText(
      this.data.health.toString(),
      this.position.x + WIDTH - healthWidth - PADDING,
      this.position.y + this.dimensions.y - PADDING
    );

    if (this.hover && this.animationState === "idle") {
      ctx.strokeStyle = "#e3efaf";
      ctx.lineDashOffset = Card.marchShow;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(
        this.position.x - 1,
        this.position.y - 1,
        WIDTH + 2,
        HEIGHT + 2
      );
    }

    if (Card.march % 40 === 0) {
      Card.marchShow += 1;
    }
    Card.march += 1;

    ctx.restore();
  }
}
