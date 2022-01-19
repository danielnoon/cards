import { add, get } from "./image-registry";

export const NUMBER_HEIGHT = 8;
export const NUMBER_WIDTH = 7;
export const TEXT_HEIGHT = 9;

add("/assets/font/numerals-green.png");
add("/assets/font/numerals-black.png");
add("/assets/font/font-black.png");
add("/assets/font/font-red.png");
add("/assets/font/font-green.png");

const UPPERCASE_WIDTHS = [
  6, // A
  7, // B
  6, // C
  7, // D
  6, // E
  5, // F
  7, // G
  6, // H
  4, // I
  6, // J
  6, // K
  6, // L
  6, // M
  6, // N
  6, // O
  7, // P
  6, // Q
  7, // R
  6, // S
  6, // T
  6, // U
  6, // V
  7, // W
  6, // X
  6, // Y
  6, // Z
];

const LOWERCASE_WIDTHS = [
  7, // a
  6, // b
  5, // c
  6, // d
  6, // e
  5, // f
  6, // g
  6, // h
  2, // i
  2, // j
  6, // k
  2, // l
  8, // m
  6, // n
  6, // o
  6, // p
  6, // q
  4, // r
  5, // s
  5, // t
  6, // u
  5, // v
  7, // w
  6, // x
  5, // y
  5, // z
];

const UPPERCASE_LOCATIONS = [
  0, // A
  7, // B
  15, // C
  22, // D
  30, // E
  37, // F
  43, // G
  51, // H
  58, // I
  63, // J
  70, // K
  77, // L
  84, // M
  91, // N
  98, // O
  105, // P
  113, // Q
  120, // R
  128, // S
  135, // T
  142, // U
  149, // V
  156, // W
  164, // X
  171, // Y
  178, // Z
];

const LOWERCASE_LOCATIONS = [
  0, // a
  8, // b
  15, // c
  21, // d
  28, // e
  35, // f
  41, // g
  48, // h
  55, // i
  58, // j
  61, // k
  68, // l
  71, // m
  80, // n
  87, // o
  94, // p
  101, // q
  108, // r
  113, // s
  119, // t
  125, // u
  132, // v
  138, // w
  146, // x
  153, // y
  159, // z
];

console.log(LOWERCASE_LOCATIONS);

function getWidth(char: string) {
  if (char === " ") {
    return 4;
  }

  const charCode = char.charCodeAt(0);

  if (/[A-Z]/.test(char)) {
    return UPPERCASE_WIDTHS[charCode - 65];
  } else if (/[a-z]/.test(char)) {
    return LOWERCASE_WIDTHS[charCode - 97];
  } else {
    return charCode - 48;
  }
}

function getLocation(char: string) {
  const charCode = char.charCodeAt(0);

  if (/[A-Z]/.test(char)) {
    return {
      x: UPPERCASE_LOCATIONS[charCode - 65],
      y: 0,
    };
  } else if (/[a-z]/.test(char)) {
    return {
      x: LOWERCASE_LOCATIONS[charCode - 97],
      y: 14,
    };
  } else {
    return {
      x: charCode - 48,
      y: 2,
    };
  }
}

export function text(text: string) {
  const width = text.split("").reduce((sum, char) => {
    return getWidth(char) + sum + 1;
  }, 0);

  return {
    width,
    height: TEXT_HEIGHT,
    draw: (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: "green" | "black" | "red"
    ) => {
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      const image = get(`/assets/font/font-${color}.png`);

      for (const char of text) {
        if (char === " ") {
          x += getWidth(char);
          continue;
        }

        const { x: charX, y: charY } = getLocation(char);

        ctx.drawImage(
          image,
          charX,
          charY,
          getWidth(char),
          TEXT_HEIGHT,
          x,
          y,
          getWidth(char),
          TEXT_HEIGHT
        );

        x += getWidth(char) + 1;
      }

      ctx.restore();
    },
  };
}

export function number(value: number) {
  const digits = value.toString().split("");

  return {
    width: NUMBER_WIDTH * digits.length,
    height: NUMBER_HEIGHT,
    draw: (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      variant: "green" | "black"
    ) => {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const image = get(`/assets/font/numerals-${variant}.png`);

      for (const digit of digits) {
        const index = Number(digit);
        ctx.drawImage(
          image,
          index * NUMBER_WIDTH,
          0,
          NUMBER_WIDTH,
          NUMBER_HEIGHT,
          x,
          y,
          NUMBER_WIDTH,
          NUMBER_HEIGHT
        );

        x += NUMBER_WIDTH;
      }

      ctx.restore();
    },
  };
}
