import { GObject } from "gamedeck/lib/GObject";
import { Vector2 } from "gamedeck/lib/Utils";
import { add, get } from "../image-registry";

add("/assets/bone-count.png");

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

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, dimensions.x, dimensions.y);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "10px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    // ctx.fillText("Bones: " + bones, 5, 15);
    ctx.drawImage(get("/assets/bone-count.png"), 5, 10);
    ctx.fillText(bones.toString(), 22, 18);
    // ctx.fillText("Blood: " + blood, 5, 30);
    // ctx.fillText(
    //   "Gems: Emerald (" +
    //     gems.emerald +
    //     "),\nRuby (" +
    //     gems.ruby +
    //     "),\n Sapphire(" +
    //     gems.sapphire,
    //   5,
    //   45
    // ) + ")";
    // ctx.fillText("Energy: " + this.props.energy, 5, 60);

    ctx.restore();
  }
}
