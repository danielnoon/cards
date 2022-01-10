import { Scene } from "gamedeck/lib/Scene";
import { Game } from "gamedeck/lib/Game";
import { Dot, Rectangle } from "gamedeck/lib/GObjects";
import { Vector2 } from "gamedeck/lib/Utils";
import { Background } from "./gobjects/Background.go";
import { Card, CardState } from "./gobjects/Card.go";
import ICard from "./types/Card.model";
import { Normalizer } from "./gobjects/Normalizer.go";
import { Reset } from "./gobjects/Reset.go";
import { Hand } from "./gobjects/Hand.go";
import { Slot, SlotState } from "./gobjects/Slot.go";

const HAND_CARD_Y = Hand.Y + Hand.HEIGHT / 2 - Card.HEIGHT / 2;
const PLAY_AREA_WIDTH = 205;
const WIDTH = 450;
const HEIGHT = 300;
const SIDEBAR_WIDTH = (WIDTH - PLAY_AREA_WIDTH) / 2;

const TEST_CARD_1: ICard = {
  id: 0,
  image: "",
  name: "",
  attack: 1,
  health: 2,
  cost_type: "blood",
  cost: 1,
};

const TEST_CARD_2: ICard = {
  id: 1,
  image: "",
  name: "",
  attack: 2,
  health: 1,
  cost_type: "blood",
  cost: 1,
};

const TEST_CARD_3: ICard = {
  id: 2,
  image: "",
  name: "",
  attack: 2,
  health: 2,
  cost_type: "blood",
  cost: 2,
};

const TEST_CARD_4: ICard = {
  id: 3,
  image: "",
  name: "",
  attack: 4,
  health: 3,
  cost_type: "blood",
  cost: 3,
};

export class Main extends Scene {
  mouse = new Vector2(0, 0);
  cards = [
    new CardState(
      0,
      TEST_CARD_1,
      new Vector2(SIDEBAR_WIDTH + 5, HAND_CARD_Y),
      true
    ),
    new CardState(
      1,
      TEST_CARD_2,
      new Vector2(SIDEBAR_WIDTH + 55, HAND_CARD_Y),
      true
    ),
    new CardState(
      2,
      TEST_CARD_3,
      new Vector2(SIDEBAR_WIDTH + 105, HAND_CARD_Y),
      true
    ),
    new CardState(
      3,
      TEST_CARD_4,
      new Vector2(SIDEBAR_WIDTH + 155, HAND_CARD_Y),
      true
    ),
  ];

  slots = [
    new SlotState({
      position: new Vector2(SIDEBAR_WIDTH + 5, Hand.Y - Card.HEIGHT - 5),
    }),
    new SlotState({
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 2 + Card.WIDTH,
        Hand.Y - Card.HEIGHT - 5
      ),
    }),
    new SlotState({
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 3 + Card.WIDTH * 2,
        Hand.Y - Card.HEIGHT - 5
      ),
    }),
    new SlotState({
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 4 + Card.WIDTH * 3,
        Hand.Y - Card.HEIGHT - 5
      ),
    }),
  ];

  liftedCard = -1;
  liftedDelta = new Vector2(0, 0);
  dragging = false;
  dragStart = new Vector2(0, 0);
  selectedCard = -1;
  selectSlot = false;
  dragTarget: SlotState | null = null;

  constructor() {
    super();
    console.log(this);
  }

  build(game: Game) {
    return new Background({
      path: "/assets/wood.jpg",
      scale: 0.5,
      children: [
        new Normalizer({
          width: game.width,
          height: game.height,
          ratio: WIDTH / HEIGHT,
          children: [
            // new Rectangle({
            //   x: 0,
            //   y: 0,
            //   width: SIDEBAR_WIDTH,
            //   height: HEIGHT - Hand.HEIGHT,
            //   color: "red",
            // }),
            // new Rectangle({
            //   x: SIDEBAR_WIDTH + PLAY_AREA_WIDTH,
            //   y: 0,
            //   width: SIDEBAR_WIDTH,
            //   height: HEIGHT - Hand.HEIGHT,
            //   color: "blue",
            // }),
            new Hand(),
            ...this.slots.map((slot) => new Slot(slot)),
            ...this.cards.map((state) => new Card(state)),
            new Dot({
              position: this.mouse.add(new Vector2(-1, -1)),
              radius: 1,
              color: "transparent",
              id: "mouse",
            }),
          ],
        }),
        new Reset(),
        new Background({
          path: "/assets/scanlines.png",
        }),
      ],
    });
  }

  getCardId(id: string) {
    return parseInt(id.replace("card-", ""), 10);
  }

  getCardById(id: number) {
    return this.cards.find((card) => card.id === id);
  }

  getDraggingCard() {
    return this.getCardById(this.liftedCard);
  }

  resetHover() {
    this.cards.forEach((card) => card.setHover(false));
    this.slots.forEach((slot) => (slot.hover = false));
  }

  resetClick() {
    this.cards.forEach((card) => (card.clicked = false));
  }

  update(game: Game) {
    this.mouse = game.input
      .getMouseLocation()
      .scalar(1 / Normalizer.scale)
      .add(Normalizer.transform.invert());

    game.canvasElement.style.cursor = "default";

    if (game.input.mouseIsDown()) {
      this.resetClick();
      this.selectSlot = false;
    }

    let resetHover = true;
    let resetTarget = true;

    game.registerCollision("mouse", ".card", (card: Card) => {
      const id = this.getCardId(card.id ?? "");
      const cardState = this.getCardById(id)!;
      if (game.input.mouseIsDown() && !this.dragging && cardState.selectable) {
        this.dragging = true;
        this.liftedCard = id;
        this.liftedDelta = this.mouse.add(card.position.invert());
        cardState.dragging = true;

        this.dragStart = this.mouse;
      }
      if (!this.dragging && !cardState.clicked && cardState.selectable) {
        game.canvasElement.style.cursor = "grab";
        this.resetHover();
        cardState.setHover(true);
        resetHover = false;
      }
    });

    game.registerCollision("mouse", ".placeholder", (slot: Slot) => {
      if (this.selectSlot) {
        this.slots.forEach((slot) => (slot.hover = false));
        if (this.dragging) {
          this.dragTarget = slot.state;
          resetTarget = false;
        } else {
          this.dragTarget = null;
          const card = this.cards.find((card) => card.clicked);
          if (card) {
            card.home = slot.state.position.clone();
            card.selectable = false;
          }
        }
        slot.state.hover = true;
        resetHover = false;
      }
    });

    if (this.dragging) {
      game.canvasElement.style.cursor = "grabbing";
      const card = this.getDraggingCard();
      if (card && this.mouse.add(this.dragStart.invert()).getMagnitude() > 10) {
        card.position = this.mouse.add(this.liftedDelta.invert());
        this.selectSlot = true;
      }
    }

    if (!game.input.mouseIsDown()) {
      this.dragging = false;
      this.cards.forEach((card) => (card.dragging = false));
      if (this.dragTarget) {
        const card = this.getDraggingCard();
        if (card) {
          card.home = this.dragTarget.position.clone();
          card.selectable = false;
          this.dragTarget = null;
        }
      }
      if (this.liftedCard !== -1) {
        const card = this.getCardById(this.liftedCard);
        this.liftedCard = -1;
        this.selectSlot = false;
        if (card) {
          if (this.mouse.add(this.dragStart.invert()).getMagnitude() < 10) {
            card.clicked = true;
            this.selectSlot = true;
          }
        }
      }
    }

    this.cards.forEach((card) => card.update());

    queueMicrotask(() => {
      if (resetHover) {
        this.resetHover();
      }
      if (resetTarget) {
        this.dragTarget = null;
      }
    });
  }
}
