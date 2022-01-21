import { get } from "./image-registry";
import { Sigil } from "./types/Sigil.model";

const sigils = new Map<string, Sigil>();

const opponent: Record<"player" | "opponent", "player" | "opponent"> = {
  player: "opponent",
  opponent: "player",
};

export default sigils;

export const BifurcatedStrike: Sigil = {
  id: "bifurcated_strike",
  name: "Bifurcated Strike",
  image: get("assets/sigils/bifurcated-strike.png"),
  onAttack: async (manager, card, t) => {
    const state = manager.state;
    const slot = state.play[opponent[t]].indexOf(card);

    if (slot === -1) {
      throw new Error("Card not found in play");
    }

    if (slot === 1 || slot === 2) {
      const targets = [slot - 1, slot + 1];
      for (const target of targets) {
        const targetCard = state.play[t][target];

        await card.animateAttack(t);

        if (targetCard) {
          manager.dealDamage(t, target, card.data.attack);

          if (targetCard.data.health <= targetCard.damage) {
            await targetCard.animateDeath();
            manager.killCard(targetCard);
          }
        } else {
          manager.dealDamage(t, "direct", card.data.attack);
        }
      }

      return 2;
    } else if (slot === 0) {
      const target = slot + 1;
      const targetCard = state.play[t][target];

      if (targetCard) {
        manager.dealDamage(t, target, card.data.attack);

        if (targetCard.data.health <= targetCard.damage) {
          await targetCard.animateDeath();
          manager.killCard(targetCard);
        }
      } else {
        manager.dealDamage(t, "direct", card.data.attack);
      }

      return 1;
    } else {
      const target = slot - 1;
      const targetCard = state.play[t][target];
      if (targetCard) {
        targetCard.damage += 1;
        if (targetCard.data.health <= targetCard.damage) {
          await targetCard.animateDeath();
          manager.killCard(targetCard);
        }
      } else {
        state.scale[t === "opponent" ? 1 : 0] += card.data.attack;
      }
      return 1;
    }
  },
};

sigils.set(BifurcatedStrike.id, BifurcatedStrike);

export const TrifurcatedStrike: Sigil = {
  id: "trifurcated_strike",
  name: "Trifurcated Strike",
  image: get("assets/sigils/trifurcated-strike.png"),
  onAttack: async (manager, card, t) => {
    const state = manager.state;
    const slot = state.play[opponent[t]].indexOf(card);

    if (slot === -1) {
      throw new Error("Card not found in play");
    }

    if (slot === 1 || slot === 2) {
      const targets = [slot - 1, slot, slot + 1];

      for (const target of targets) {
        const targetCard = state.play[t][target];

        await card.animateAttack(t);

        if (targetCard) {
          manager.dealDamage(t, target, card.data.attack);

          if (targetCard.data.health <= targetCard.damage) {
            await targetCard.animateDeath();
            manager.killCard(targetCard);
          }
        } else {
          manager.dealDamage(t, "direct", card.data.attack);
        }
      }

      return 3;
    } else if (slot === 0) {
      const targets = [slot, slot + 1];

      for (const target of targets) {
        const targetCard = state.play[t][target];

        await card.animateAttack(t);

        if (targetCard) {
          manager.dealDamage(t, target, card.data.attack);

          if (targetCard.data.health <= targetCard.damage) {
            await targetCard.animateDeath();
            manager.killCard(targetCard);
          }
        } else {
          manager.dealDamage(t, "direct", card.data.attack);
        }
      }

      return 2;
    } else {
      const targets = [slot - 1, slot];

      for (const target of targets) {
        const targetCard = state.play[t][target];

        await card.animateAttack(t);

        if (targetCard) {
          manager.dealDamage(t, target, card.data.attack);

          if (targetCard.data.health <= targetCard.damage) {
            await targetCard.animateDeath();
            manager.killCard(targetCard);
          }
        } else {
          manager.dealDamage(t, "direct", card.data.attack);
        }
      }

      return 3;
    }
  },
};

sigils.set(TrifurcatedStrike.id, TrifurcatedStrike);

export const Airborne: Sigil = {
  id: "airborne",
  name: "Airborne",
  image: get("assets/sigils/airborne.png"),
  onAttack: async (manager, card, t) => {
    const state = manager.state;

    await card.animateAttack(t);

    state.scale[t === "opponent" ? 1 : 0] += card.data.attack;

    return 1;
  },
};

sigils.set(Airborne.id, Airborne);

export const ManyLives: Sigil = {
  id: "many_lives",
  name: "Many Lives",
  image: get("assets/sigils/many-lives.png"),
};

sigils.set(ManyLives.id, ManyLives);
