export type EasingFn = (t: number, b: number, c: number, d: number) => number

export type EasingFnType =
  'linear' |
  'bounce-in' |
  'bounce-out' |
  'bounce-in-out'

const Easing = {
  linear (t: number, b: number, c: number, d: number) {
    return c * (t / d) + b
  },
  'bounce-in' (t: number, b: number, c: number, d: number) {
    return c - Easing['bounce-out'](d - t, 0, c, d) + b
  },
  'bounce-out' (t: number, b: number, c: number, d: number) {
    if ((t /= d) < (1 / 2.75)) {
      return c * (7.5625 * t * t) + b
    } else if (t < (2 / 2.75)) {
      return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b
    } else if (t < (2.5 / 2.75)) {
      return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b
    } else {
      return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b
    }
  },
  'bounce-in-out' (t: number, b: number, c: number, d: number) {
    if (t < d / 2) {
      return Easing['bounce-in'](t * 2, 0, c, d) * 0.5 + b
    } else {
      return Easing['bounce-out'](t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b
    }
  }
}

export default Easing
