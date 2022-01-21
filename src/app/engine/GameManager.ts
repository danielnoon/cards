import { Vector2 } from "gamedeck/lib/Utils";
import { Card, CardState } from "../gobjects/Card.go";
import { Hand, HAND_CARD_Y } from "../gobjects/Hand.go";
import ICard from "../types/Card.model";
import { EventManager } from "./EventManager";
import { State } from "./State";
import { enumerate, range } from "itertools";
import Action, { PlaceCardAction } from "../types/Action.model";
import { SyncManager } from "./SyncManager";
import sigils from "../sigils";
import { Sigil } from "../types/Sigil.model";
import { SIDEBAR_WIDTH } from "../constants";
import { Wait } from "../anim/Wait";

const locations = {
  hand: (slot: number) => new Vector2(100, HAND_CARD_Y),
  player: (slot: number) => new Vector2(0, 0),
  opponent: (slot: number) =>
    new Vector2(
      SIDEBAR_WIDTH + 5 * (1 + slot) + Card.WIDTH * slot,
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
  private damageToDeal = 0;
  private get actionExecutors() {
    return new Map([["place_card", this.executePlaceCard]]);
  }

  constructor() {
    this.sync.listen("start", (data) => {
      for (const [n, card] of enumerate(data.hand)) {
        setTimeout(() => this.addCard(card.id, card.data, "hand"), n * 300);
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

    this.sync.listen("sync", (message) => {
      console.log(message.data);
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
        const card = this.state.play.opponent[sacrifice];
        if (card && !card.data.sigils.includes("many_lives")) {
          card.sacrificed = true;
          await card.animateDeath();
          this.killCard(card);
        }
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

  async dealDamage(
    player: "opponent" | "player",
    slot: number | "direct",
    amount: number
  ) {
    if (slot === "direct") {
      this.damageToDeal += amount;
    } else {
      const card = this.state.play[player][slot];
      if (card) {
        card.damage += amount;
        await card.animateDamage();
      }
    }
  }

  async fight(player: "player" | "opponent") {
    if (player === "player") {
      for (const [slot, card] of enumerate(this.state.play.player)) {
        if (card) {
          const sigilData = card.data.sigils
            .map((sigil) => sigils.get(sigil))
            .filter((sigil) => (sigil?.onAttack ? true : false)) as Sigil[];

          if (sigilData.length > 0) {
            for (const sigil of sigilData) {
              if (sigil.onAttack) {
                await sigil.onAttack(this, card, "opponent");
              }
            }
          } else {
            if (card.data.attack <= 0) {
              continue;
            }

            await card.animateAttack("opponent");

            const opposingCard = this.state.play.opponent[slot];

            if (opposingCard) {
              await this.dealDamage("opponent", slot, card.data.attack);

              if (opposingCard.data.health <= opposingCard.damage) {
                await opposingCard.animateDeath();
                this.killCard(opposingCard);
              }
            } else {
              await this.dealDamage("opponent", "direct", card.data.attack);
            }
          }
        }
      }

      for (const _ of range(this.damageToDeal)) {
        this.state.scale[1] += 1;
        await new Wait(400).promise;
      }
    } else {
      for (const [slot, card] of enumerate(this.state.play.opponent)) {
        if (card) {
          const sigilData = card.data.sigils
            .map((sigil) => sigils.get(sigil))
            .filter((sigil) => (sigil?.onAttack ? true : false)) as Sigil[];

          if (sigilData.length > 0) {
            for (const sigil of sigilData) {
              if (sigil.onAttack) {
                await sigil.onAttack(this, card, "player");
              }
            }
          } else {
            if (card.data.attack <= 0) {
              continue;
            }

            await card.animateAttack("player");

            const opposingCard = this.state.play.player[slot];

            if (opposingCard) {
              await this.dealDamage("player", slot, card.data.attack);

              if (opposingCard.data.health <= opposingCard.damage) {
                await opposingCard.animateDeath();
                this.killCard(opposingCard);
              }
            } else {
              await this.dealDamage("player", "direct", card.data.attack);
            }
          }
        }
      }

      for (const _ of range(this.damageToDeal)) {
        this.state.scale[0] += 1;
        await new Wait(400).promise;
      }
    }

    this.damageToDeal = 0;
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
      }
      this.actions.push({
        type: "place_card",
        id: card.id,
        position: slot,
        sacrifices: sacrifices.slice(),
        card: card.data,
      });
    } else if (card.data.cost_type === "bones") {
      if (this.state.bones < card.data.cost) {
        alert("Not enough bones.");
        return;
      }

      this.state.bones -= card.data.cost;

      this.actions.push({
        type: "place_card",
        id: card.id,
        position: slot,
        sacrifices: sacrifices.slice(),
        card: card.data,
      });
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
          500
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
      card.moveTo(new Vector2(gap + gap * i + cardWidth * i, HAND_CARD_Y), 500);
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
    const slot = this.getSlot(card);
    if (slot) {
      if (slot[0] === "player") {
        this.state.graveyard.push(card);
        this.state.bones += 1;
      }

      this.removeCard(card);
    }
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
