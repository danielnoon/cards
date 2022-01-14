import { Vector2 } from "gamedeck/lib/Utils";
import { Card, CardState } from "../gobjects/Card.go";
import { Hand, HAND_CARD_Y } from "../gobjects/Hand.go";
import ICard from "../types/Card.model";
import { EventManager } from "./EventManager";
import { State } from "./State";
import { enumerate } from "itertools";
import {
  TEST_CARD_0,
  TEST_CARD_1,
  TEST_CARD_2,
  TEST_CARD_3,
} from "../test-data";

const locations = {
  hand: (slot: number) => new Vector2(100, HAND_CARD_Y),
  player: (slot: number) => new Vector2(0, 0),
  opponent: (slot: number) => new Vector2(0, 0),
};

const HAND_WIDTH = 400 - Card.WIDTH - (Hand.HEIGHT - Card.HEIGHT) / 2;

export class GameManager {
  state = new State();
  events = new EventManager();
  private currentId = 0;

  get phase() {
    return this.state.phase;
  }

  set phase(phase: "draw" | "play" | "end") {
    this.state.phase = phase;
    this.events.dispatch("phase-change", phase);
  }

  getValidMoves() {
    return this.state.play.player
      .map((card, i) => (card ? null : i))
      .filter((i) => i !== null);
  }

  placeCard(card: CardState, slot: number) {
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
    this.addHandCard(this.state.deck.pop()!);
  }

  addCard(card: ICard, row: "hand"): void;
  addCard(card: ICard, row: "player" | "opponent", slot: number): void;
  addCard(card: ICard, row: "player" | "opponent" | "hand", slot?: number) {
    if (row === "hand") {
      this.addHandCard(card);
    } else {
      const state = new CardState(
        this.currentId,
        card,
        locations[row](slot ?? 0),
        false
      );
      this.events.dispatch("create-card", state);
    }
    this.currentId += 1;
  }

  private addHandCard(card: ICard) {
    const c = this.state.hand.length;
    const totalWidth = HAND_WIDTH;
    const cardWidth = Card.WIDTH;

    const gap = (totalWidth - cardWidth * c) / (c + 2);

    for (const [i, card] of enumerate(this.state.hand)) {
      card.moveTo(new Vector2(gap + gap * i + cardWidth * i, HAND_CARD_Y), 30);
    }

    const state = new CardState(
      this.currentId,
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
    console.log(slot);
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

  startGame() {
    this.state.phase = "play";
    this.state.turn = "player";
    this.state.turnCount = 0;
    this.state.play.player = [null, null, null, null];
    this.state.play.opponent = [null, null, null, null];
    this.state.hand = [];
    this.state.graveyard = [];

    setTimeout(() => this.addCard(TEST_CARD_0, "hand"), 500);
    setTimeout(() => this.addCard(TEST_CARD_1, "hand"), 1000);
    setTimeout(() => this.addCard(TEST_CARD_2, "hand"), 1500);
    setTimeout(() => this.addCard(TEST_CARD_3, "hand"), 2000);
  }
}
