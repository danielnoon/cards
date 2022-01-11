import { CardState } from "../gobjects/Card.go";
import ICard from "../types/Card.model";

type Scale = [player: number, opponent: number];
type PlayRow = [
  CardState | null,
  CardState | null,
  CardState | null,
  CardState | null
];
type Play = { player: PlayRow; opponent: PlayRow };

export class State {
  turn: "player" | "opponent" | "none" = "none";
  hand: CardState[] = [];
  play = {
    player: [null, null, null, null],
    opponent: [null, null, null, null],
  } as Play;
  deck: ICard[] = [];
  graveyard: CardState[] = [];
  scale: Scale = [0, 0];
  phase: "draw" | "play" | "end" = "draw";
  bones = 0;
  gems = {
    emerald: 0,
    ruby: 0,
    sapphire: 0,
  };
  turnCount = 0;
}
