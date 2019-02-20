/**
 * 细分二次贝塞尔曲线，对于横纵坐标分别传入计算
 * @param p0 起点坐标
 * @param p1 控制点坐标
 * @param p2 终点坐标
 * @param t 进度
 * @param out 保存结果的数组
 */
export function quadraticSubdivide(p0: number, p1: number, p2: number, t: number, out: any[] = []) {
  let q0 = (p1 - p0) * t + p0
  let q1 = (p2 - p1) * t + p1
  let b = (q1 - q0) * t + q0

  // Seg0
  out[0] = p0
  out[1] = q0
  out[2] = b

  // Seg1
  out[3] = b
  out[4] = q1
  out[5] = p2
}
/**
 * 细分三次贝塞尔曲线，参数同上
 */
export function cubicSubdivide(p0: number, p1: number, p2: number, p3: number, t: number, out: any[]) {
  let q0 = (p1 - p0) * t + p0
  let q1 = (p2 - p1) * t + p1
  let q2 = (p3 - p2) * t + p2

  let r0 = (q1 - q0) * t + q0
  let r1 = (q2 - q1) * t + q1

  let b = (r1 - r0) * t + r0
  // Seg0
  out[0] = p0
  out[1] = q0
  out[2] = r0
  out[3] = b
  // Seg1
  out[4] = b
  out[5] = r1
  out[6] = q2
  out[7] = p3
}
let EPSILON = 1e-8

function isAroundZero(val) {
  return val > -EPSILON && val < EPSILON
}
function isNotAroundZero(val) {
  return val > EPSILON || val < -EPSILON
}
/**
 * 计算三次贝塞尔方程极限值的位置
 */
export function cubicExtrema(p0: number, p1: number, p2: number, p3: number, extrema: any[]) {
  let b = 6 * p2 - 12 * p1 + 6 * p0
  let a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2
  let c = 3 * p1 - 3 * p0

  let n = 0
  // 这里遵循zrender的设计，考虑到计算精度和近似值的原因
  if (isAroundZero(a)) {
    if (isNotAroundZero(b)) {
      let t1 = -c / b
      if (t1 >= 0 && t1 <= 1) {
        extrema[n++] = t1
      }
    }
  }
  else {
    let disc = b * b - 4 * a * c
    if (isAroundZero(disc)) {
      extrema[0] = -b / (2 * a)
    }
    else if (disc > 0) {
      let discSqrt = Math.sqrt(disc)
      let t1 = (-b + discSqrt) / (2 * a)
      let t2 = (-b - discSqrt) / (2 * a)
      if (t1 >= 0 && t1 <= 1) {
        extrema[n++] = t1
      }
      if (t2 >= 0 && t2 <= 1) {
        extrema[n++] = t2
      }
    }
  }
  return n
}
/**
 * 计算二次贝塞尔方程极限值
 * @memberOf module:zrender/core/curve
 * @param  {number} p0
 * @param  {number} p1
 * @param  {number} p2
 * @return {number}
 */
export function quadraticExtremum(p0: number, p1: number, p2: number) {
  let divider = p0 + p2 - 2 * p1
  if (divider === 0) {
    return 0.5
  }
  else {
    return (p0 - p1) / divider
  }
}
/**
 * 计算二次方贝塞尔值
 */
export function quadraticAt(p0: number, p1: number, p2: number, t: number) {
  let onet = 1 - t
  return onet * (onet * p0 + 2 * t * p1) + t * t * p2
}
/**
 * 计算三次贝塞尔值
 */
export function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number) {
  let onet = 1 - t
  return onet * onet * (onet * p0 + 3 * t * p1)
    + t * t * (t * p3 + 3 * onet * p2)
}
/**
 * 计算二次贝塞尔导数值
 */
export function quadraticDerivativeAt(p0: number, p1: number, p2: number, t: number) {
  return 2 * ((1 - t) * (p1 - p0) + t * (p2 - p1))
}
/**
 * 计算二次贝塞尔曲线在某一点的切线的斜率
 */
export function quadraticTangentSlope (
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, t: number
) {
  let q0x = x0 + (x1 - x0) * t
  let q0y = y0 + (y1 - y0) * t
  let q1x = x1 + (x2 - x1) * t
  let q1y = y1 + (y2 - y1) * t

  return (q0y - q1y) / (q0x - q1x)
}
/**
 * 计算二次方贝塞尔方程根
 */
export function quadraticRootAt(p0: number, p1: number, p2: number, val: number, roots: any[], lineWidth?: number) {
  // 如果在有线宽的情况下，不考虑线宽就会出现没有解的情况
  // 这里暂时是指求解x时
  if (lineWidth) {
    if (val < p0 && (p0 - val) <= lineWidth / 2) {
      val = p0
    } else if (val > p2 && (val - p2) <= lineWidth / 2) {
      val = p2
    }
  }
  let a = p0 - 2 * p1 + p2
  let b = 2 * (p1 - p0)
  let c = p0 - val

  let n = 0
  if (isAroundZero(a)) {
    if (isNotAroundZero(b)) {
      let t1 = -c / b
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
    }
  }
  else {
    let disc = b * b - 4 * a * c
    if (isAroundZero(disc)) {
      let t1 = -b / (2 * a)
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1;
      }
    }
    else if (disc > 0) {
      let discSqrt = Math.sqrt(disc);
      let t1 = (-b + discSqrt) / (2 * a)
      let t2 = (-b - discSqrt) / (2 * a)
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
      if (t2 >= 0 && t2 <= 1) {
        roots[n++] = t2
      }
    }
  }
  return n
}

/**
 * 计算三次贝塞尔曲线在某一点的切线的斜率
 */
export function cubicTangentSlope (
  x0: number, y0: number, x1: number, y1: number,
  x2: number, y2: number, x3: number, y3: number, t: number
) {
  let q0x = x0 + (x1 - x0) * t
  let q0y = y0 + (y1 - y0) * t
  let q1x = x1 + (x2 - x1) * t
  let q1y = y1 + (y2 - y1) * t
  let q2x = x2 + (x3 - x2) * t
  let q2y = y2 + (y3 - y2) * t

  let r0x = q0x + (q1x - q0x) * t
  let r0y = q0y + (q1y - q0y) * t
  let r1x = q1x + (q2x - q1x) * t
  let r1y = q1y + (q2y - q1y) * t

  return (r0y - r1y) / (r0x - r1x)
}
/**
 * 用于开方
 */
function mathPow (x: number, y: number) {
  if (x < 0) {
    return -Math.pow(-x, y)
  }

  return Math.pow(x, y)
}
/**
 * 计算三次贝塞尔方程根，使用盛金公式
 */
export function cubicRootAt(
  p0: number, p1: number, p2: number, p3: number, val: number,
  roots: any[], lineWidth?: number
) {
  // 如果在有线宽的情况下，不考虑线宽就会出现没有解的情况
  // 这里暂时是指求解x时
  if (lineWidth) {
    if (val < p0 && (p0 - val) <= lineWidth / 2) {
      val = p0
    } else if (val > p3 && (val - p3) <= lineWidth / 2) {
      val = p3
    }
  }
  // 系数
  let a = p3 + 3 * (p1 - p2) - p0
  let b = 3 * (p2 - p1 * 2 + p0)
  let c = 3 * (p1 - p0)
  let d = p0 - val
  // 重根判别式
  let A = b * b - 3 * a *c
  let B = b * c - 9 * a * d
  let C = c * c - 3 * b * d

  let n = 0
  let t1
  let t2
  let t3
  //  A=B=0时，三根相同
  if (isAroundZero(A) && isAroundZero(B)) {
    if (isAroundZero(b)) {
      roots[0] = 0
      n += 1
    } else {
      // 盛金公式1
      t1 = -c / b
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
    }
  } else {
    // 总判别式
    let delta = B * B - 4 * A * C
    if (isAroundZero(delta)) {
      // 盛金公式3
      let K = B / A
      t1 = -b / a + K
      t2 = -K / 2
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
      if (t2 >= 0 && t2 <= 1) {
        roots[n++] = t2
      }
    } else if (delta > 0) {
      // 盛金公式2
      let deltaSqrt = Math.sqrt(delta)
      let Y1 = A * b + 1.5 * a * (-B + deltaSqrt)
      let Y2 = A * b + 1.5 * a * (-B - deltaSqrt)
      Y1 = mathPow(Y1, 1 / 3)
      Y2 = mathPow(Y2, 1 / 3)
      t1 = (-b - (Y1 + Y2)) / (3 * a)
      // 复数根不包括在内
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1
      }
    } else {
      // 盛金公式4
      let T = (2 * A * b - 3 * a * B) / (2 * A * Math.sqrt(A))
      let theta = Math.acos(T) / 3 // theta / 3
      let ASqrt = Math.sqrt(A)
      let temp = Math.cos(theta)
      let THREE_SQRT = Math.sqrt(3)
      t1 = (-b - 2 * ASqrt * temp) / (3 * a)
      t2 = (-b + ASqrt * (temp + THREE_SQRT * Math.sin(theta))) / (3 * a)
      t3 = (-b + ASqrt * (temp - THREE_SQRT * Math.sin(theta))) / (3 * a)
      if (t1 >= 0 && t1 <= 1) {
        roots[n++] = t1;
      }
      if (t2 >= 0 && t2 <= 1) {
        roots[n++] = t2;
      }
      if (t3 >= 0 && t3 <= 1) {
        roots[n++] = t3;
      }
    }
  }

  return n
}
