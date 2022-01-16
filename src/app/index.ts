import { Main } from "./Main.scene";
import { startGame } from "gamedeck/lib/Game";

// Get the canvas we want to use.
const canvas = document.querySelector<HTMLCanvasElement>("canvas#game")!;

// Set the canvas width and height to be the full size of the window.
// Remove this if you want it to be smaller.
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Start the game!
const game = startGame(new Main(), {
  canvas,
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  game.width = window.innerWidth;
  game.height = window.innerHeight;
});
