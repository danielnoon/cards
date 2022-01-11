import { Vector2 } from "gamedeck/lib/Utils";
import { Card, CardState } from "../gobjects/Card.go";
import { Hand, HAND_CARD_Y } from "../gobjects/Hand.go";
import ICard from "../types/Card.model";
import { EventManager } from "./EventManager";
import { State } from "./State";
import { enumerate } from "itertools";

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

  getValidMoves() {
    return this.state.play.player
      .map((card, i) => (card ? null : i))
      .filter((i) => i !== null);
  }

  placeCard(card: CardState, slot: number) {
    this.state.play.player[slot] = card;
    this.state.hand.splice(this.state.hand.indexOf(card), 1);

    const c = this.state.hand.length;
    const totalWidth = HAND_WIDTH;
    const cardWidth = Card.WIDTH;

    const gap = (totalWidth - cardWidth * c) / (c + 1);

    for (const [i, card] of enumerate(this.state.hand)) {
      card.moveTo(new Vector2(gap + gap * i + cardWidth * i, HAND_CARD_Y), 30);
    }
  }

  listen(event: "create-card", callback: (arg: CardState) => void): () => void;
  listen<T>(event: string, callback: (arg: T) => void) {
    return this.events.listen(event, callback);
  }

  drawCard(card: ICard, row: "hand"): void;
  drawCard(card: ICard, row: "player" | "opponent", slot: number): void;
  drawCard(card: ICard, row: "player" | "opponent" | "hand", slot?: number) {
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
}
