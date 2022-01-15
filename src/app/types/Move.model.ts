export interface PlaceCardMove {
  type: "place_card";
  id: number;
  position: number;
  sacrifices: number[];
}

type Move = PlaceCardMove;

export default Move;
