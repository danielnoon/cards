import Action from "../types/Action.model";
import ICard from "../types/Card.model";
import { EventManager } from "./EventManager";

const WS_ENDPOINT_PROD = "wss://cards-scrypt-server.herokuapp.com";
const WS_ENDPOINT_DEV = "ws://localhost:3000";
const PING_INTERVAL = 5000;

interface StartEventData {
  hand: {
    id: number;
    data: ICard;
  }[];
}

interface ErrorEventData {
  message: string;
}

interface InitialTurnData {
  actions?: Action[];
}

interface BeginTurnData {
  actions: Action[];
  phase: "play" | "draw";
}

interface DrawCardData {
  hand: {
    id: number;
    data: ICard;
  }[];
}

type CB<T> = (data: T) => void | Promise<void>;

type Unsub = () => void;

export class SyncManager {
  public connecting = true;
  public waiting = false;
  public error = "";

  private events = new EventManager();
  private socket: WebSocket;
  private ping: ReturnType<typeof setInterval>;

  private get endpoint() {
    if (window.location.hostname === "localhost") {
      const ep = localStorage.getItem("ws_endpoint");
      if (ep) {
        return ep;
      }
      return WS_ENDPOINT_DEV;
    } else {
      return WS_ENDPOINT_PROD;
    }
  }

  constructor() {
    this.socket = new WebSocket(this.endpoint);
    this.socket.onopen = () => {
      console.log("Connected to websocket server");
      this.connecting = false;
      this.waiting = true;
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.events.dispatch(data.type, data);

      if (data.type === "start") {
        this.waiting = false;
      }
    };

    this.ping = setInterval(() => {
      this.send("ping");
    }, PING_INTERVAL);

    // todo: show error messages in UI
    this.socket.onerror = (event) => {
      console.log("Error:", event);
      this.error = "Error connecting to server";
      this.connecting = false;
      this.waiting = false;
    };
    this.socket.onclose = (event) => {
      console.log("Closed:", event);
      this.error = "Connection to server lost.";
      this.connecting = false;
      this.waiting = false;
    };
  }

  listen(event: "start", callback: CB<StartEventData>): Unsub;
  listen(event: "error", callback: CB<ErrorEventData>): Unsub;
  listen(event: "begin_initial_turn", callback: CB<InitialTurnData>): Unsub;
  listen(event: "begin_turn", callback: CB<BeginTurnData>): Unsub;
  listen(event: "draw_card", callback: CB<DrawCardData>): Unsub;
  listen(event: "commit_turn_success", callback: CB<void>): Unsub;
  listen<T>(event: string, callback: CB<T>) {
    return this.events.listen(event, callback);
  }

  send(type: string, data: any = {}) {
    this.socket.send(JSON.stringify({ type, ...data }));
  }

  cleanup() {
    clearInterval(this.ping);
    this.socket.close();
  }
}
