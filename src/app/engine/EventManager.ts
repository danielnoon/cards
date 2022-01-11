export class EventManager {
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  dispatch<T>(event: string, data: T) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((listener) => listener(data));
    }
  }

  listen<T>(event: string, callback: (arg: T) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set<(...args: any[]) => void>());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)!.delete(callback);
    };
  }
}
