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
import {
  TEST_CARD_1,
  TEST_CARD_2,
  TEST_CARD_3,
  TEST_CARD_4,
} from "./test-data";

const PLAY_AREA_WIDTH = 205;
const WIDTH = 450;
const HEIGHT = 300;
const SIDEBAR_WIDTH = (WIDTH - PLAY_AREA_WIDTH) / 2;

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
  sacrifice = false;
  bloodNeeded = 0;
  lastMouseState = 0;

  constructor() {
    super();

    (window as any).scene = this;
    (window as any).manager = this.manager;

    this.manager.listen("create-card", (card) => {
      this.cards.push(card);
    });

    this.manager.listen("remove-card", (card: CardState) => {
      card.animateDeath().then(() => {
        this.cards = this.cards.filter((c) => c.id !== card.id);
      });
    });

    this.manager.startGame();
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
    this.hoveringDeck = false;
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
    let dontResetClick = false;

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
            if (
              this.lastMouseState === 0 &&
              game.input.mouseIsDown() &&
              !this.sacrifice
            ) {
              card.home = slot.state.position.clone();
              card.selectable = false;
              this.manager.placeCard(card, slot.state.id);
            }
          }
        }
        if (this.bloodNeeded === 0) {
          slot.state.hover = true;
        }
        resetHover = false;
      }
    });

    if (game.input.mouseIsDown()) {
      if (this.lastMouseState === 0) {
        resetClick = true;
      }
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

      if (
        this.bloodNeeded > 0 &&
        this.sacrifice &&
        this.manager.getSlot(cardState)?.[0] === "player"
      ) {
        if (game.input.mouseIsDown() && this.lastMouseState === 0) {
          this.bloodNeeded -= 1;
          cardState.sacrificed = true;
          resetClick = false;
          dontResetClick = true;

          if (this.bloodNeeded === 0) {
            this.sacrifice = false;
            this.cards
              .filter((card) => card.sacrificed)
              .forEach((card) => {
                this.manager.removeCard(card);
              });
          }
        } else {
          cardState.hover = true;
          resetHover = false;
        }
      }
    });

    game.registerCollision("mouse", "#deck", () => {
      if (
        game.input.mouseIsDown() &&
        this.hoveringDeck &&
        !this.clickingDeck &&
        this.manager.phase === "draw"
      ) {
        this.clickingDeck = true;
        this.hoveringDeck = false;
        this.manager.addCard(
          [TEST_CARD_1, TEST_CARD_2, TEST_CARD_3, TEST_CARD_4][
            Math.floor(Math.random() * 4)
          ],
          "hand"
        );
        this.manager.phase = "play";
      } else if (!game.input.mouseIsDown()) {
        this.hoveringDeck = true;
        this.clickingDeck = false;
        resetHover = false;
      }
    });

    if (this.dragging) {
      game.canvasElement.style.cursor = "grabbing";
      // const card = this.getDraggingCard();
      // if (card && this.mouse.add(this.dragStart.invert()).getMagnitude() > 10) {
      //   card.position = this.mouse.add(this.liftedDelta.invert());
      //   this.selectSlot = true;
      // }
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
            if (card.data.cost_type !== "blood") {
              card.clicked = true;
              this.selectSlot = true;
            }
            if (
              card.data.cost_type === "blood" &&
              this.manager.hasBlood(card.data.cost)
            ) {
              card.clicked = true;
              this.selectSlot = true;
              if (card.data.cost > 0) {
                this.bloodNeeded = card.data.cost;
                this.sacrifice = true;
              }
            }
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
        if (!dontResetClick) {
          this.resetClick();
          this.selectSlot = false;
          this.bloodNeeded = 0;
          this.sacrifice = false;
        }
      }
      this.lastMouseState = game.input.mouseIsDown() ? 1 : 0;
    });
  }
}
