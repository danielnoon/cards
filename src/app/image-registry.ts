const REGISTRY = new Map<string, HTMLImageElement>();

export function add(path: string) {
  if (!REGISTRY.has(path)) {
    const img = new Image();
    img.src = path;
    REGISTRY.set(path, img);
  }
}

export function get(path: string): HTMLImageElement {
  if (!REGISTRY.has(path)) {
    add(path);
  }

  return REGISTRY.get(path)!;
}

export function has(path: string): boolean {
  return REGISTRY.has(path);
}
