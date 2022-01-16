import { GameManager } from "../engine/GameManager";
import { State } from "../engine/State";
import { CardState } from "../gobjects/Card.go";

export interface Sigil {
  id: string;
  name: string;
  image: HTMLImageElement;

  onAttack?: (
    manager: GameManager,
    card: CardState,
    target: "player" | "opponent"
  ) => number | Promise<number>;
  onDraw?: (manager: State) => void | Promise<void>;
  onTurnEnd?: (manager: State) => void | Promise<void>;
  onTurnStart?: (manager: State) => void | Promise<void>;
  onPlay?: (manager: State) => void | Promise<void>;
}
