import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";
import { zip } from "itertools";
import { SIDEBAR_WIDTH } from "../constants";
import { add, get } from "../image-registry";
import { number } from "../text";
import { clamp } from "../util";

add("/assets/bone-count.png");
add("/assets/balance-counter.png");
add("/assets/balance-bar.png");
add("/assets/balance-marker.png");

interface Props {
  bones: number;
  blood: number;
  scale: [number, number];
  gems: { emerald: number; ruby: number; sapphire: number };
  energy: number;
}

export class Status extends GObject {
  constructor(private props: Props) {
    super({ position: new Vector2(0, 0) });
  }

  render(ctx: CanvasRenderingContext2D) {
    const { dimensions } = this;
    const { scale, gems, bones, blood } = this.props;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(get("/assets/bone-count.png"), 5, 10);
    number(bones).draw(ctx, 19, 16, "green");

    const score = clamp(scale[1] - scale[0], -5, 5);

    const balanceMarker = get("/assets/balance-marker.png");

    ctx.drawImage(
      balanceMarker,
      SIDEBAR_WIDTH / 2 - balanceMarker.width / 2 + score * 9,
      BALANCE_MARKER_Y
    );

    const balanceCounter = get("/assets/balance-counter.png");

    ctx.drawImage(
      balanceCounter,
      SIDEBAR_WIDTH / 2 - balanceCounter.width / 2,
      BALANCE_COUNTER_Y
    );

    const balanceData = getBalanceData(score);

    ctx.drawImage(
      get("/assets/balance-bar.png"),
      balanceData.x,
      balanceData.y,
      balanceData.width,
      balanceData.height,
      SIDEBAR_WIDTH / 2 - balanceData.width / 2,
      BALANCE_BOX_Y + BALANCE_BOX_HEIGHT / 2 - balanceData.height / 2,
      balanceData.width,
      balanceData.height
    );

    ctx.restore();
  }
}

const BALANCE_COUNTER_Y = 110;
const BALANCE_MARKER_Y = 102;

const BALANCE_BOX_Y = 130;
const BALANCE_BOX_HEIGHT = 30;

const BALANCE_Y = [0, 7, 16, 29, 46, 64];
const BALANCE_HEIGHTS = [6, 8, 12, 16, 17, 19];
const BALANCE_DATA = [...zip(BALANCE_Y, BALANCE_HEIGHTS)];

function getBalanceData(score: number) {
  const [y, height] = BALANCE_DATA[Math.abs(score)];

  return {
    x: Math.sign(score) === -1 ? 45 : 0,
    y,
    width: 45,
    height,
  };
}
