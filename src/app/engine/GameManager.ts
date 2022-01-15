import { Vector2 } from "gamedeck/lib/Utils";
import { Card, CardState } from "../gobjects/Card.go";
import { Hand, HAND_CARD_Y } from "../gobjects/Hand.go";
import ICard from "../types/Card.model";
import { EventManager } from "./EventManager";
import { State } from "./State";
import { enumerate } from "itertools";
import Action, { PlaceCardAction } from "../types/Action.model";
import { SyncManager } from "./SyncManager";

const locations = {
  hand: (slot: number) => new Vector2(100, HAND_CARD_Y),
  player: (slot: number) => new Vector2(0, 0),
  opponent: (slot: number) =>
    new Vector2(
      122.5 + 5 * (1 + slot) + Card.WIDTH * slot,
      Hand.Y - Card.HEIGHT * 2 - 10
    ),
};

export interface Sac {
  state: CardState;
  slot: number;
}

const HAND_WIDTH = 400 - Card.WIDTH - (Hand.HEIGHT - Card.HEIGHT) / 2;

export class GameManager {
  state = new State();
  events = new EventManager();
  sync = new SyncManager();
  private actions: Action[] = [];
  private get actionExecutors() {
    return new Map([["place_card", this.executePlaceCard]]);
  }

  constructor() {
    this.sync.listen("start", (data) => {
      for (const [n, card] of enumerate(data.hand)) {
        setTimeout(() => this.addCard(card.id, card.data, "hand"), n * 750);
      }
    });

    this.sync.listen("begin_initial_turn", async (data) => {
      this.phase = "play";
      if (data.actions) {
        await this.executeActions(data.actions);
        await this.fight("opponent");
        this.state.message = "Your turn.";
      }
    });

    this.sync.listen("begin_turn", async (data) => {
      this.phase = data.phase;
      await this.executeActions(data.actions);
      await this.fight("opponent");
      this.state.message = "Your turn.";
    });

    this.sync.listen("draw_card", (data) => {
      for (const card of data.hand.filter(
        (c) => !this.state.hand.find((c2) => c2.id === c.id)
      )) {
        this.addHandCard(card.id, card.data);
      }
      this.state.phase = "play";
    });

    this.sync.listen("commit_turn_success", () => {
      this.fight("player");
    });

    this.sync.listen("error", ({ message }) => {
      this.state.error = message;
    });
  }

  get phase() {
    return this.state.phase;
  }

  set phase(phase: "draw" | "play" | "end" | "attack" | "starting") {
    this.state.phase = phase;
    this.events.dispatch("phase-change", phase);
  }

  executePlaceCard = async (action: PlaceCardAction) => {
    if (action.sacrifices.length > 0) {
      for (const sacrifice of action.sacrifices) {
        this.state.play.opponent[sacrifice]!.sacrificed = true;
        await this.state.play.opponent[sacrifice]?.animateDeath();
        this.killCard(this.state.play.opponent[sacrifice]!);
      }
    }

    const state = this.addCard(
      action.id,
      action.card,
      "opponent",
      action.position
    );
    await state.animateFromTop();
  };

  async executeActions(actions: Action[]) {
    for (const action of actions) {
      const executor = this.actionExecutors.get(action.type);
      if (executor) {
        await executor(action);
      }
    }
  }

  async fight(player: "player" | "opponent") {
    if (player === "player") {
      for (const [slot, card] of enumerate(this.state.play.player)) {
        if (card) {
          card.animateAttack("opponent");
          const opposingCard = this.state.play.opponent[slot];

          if (opposingCard) {
            opposingCard.damage += card.data.attack;
            if (opposingCard.data.health <= opposingCard.damage) {
              await opposingCard.animateDeath();
              this.killCard(opposingCard);
            }
          } else {
            this.state.scale[1] += card.data.attack;
          }
        }
      }
    } else {
      for (const [slot, card] of enumerate(this.state.play.opponent)) {
        if (card) {
          card.animateAttack("player");
          const opposingCard = this.state.play.player[slot];

          if (opposingCard) {
            opposingCard.damage += card.data.attack;
            if (opposingCard.data.health <= opposingCard.damage) {
              await opposingCard.animateDeath();
              this.killCard(opposingCard);
            }
          } else {
            this.state.scale[0] += card.data.attack;
          }
        }
      }
    }
  }

  getValidMoves() {
    return this.state.play.player
      .map((card, i) => (card ? null : i))
      .filter((i) => i !== null);
  }

  placeCard(card: CardState, slot: number, sacrifices: number[] = []) {
    if (card.data.cost_type === "blood") {
      if (sacrifices.length < card.data.cost) {
        alert("Not enough blood.");
        return;
      } else {
        this.actions.push({
          type: "place_card",
          id: card.id,
          position: slot,
          sacrifices: sacrifices.slice(),
          card: card.data,
        });
      }
    }

    this.state.play.player[slot] = card;
    this.state.hand.splice(this.state.hand.indexOf(card), 1);

    queueMicrotask(() => {
      const c = this.state.hand.length;
      const totalWidth = HAND_WIDTH;
      const cardWidth = Card.WIDTH;

      const gap = (totalWidth - cardWidth * c) / (c + 1);

      for (const [i, card] of enumerate(this.state.hand)) {
        card.moveTo(
          new Vector2(gap + gap * i + cardWidth * i, HAND_CARD_Y),
          30
        );
      }
    });
  }

  listen(event: "create-card", callback: (arg: CardState) => void): () => void;
  listen(event: "remove-card", callback: (arg: CardState) => void): () => void;
  listen<T>(event: string, callback: (arg: T) => void) {
    return this.events.listen(event, callback);
  }

  drawCard() {
    this.sync.send("draw_card");
  }

  addCard(id: number, card: ICard, row: "hand"): void;
  addCard(
    id: number,
    card: ICard,
    row: "player" | "opponent",
    slot: number
  ): CardState;
  addCard(
    id: number,
    card: ICard,
    row: "player" | "opponent" | "hand",
    slot?: number
  ) {
    if (row === "hand") {
      this.addHandCard(id, card);
    } else {
      const state = new CardState(id, card, locations[row](slot ?? 0), false);
      this.events.dispatch("create-card", state);
      this.state.play[row][slot ?? 0] = state;
      return state;
    }
  }

  private addHandCard(id: number, card: ICard) {
    const c = this.state.hand.length;
    const totalWidth = HAND_WIDTH;
    const cardWidth = Card.WIDTH;

    const gap = (totalWidth - cardWidth * c) / (c + 2);

    for (const [i, card] of enumerate(this.state.hand)) {
      card.moveTo(new Vector2(gap + gap * i + cardWidth * i, HAND_CARD_Y), 30);
    }

    const state = new CardState(
      id,
      card,
      new Vector2(gap + gap * c + cardWidth * c, HAND_CARD_Y),
      true
    );

    this.events.dispatch("create-card", state);
    this.state.hand.push(state);

    state.animateIntoHand();
  }

  killCard(card: CardState) {
    this.state.graveyard.push(card);
    this.removeCard(card);
    this.state.bones += 1;
  }

  removeCard(card: CardState) {
    const slot = this.getSlot(card);
    if (slot) {
      const [row, index] = slot;
      if (row === "hand") {
        this.state.hand.splice(index, 1);
      } else {
        this.state.play[row][index] = null;
      }
      this.events.dispatch("remove-card", card);
    }
  }

  getSlot(card: CardState): ["player" | "hand" | "opponent", number] | null {
    if (this.state.hand.includes(card)) {
      return ["hand", this.state.hand.indexOf(card)];
    } else if (this.state.play.player.includes(card)) {
      return ["player", this.state.play.player.indexOf(card)];
    } else if (this.state.play.opponent.includes(card)) {
      return ["opponent", this.state.play.opponent.indexOf(card)];
    } else {
      return null;
    }
  }

  hasBlood(n: number) {
    return (
      this.state.play.player.reduce((prev, card) => prev + (card ? 1 : 0), 0) >=
      n
    );
  }

  commitPlay() {
    this.sync.send("commit_turn", {
      actions: this.actions,
    });
    this.actions = [];
    this.phase = "attack";
  }

  async startGame() {
    this.state.phase = "starting";
    this.state.turn = "player";
    this.state.turnCount = 0;
    this.state.play.player = [null, null, null, null];
    this.state.play.opponent = [null, null, null, null];
    this.state.hand = [];
    this.state.graveyard = [];

    setTimeout(() => this.sync.send("ready"), 1000);
  }
}
