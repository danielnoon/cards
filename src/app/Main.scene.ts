import { Scene } from "gamedeck/lib/Scene";
import { Game } from "gamedeck/lib/Game";
import { Dot, Rectangle } from "gamedeck/lib/GObjects";
import { Vector2 } from "gamedeck/lib/Utils";
import { Background } from "./gobjects/Background.go";
import { Card, CardState } from "./gobjects/Card.go";
import { Normalizer } from "./gobjects/Normalizer.go";
import { Reset } from "./gobjects/Reset.go";
import { Hand, HAND_CARD_Y } from "./gobjects/Hand.go";
import { Slot, SlotState } from "./gobjects/Slot.go";
import { GameManager } from "./engine/GameManager";
import { Message } from "./gobjects/Message.go";
import { Bell, BellState } from "./gobjects/Bell.go";
import { Status } from "./gobjects/Status.go";
import { SIDEBAR_WIDTH, GAME_HEIGHT, GAME_WIDTH } from "./constants";

export class Main extends Scene {
  manager = new GameManager();
  mouse = new Vector2(0, 0);
  cards = [] as CardState[];
  bellState = new BellState();

  slots = [
    new SlotState({
      id: 0,
      position: new Vector2(SIDEBAR_WIDTH + 5, Hand.Y - Card.HEIGHT - 5),
      type: "player",
    }),
    new SlotState({
      id: 1,
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 2 + Card.WIDTH,
        Hand.Y - Card.HEIGHT - 5
      ),
      type: "player",
    }),
    new SlotState({
      id: 2,
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 3 + Card.WIDTH * 2,
        Hand.Y - Card.HEIGHT - 5
      ),
      type: "player",
    }),
    new SlotState({
      id: 3,
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 4 + Card.WIDTH * 3,
        Hand.Y - Card.HEIGHT - 5
      ),
      type: "player",
    }),
  ];

  opponentSlots = [
    new SlotState({
      id: 4,
      position: new Vector2(SIDEBAR_WIDTH + 5, Hand.Y - Card.HEIGHT * 2 - 10),
      type: "opponent",
    }),
    new SlotState({
      id: 5,
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 2 + Card.WIDTH,
        Hand.Y - Card.HEIGHT * 2 - 10
      ),
      type: "opponent",
    }),
    new SlotState({
      id: 6,
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 3 + Card.WIDTH * 2,
        Hand.Y - Card.HEIGHT * 2 - 10
      ),
      type: "opponent",
    }),
    new SlotState({
      id: 7,
      position: new Vector2(
        SIDEBAR_WIDTH + 5 * 4 + Card.WIDTH * 3,
        Hand.Y - Card.HEIGHT * 2 - 10
      ),
      type: "opponent",
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
  errorMessage = "";
  forcePlay = false;
  sacrifices = [] as number[];

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

  getMessages(): Message[] {
    return [
      this.manager.sync.connecting &&
        new Message({ message: "Connecting...", severity: "info" }),
      this.manager.sync.waiting &&
        new Message({ message: "Waiting for opponent...", severity: "info" }),
      this.manager.sync.error &&
        new Message({
          message: this.manager.sync.error,
          severity: "error",
        }),
      this.manager.state.message &&
        new Message({
          message: this.manager.state.message,
          severity: "info",
        }),
      this.manager.state.error &&
        new Message({
          message: this.manager.state.error,
          severity: "error",
        }),
    ].filter((m) => m) as Message[];
  }

  build(game: Game) {
    return new Background({
      path: "/assets/wood.jpg",
      scale: 0.5,
      children: [
        new Normalizer({
          width: game.width,
          height: game.height,
          ratio: GAME_WIDTH / GAME_HEIGHT,
          children: [
            new Message({ message: this.errorMessage, severity: "error" }),
            ...this.getMessages(),
            new Bell(this.bellState),
            new Status({
              blood: this.bloodNeeded,
              bones: this.manager.state.bones,
              energy: 2,
              gems: this.manager.state.gems,
              scale: this.manager.state.scale,
            }),
            new Hand(),
            ...this.slots.map((slot) => new Slot(slot)),
            ...this.opponentSlots.map((slot) => new Slot(slot)),
            ...this.cards.map((state) => new Card(state)),
            new Rectangle({
              width: Card.WIDTH,
              height: Card.HEIGHT,
              x: GAME_WIDTH - Card.WIDTH - (Hand.HEIGHT - Card.HEIGHT) / 4,
              y: HAND_CARD_Y,
              color: this.manager.phase === "draw" ? "green" : "red",
              id: "deck",
            }),
            new Dot({
              position: this.mouse.add(new Vector2(-1, -1)),
              radius: 1,
              color: "transparent",
              id: "mouse",
            }),
            new Background({
              path: "/assets/scanlines-small.png",
              alpha: 0.125,
              scale: 0.125 / 2,
            }),
          ],
        }),
        new Reset(),
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
    this.bellState.hover = false;
  }

  resetClick() {
    this.cards.forEach((card) => (card.clicked = false));
    this.cards.forEach((card) => (card.sacrificed = false));
    this.bellState.clicked = false;
  }

  update(game: Game) {
    this.mouse = game.input
      .getMouseLocation()
      .scalar(1 / Normalizer.scale)
      .add(Normalizer.transform.invert());

    game.canvasElement.style.cursor = "default";

    for (const card of this.cards) {
      if (card.dead) {
        this.cards = this.cards.filter((c) => c.id !== card.id);
      }
    }

    if (this.manager.state.message) {
      game.setTimer("clear-message", "2000", () => {
        this.manager.state.message = "";
      });
    }

    if (this.manager.phase === "play") {
      this.bellState.disabled = false;
    } else {
      this.bellState.disabled = true;
    }

    const validMoves = this.manager.getValidMoves();

    let resetHover = true;
    let resetTarget = true;
    let resetBell = true;
    let resetClick = false;
    let dontResetClick = false;

    game.registerCollision("mouse", ".player-slot", (slot: Slot) => {
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
              this.manager.placeCard(card, slot.state.id, this.sacrifices);
              this.sacrifices = [];
              this.resetClick();
              this.forcePlay = false;
              card.clicked = false;
              resetClick = true;
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
      if (this.lastMouseState === 0 && !this.forcePlay) {
        resetClick = true;
      }
    }

    game.registerCollision("mouse", ".card", (card: Card) => {
      const id = this.getCardId(card.id ?? "");
      const cardState = this.getCardById(id)!;

      if (
        game.input.mouseIsDown() &&
        !this.dragging &&
        cardState.selectable &&
        !this.forcePlay &&
        this.manager.phase === "play" &&
        cardState.animationState === "idle"
      ) {
        this.dragging = true;
        this.liftedCard = id;
        this.liftedDelta = this.mouse.add(card.position.invert());
        cardState.dragging = true;
        this.dragStart = this.mouse;
      }

      if (
        !this.dragging &&
        !cardState.clicked &&
        cardState.selectable &&
        !this.forcePlay &&
        this.manager.phase === "play" &&
        cardState.animationState === "idle"
      ) {
        this.resetHover();
        cardState.hover = true;
        resetHover = false;
      }

      if (
        this.bloodNeeded > 0 &&
        this.sacrifice &&
        this.manager.getSlot(cardState)?.[0] === "player" &&
        cardState.sacrificed === false
      ) {
        if (game.input.mouseIsDown() && this.lastMouseState === 0) {
          this.bloodNeeded -= 1;
          cardState.sacrificed = true;
          resetClick = false;
          dontResetClick = true;

          if (this.bloodNeeded === 0) {
            this.sacrifice = false;
            this.forcePlay = true;
            this.cards
              .filter((card) => card.sacrificed)
              .forEach((card) => {
                this.sacrifices.push(this.manager.getSlot(card)![1]);
                if (!card.data.sigils.includes("many_lives")) {
                  this.manager.killCard(card);
                }
              });
          }
        } else {
          if (!this.forcePlay) {
            cardState.hover = true;
            resetHover = false;
          }
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
        this.manager.drawCard();
      } else if (!game.input.mouseIsDown()) {
        this.hoveringDeck = true;
        this.clickingDeck = false;
        resetHover = false;
      }
    });

    game.registerCollision("mouse", "#bell", () => {
      if (!this.bellState.disabled && !this.forcePlay) {
        resetBell = false;
        if (game.input.mouseIsDown() && this.lastMouseState === 0) {
          if (!this.bellState.clicked) {
            this.bellState.clicked = true;
            resetClick = false;
          }
        } else if (!game.input.mouseIsDown()) {
          if (this.bellState.clicked) {
            this.manager.commitPlay();
            this.bellState.clicked = false;
          } else {
            this.bellState.clicked = false;
            this.bellState.hover = true;
            resetHover = false;
          }
        }
      }
    });

    if (!game.input.mouseIsDown()) {
      this.dragging = false;
      this.cards.forEach((card) => (card.dragging = false));
      if (this.dragTarget) {
        const card = this.getDraggingCard();
        if (card) {
          card.home = this.dragTarget.position.clone();
          card.selectable = false;
          this.manager.placeCard(card, this.dragTarget.id, this.sacrifices);
          this.sacrifices = [];
          this.resetClick();
          this.forcePlay = false;
          this.dragTarget = null;
          resetClick = true;
          card.clicked = false;
        }
      }
      if (this.liftedCard !== -1) {
        const card = this.getCardById(this.liftedCard);
        this.liftedCard = -1;
        this.selectSlot = false;
        if (card) {
          if (this.mouse.add(this.dragStart.invert()).getMagnitude() < 10) {
            if (card.data.cost_type === "blood") {
              if (this.manager.hasBlood(card.data.cost)) {
                card.clicked = true;
                this.selectSlot = true;
                if (card.data.cost > 0) {
                  this.bloodNeeded = card.data.cost;
                  this.sacrifice = true;
                }
              } else {
                this.errorMessage = "You don't have enough blood!";
                game.setTimer("resetError", "2000", () => {
                  this.errorMessage = "";
                });
              }
            }
            if (card.data.cost_type === "bones") {
              if (this.manager.state.bones >= card.data.cost) {
                card.clicked = true;
                this.selectSlot = true;
                this.sacrifice = false;
              } else {
                this.errorMessage = "You don't have enough bones!";
                game.setTimer("resetError", "2000", () => {
                  this.errorMessage = "";
                });
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
      if (resetClick && !this.forcePlay) {
        if (!dontResetClick) {
          this.resetClick();
          this.selectSlot = false;
          this.bloodNeeded = 0;
          this.sacrifice = false;
        }
      }
      if (resetBell) {
        this.bellState.clicked = false;
      }
      this.lastMouseState = game.input.mouseIsDown() ? 1 : 0;
    });
  }
}
