export interface Rng {
  next(): number;
  nextInt(min: number, max: number): number;
  state(): number;
}

export function createRng(seed: number): Rng {
  let s = seed;
  return {
    next() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    },
    nextInt(min: number, max: number) {
      return Math.min(max, min + Math.floor(this.next() * (max - min + 1)));
    },
    state() {
      return s;
    },
  };
}
