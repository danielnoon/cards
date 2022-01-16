export type CostType = "blood" | "energy" | "mana";

export default interface ICard {
  id: number;
  image: string;
  name: string;
  attack: number;
  health: number;
  cost_type: CostType;
  cost: number;
  sigils: string[];
}
