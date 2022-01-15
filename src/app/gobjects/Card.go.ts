import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";
import { range } from "itertools";
import Animation from "../anim/Animation";
import { easeInOutCubic, easeOutCubic } from "../anim/easing";
import { Tween } from "../anim/Tween";
import { add, get } from "../image-registry";
import ICard from "../types/Card.model";

const FONT = "6px 'Press Start 2P'";
const PADDING = 2;
const OUTLINE_WIDTH = 1;

const WIDTH = 45;
const HEIGHT = 60;
const dimensions = new Vector2(WIDTH, HEIGHT);

add("/assets/blood.png");
add("/assets/sac.png");

export class CardState {
  public hover = false;
  public clicked = false;
  public dragging = false;
  public sacrificed = false;
  public animation: Animation | null = null;
  public animationState = "idle";
  public home: Vector2;
  public opacity = 1;
  public damage = 0;

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

  animateDeath() {
    return new Promise<void>((res) => {
      this.animation = new Animation(
        [
          new Tween((next) => (this.opacity = next), {
            from: this.opacity,
            to: 0,
            duration: 20,
          }),
        ],
        {
          onFinish: () => {
            res();
          },
        }
      );
    });
  }

  animateFromTop() {
    return new Promise<void>((res) => {
      this.animation = new Animation(
        [
          new Tween(this.tweenUpdate, {
            from: new Vector2(this.position.x, -HEIGHT),
            to: this.position,
            duration: 20,
            ease: easeOutCubic,
          }),
        ],
        {
          onFinish: () => {
            res();
          },
        }
      );
    });
  }

  animateIntoHand() {
    this.animation?.cancel();

    this.animation = new Animation(
      [
        new Tween(this.tweenUpdate, {
          from: new Vector2(this.position.x, 450),
          to: this.home,
          duration: 20,
          ease: easeOutCubic,
        }),
      ],
      {
        onFinish: () => {
          this.animationState = "idle";
        },
        onUpdate: () => {
          this.animationState = "enter";
        },
      }
    );

    this.animationState = "enter";
  }

  animateAttack(target: "player" | "opponent") {
    this.animation?.cancel();

    const mod = target === "player" ? 1 : -1;

    return new Promise<void>((res) => {
      this.animation = new Animation(
        [
          new Tween(this.tweenUpdate, {
            from: this.position,
            to: new Vector2(this.position.x, this.position.y + mod * 20),
            duration: 20,
            ease: easeOutCubic,
          }),
          new Tween(this.tweenUpdate, {
            from: new Vector2(this.position.x, this.position.y + mod * 20),
            to: this.position,
            duration: 20,
            ease: easeOutCubic,
          }),
        ],
        {
          onFinish: () => {
            res();
            this.animationState = "idle";
          },
        }
      );
    });
  }

  moveTo(position: Vector2, duration: number) {
    this.animation?.cancel();

    this.animation = new Animation(
      [
        new Tween(this.tweenUpdate, {
          from: this.position,
          to: position,
          duration,
          ease: easeOutCubic,
        }),
      ],
      {
        onFinish: () => {
          this.animationState = "idle";
          this.home = position;
        },
        onUpdate: () => {
          this.animationState = "move";
        },
      }
    );

    this.animationState = "move";
  }

  update() {
    if (this.animationState === "idle" && !this.dragging) {
      if (this.position.x !== this.home.x && this.position.y !== this.home.y) {
        this.animationState = "return";

        this.animation?.cancel();

        this.animation = new Animation(
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
        );
      }
    }

    if (this.clicked && this.animationState === "idle") {
      this.animation = new Animation(
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
            repeat: false,
          }),
          new Tween(this.tweenUpdate, {
            from: this.position.add(new Vector2(0, -5)),
            to: this.position.add(new Vector2(0, -10)),
            duration: 50,
            ease: easeInOutCubic,
          }),
        ],
        { repeat: true }
      );

      this.animationState = "selected";
    }

    if (!this.clicked && this.animationState === "selected") {
      this.animation?.cancel();

      this.animation = new Animation([
        new Tween(this.tweenUpdate, {
          from: this.position,
          to: this.home,
          duration: 10,
          ease: easeInOutCubic,
        }),
      ]);

      this.animationState = "idle";
    }

    if (this.animation?.update()) {
      this.animation = null;
    }
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
  private sacrificed: boolean;
  private opacity: number;
  private damage: number;

  constructor({
    data,
    position,
    hover,
    id,
    animationState,
    sacrificed,
    opacity,
    damage,
  }: CardState) {
    super({ position, dimensions, className: "card", id: `card-${id}` });

    this.data = data;
    this.hover = hover ?? false;
    this.animationState = animationState;
    this.sacrificed = sacrificed;
    this.opacity = opacity;
    this.damage = damage;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = this.opacity;

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

    const health = Math.max(0, this.data.health - this.damage);

    ctx.fillText(
      health.toString(),
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

    if (this.data.cost_type === "blood") {
      ctx.scale(0.5, 0.5);

      const start = new Vector2(
        this.position.x + WIDTH - 10,
        this.position.y + 1
      );

      for (let i of range(this.data.cost)) {
        ctx.drawImage(
          get("/assets/blood.png"),
          start.x * 2 - 17 * i,
          start.y * 2
        );
      }

      ctx.scale(2, 2);
    }

    if (this.sacrificed) {
      ctx.fillStyle = "#00000099";
      ctx.fillRect(this.position.x, this.position.y, WIDTH, HEIGHT);
      ctx.drawImage(
        get("/assets/sac.png"),
        this.position.x + 3,
        this.position.y + 3
      );
    }

    ctx.font = '5px "Press Start 2P"';

    ctx.fillText(
      this.data.name,
      this.position.x + PADDING,
      this.position.y + PADDING * 4
    );

    ctx.restore();
  }
}
