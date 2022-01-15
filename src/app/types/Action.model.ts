import ICard from "./Card.model";

export interface PlaceCardAction {
  type: "place_card";
  id: number;
  position: number;
  sacrifices: number[];
  card: ICard;
}

type Action = PlaceCardAction;

export default Action;
