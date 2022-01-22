import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";
import { range } from "itertools";
import Animation from "../anim/Animation";
import { attackStart, easeInOutCubic, easeOutCubic } from "../anim/easing";
import { Tween } from "../anim/Tween";
import { Wait } from "../anim/Wait";
import { GAME_WIDTH } from "../constants";
import { add, get, has } from "../image-registry";
import sigils from "../sigils";
import { number, NUMBER_HEIGHT, NUMBER_WIDTH, text } from "../text";
import ICard from "../types/Card.model";
import { Hand } from "./Hand.go";

const PADDING = 2;
const OUTLINE_WIDTH = 1;

const WIDTH = 45;
const HEIGHT = 60;
const dimensions = new Vector2(WIDTH, HEIGHT);

add("/assets/blood.png");
add("/assets/sac.png");
add("/assets/creatures/squirrel.png");

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
  public dead = false;
  public darkened = false;

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
            duration: 160,
          }),
        ],
        {
          onFinish: () => {
            this.dead = true;
            res();
          },
        }
      );
    });
  }

  animateDamage() {
    this.animation?.cancel();

    this.animation = new Animation(
      [
        new Tween(() => (this.darkened = true), {
          from: this.position,
          to: new Vector2(this.position.x, this.position.y + 20),
          duration: 100,
        }),
        new Wait(100),
        new Tween(() => (this.darkened = false), {
          from: this.position,
          to: new Vector2(this.position.x, this.position.y + 20),
          duration: 100,
        }),
        new Wait(100),
        new Tween(() => (this.darkened = true), {
          from: this.position,
          to: new Vector2(this.position.x, this.position.y + 20),
          duration: 100,
        }),
        new Wait(100),
        new Tween(() => (this.darkened = false), {
          from: this.position,
          to: new Vector2(this.position.x, this.position.y + 20),
          duration: 100,
        }),
      ],
      {
        onFinish: () => {
          this.animationState = "idle";
        },
      }
    );

    this.animationState = "damage";
  }

  animateFromTop() {
    return new Promise<void>((res) => {
      this.animation = new Animation(
        [
          new Tween(this.tweenUpdate, {
            from: new Vector2(this.position.x, -HEIGHT),
            to: this.position,
            duration: 300,
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
          from: new Vector2(
            GAME_WIDTH - Card.WIDTH - (Hand.HEIGHT - Card.HEIGHT) / 4,
            this.position.y
          ),
          to: this.home,
          duration: 500,
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
            to: new Vector2(this.position.x, this.position.y + mod * 15),
            duration: 400,
            ease: attackStart,
          }),
          new Wait(200),
          new Tween(this.tweenUpdate, {
            from: new Vector2(this.position.x, this.position.y + mod * 15),
            to: this.position.add(new Vector2(0, mod * -5)),
            duration: 300,
            ease: easeInOutCubic,
          }),
          new Tween(this.tweenUpdate, {
            from: this.position.add(new Vector2(0, mod * -2)),
            to: this.position.add(new Vector2(0, mod * 2)),
            duration: 100,
            ease: easeInOutCubic,
          }),
          new Tween(this.tweenUpdate, {
            from: this.position.add(new Vector2(0, mod * 2)),
            to: this.position,
            duration: 100,
            ease: easeInOutCubic,
          }),
        ],
        {
          onFinish: () => {
            this.animationState = "idle";
            res();
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
              duration: 160,
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
            duration: 300,
            ease: easeOutCubic,
            repeat: false,
          }),
          new Tween(this.tweenUpdate, {
            from: this.position.add(new Vector2(0, -10)),
            to: this.position.add(new Vector2(0, -5)),
            duration: 800,
            ease: easeInOutCubic,
          }),
          new Tween(this.tweenUpdate, {
            from: this.position.add(new Vector2(0, -5)),
            to: this.position.add(new Vector2(0, -10)),
            duration: 800,
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
          duration: 120,
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

    if (has(`/assets/creatures/${this.data.name.toLowerCase()}.png`)) {
      ctx.drawImage(
        get(`/assets/creatures/${this.data.name.toLowerCase()}.png`),
        this.position.x,
        this.position.y
      );
    } else {
      text(this.data.name).draw(
        ctx,
        this.position.x + PADDING,
        this.position.y + PADDING,
        "black"
      );
    }

    ctx.strokeStyle = "black";
    ctx.lineWidth = OUTLINE_WIDTH;
    ctx.strokeRect(this.position.x, this.position.y, WIDTH, HEIGHT);
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y + HEIGHT / 2);
    ctx.lineTo(this.position.x + WIDTH, this.position.y + HEIGHT / 2);
    ctx.stroke();

    number(this.data.attack).draw(
      ctx,
      this.position.x + PADDING,
      this.position.y + this.dimensions.y - PADDING - NUMBER_HEIGHT,
      "black"
    );

    const health = Math.max(0, this.data.health - this.damage);

    const { width: healthWidth, draw: drawHealth } = number(health);

    drawHealth(
      ctx,
      this.position.x + WIDTH - healthWidth - PADDING,
      this.position.y + this.dimensions.y - PADDING - NUMBER_HEIGHT,
      "black"
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

    if (this.data.cost_type === "bones") {
      const { width: costWidth, draw } = number(this.data.cost);

      ctx.drawImage(
        get("/assets/bone-count.png"),
        this.position.x + WIDTH - costWidth - 13,
        this.position.y
      );

      draw(
        ctx,
        this.position.x + WIDTH - NUMBER_WIDTH,
        this.position.y + 6,
        "green"
      );
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

    if (this.data.sigils[0]) {
      const sigil = sigils.get(this.data.sigils[0]);
      if (sigil) {
        ctx.drawImage(
          sigil.image,
          this.position.x + WIDTH / 2 - sigil.image.width / 2,
          this.position.y + (3 * HEIGHT) / 4 - sigil.image.height / 2
        );
      }
    }

    ctx.restore();
  }
}
