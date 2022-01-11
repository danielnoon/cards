import { Scene } from "gamedeck/lib/Scene";
import { Game } from "gamedeck/lib/Game";
import { Dot, Rectangle } from "gamedeck/lib/GObjects";
import { Vector2 } from "gamedeck/lib/Utils";
import { Background } from "./gobjects/Background.go";
import { Card, CardState } from "./gobjects/Card.go";
import ICard from "./types/Card.model";
import { Normalizer } from "./gobjects/Normalizer.go";
import { Reset } from "./gobjects/Reset.go";
import { Hand, HAND_CARD_Y } from "./gobjects/Hand.go";
import { Slot, SlotState } from "./gobjects/Slot.go";
import { GameManager } from "./engine/GameManager";

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

console.log(TEST_CARD_1, TEST_CARD_2, TEST_CARD_3, TEST_CARD_4);

export class Main extends Scene {
  manager = new GameManager();
  mouse = new Vector2(0, 0);
  cards = [] as CardState[];

  slots = [
    new SlotState({
      id: 0,
      position: new Vector2(SIDEBAR_WIDTH + 5, Hand.Y - Card.HEIGHT - 5),
    }),
    new SlotState({
      id: 1,
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 2 + Card.WIDTH,
        Hand.Y - Card.HEIGHT - 5
      ),
    }),
    new SlotState({
      id: 2,
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 3 + Card.WIDTH * 2,
        Hand.Y - Card.HEIGHT - 5
      ),
    }),
    new SlotState({
      id: 3,
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
  hoveringDeck = false;
  clickingDeck = false;

  constructor() {
    super();

    console.log(this);

    this.manager.listen("create-card", (card) => {
      this.cards.push(card);
    });
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
            new Hand(),
            ...this.slots.map((slot) => new Slot(slot)),
            ...this.cards.map((state) => new Card(state)),
            new Rectangle({
              width: Card.WIDTH,
              height: Card.HEIGHT,
              x: WIDTH - Card.WIDTH - (Hand.HEIGHT - Card.HEIGHT) / 4,
              y: HAND_CARD_Y,
              color: "red",
              id: "deck",
            }),
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

    const validMoves = this.manager.getValidMoves();

    let resetHover = true;
    let resetTarget = true;
    let resetClick = false;

    game.registerCollision("mouse", ".placeholder", (slot: Slot) => {
      if (this.selectSlot && validMoves.includes(slot.state.id)) {
        this.slots.forEach((slot) => (slot.hover = false));
        if (this.dragging) {
          this.dragTarget = slot.state;
          resetTarget = false;
        } else {
          this.dragTarget = null;
          const card = this.cards.find((card) => card.clicked);
          if (card) {
            if (game.input.mouseIsDown()) {
              card.home = slot.state.position.clone();
              card.selectable = false;
              this.manager.placeCard(card, slot.state.id);
            }
          }
        }
        slot.state.hover = true;
        resetHover = false;
      }
    });

    if (game.input.mouseIsDown()) {
      resetClick = true;
    }

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

    game.registerCollision("mouse", "#deck", () => {
      if (game.input.mouseIsDown() && this.hoveringDeck && !this.clickingDeck) {
        this.clickingDeck = true;
        this.hoveringDeck = false;
        this.manager.drawCard(TEST_CARD_1, "hand");
      } else if (!game.input.mouseIsDown()) {
        this.hoveringDeck = true;
        this.clickingDeck = false;
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
          this.manager.placeCard(card, this.dragTarget.id);
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
      if (resetClick) {
        this.resetClick();
        this.selectSlot = false;
      }
    });
  }
}
