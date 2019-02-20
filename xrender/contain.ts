import { PathData, PathType } from './Path'
import {
  quadraticTangentSlope, quadraticAt, quadraticRootAt, quadraticExtremum,
  cubicAt, cubicTangentSlope, cubicRootAt, cubicExtrema
} from './util/curve'
/**
 * 线段描边包含
 */
function lineContainStroke (x0: number, y0: number, x1: number, y1: number, lineWidth: number, x: number, y: number) {
  /**
   * 斜率
   */
  let a = 0
  let b = x0
  let halfLineWidth = lineWidth / 2
  // 虽然使用时点在包围盒内，但是函数内却不能如此假设
  if (
    (y > y0 + lineWidth && y > y1 + lineWidth)
    || (y < y0 - lineWidth && y < y1 - lineWidth)
    || (x > x0 + lineWidth && x > x1 + lineWidth)
    || (x < x0 - lineWidth && x < x1 - lineWidth)
  ) {
    return false
  }
  // 如果不是平行于y轴
  if (x0 !== x1) {
    a = (y0 - y1) / (x0 - x1)
    b = y0 - a * x0
  } else {
    // 垂直方向上的线只需要考虑是否超出宽度边界
    return Math.abs(x - x0) <= halfLineWidth
  }
  // y轴在此线段所在直线的横截跨度的平方
  let tSquare = (a * a + 1) * (lineWidth * lineWidth)
  // 理想的坐标点和目标点的差值
  let temp = a * x - y + b

  return temp * temp <= tSquare / 4
}
const PI2 = Math.PI * 2
/**
 * 将弧度转换为0到2PI内
 */
function normalizeRadian(angle: number) {
  angle %= PI2
  if (angle < 0) {
    angle += PI2
  }

  return angle
}
/**
 * 圆弧描边包含
 */
function arcContainStroke (
  cx: number, cy: number, r: number, startAngle: number, endAngle: number, anticlockwise: boolean,
  lineWidth: number, x: number, y: number
) {
  x -= cx
  y -= cy
  // 到圆心的距离
  let d = Math.sqrt(x * x + y * y)
  let halfLineWidth = lineWidth / 2
  // 不在圆周上
  if ((d - r) > halfLineWidth || (d - r) < -halfLineWidth) {
    return false
  }
  // 近似一个圆时不再判断
  if (Math.abs(startAngle - endAngle) % PI2 < 1e-4) {
    return true
  }
  if (anticlockwise) {
    let temp = startAngle
    startAngle = normalizeRadian(endAngle)
    endAngle = normalizeRadian(temp)
  } else {
    startAngle = normalizeRadian(startAngle)
    endAngle = normalizeRadian(endAngle)
  }
  if (startAngle > endAngle) {
    endAngle += PI2
  }
  // 求出点所在半径的角度
  let angle = Math.atan2(y, x)
  if (angle < 0) {
    angle += PI2
  }
  // 需要注意角度超过一周的情况
  return (angle >= startAngle && angle <= endAngle) ||
         (angle + PI2 >= startAngle && angle + PI2 <= endAngle)
}

/**
 * 二次贝塞尔曲线描边包含
 */
function quadraticContainStroke (
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number,
  lineWidth: number, x: number, y: number
) {
  // 有一个大概的范围判断
  if (
    (y > y0 + lineWidth && y > y1 + lineWidth && y > y2 + lineWidth) ||
    (y < y0 - lineWidth && y < y1 - lineWidth && y < y2 - lineWidth) ||
    (x > x0 + lineWidth && x > x1 + lineWidth && x > x2 + lineWidth) ||
    (x < x0 - lineWidth && x < x1 - lineWidth && x < x2 - lineWidth)
  ) {
    return false
  }
  let roots = []
  // 求出当前t值
  let n = quadraticRootAt(x0, x1, x2, x, roots, lineWidth)
  // 对于x来说，只有一个解
  if (n !== 1) {
    return
  }
  let t = roots[0]
  // 和原始点的差值
  let d = quadraticAt(y0, y1, y2, t) - y
  // 斜率
  let k = quadraticTangentSlope(
    x0, y0, x1, y1, x2, y2, t
  )
  // 当前点所在垂直线截取的曲线的长度的平方
  let sSquare = (k * k + 1) * (lineWidth * lineWidth)

  return d * d <= sSquare / 4
}
/**
 * 三次贝塞尔曲线描边包含
 */
function cubicContainStroke (
  x0: number, y0: number, x1: number, y1: number,
  x2: number, y2: number, x3: number, y3: number,
  lineWidth: number, x: number, y: number
) {
  // 有一个大概的范围判断
  if (
    (y > y0 + lineWidth && y > y1 + lineWidth && y > y2 + lineWidth && y > y3 + lineWidth) ||
    (y < y0 - lineWidth && y < y1 - lineWidth && y < y2 - lineWidth && y < y3 - lineWidth) ||
    (x > x0 + lineWidth && x > x1 + lineWidth && x > x2 + lineWidth && x > x3 + lineWidth) ||
    (x < x0 - lineWidth && x < x1 - lineWidth && x < x2 - lineWidth && x < x3 - lineWidth)
  ) {
    return false
  }
  let roots = []
  // 求出当前t值
  let n = cubicRootAt(x0, x1, x2, x3, x, roots, lineWidth)
  // 对于x来说，只有一个解
  if (n !== 1) {
    return
  }
  let t = roots[0]
  // 和原始点的差值
  let d = cubicAt(y0, y1, y2, y3, t) - y
  // 斜率
  let k = cubicTangentSlope(
    x0, y0, x1, y1, x2, y2, x3, y3, t
  )
  // 当前点所在垂直线截取的曲线的长度的平方
  let sSquare = (k * k + 1) * (lineWidth * lineWidth)

  return d * d <= sSquare / 4
}
/**
 * 对有向线段非零规则检测
 */
function windingLine (x0: number, y0: number, x1: number, y1: number, x: number, y: number) {
  if ((y > y0 && y > y1) || (y < y0 && y < y1)) {
    return 0
  }
  // 忽略水平线段
  if (y1 === y0 && (y !== y0)) {
    return 0
  }
  let dir = y1 < y0 ? 1 : -1
  // 对于会路过路径交点的情况
  if (y === y0 || y === y1) {
    dir = dir / 2
  }
  // 和线段的交点
  let x_ = (x0 - x1) / (y0 - y1) * (y - y0) + x0

  return x_ === x ?
         Infinity :
         x_ > x ? dir : 0
}

let extrema = [-1, -1]

function swapExtrema () {
  let tmp = extrema[0]
  extrema[0] = extrema[1]
  extrema[1] = tmp
}
/**
 * 对三次贝塞尔曲线非零规则检测
 */
function windingCubic (
  x0: number, y0: number, x1: number, y1: number,
  x2: number, y2: number, x3: number, y3: number,
  x: number, y: number
) {
  // Quick reject
  if (
    (y > y0 && y > y1 && y > y2 && y > y3)
    || (y < y0 && y < y1 && y < y2 && y < y3)
  ) {
    return 0
  }
  let nRoots = cubicRootAt(y0, y1, y2, y3, y, roots)
  // 不经过
  if (nRoots === 0) {
    return 0
  }
  else {
    let w = 0
    let nExtrema = -1
    let y0_
    let y1_
    for (let i = 0; i < nRoots; i++) {
      let t = roots[i]
      // 路过端点
      let unit = (t === 0 || t === 1) ? 0.5 : 1

      let x_ = cubicAt(x0, x1, x2, x3, t)
      if (x_ < x) {
        continue
      }
      // 曲线上
      if (x_ === x) {
        return Infinity
      }
      if (nExtrema < 0) {
        nExtrema = cubicExtrema(y0, y1, y2, y3, extrema);
        if (extrema[1] < extrema[0] && nExtrema > 1) {
          swapExtrema()
        }
        y0_ = cubicAt(y0, y1, y2, y3, extrema[0]);
        if (nExtrema > 1) {
          y1_ = cubicAt(y0, y1, y2, y3, extrema[1])
        }
      }
      if (nExtrema === 2) {
        // 分成三段单调函数
        if (t < extrema[0]) {
          w += y0_ < y0 ? unit : -unit
        }
        else if (t < extrema[1]) {
          w += y1_ < y0_ ? unit : -unit
        }
        else {
          w += y3 < y1_ ? unit : -unit
        }
      }
      else {
        // 分成两段单调函数
        if (t < extrema[0]) {
          w += y0_ < y0 ? unit : -unit
        }
        else {
          w += y3 < y0_ ? unit : -unit
        }
      }
    }
    return w
  }
}
/**
 * 对二次贝塞尔曲线非零规则检测
 */
function windingQuadratic(
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x: number, y: number
) {
  if (
    (y > y0 && y > y1 && y > y2)
    || (y < y0 && y < y1 && y < y2)
  ) {
    return 0
  }
  let nRoots = quadraticRootAt(y0, y1, y2, y, roots)
  // 没有交点
  if (nRoots === 0) {
    return 0
  }
  else {
    let t = quadraticExtremum(y0, y1, y2)
    // 极值在范围内，两种单调性
    if (t >= 0 && t <= 1) {
      let w = 0
      let y_ = quadraticAt(y0, y1, y2, t)
      for (let i = 0; i < nRoots; i++) {
        // 端点
        let unit = (roots[i] === 0 || roots[i] === 1) ? 0.5 : 1

        let x_ = quadraticAt(x0, x1, x2, roots[i])
        if (x_ < x) {
          continue
        }
        // 曲线上
        if (x_ === x) {
          return Infinity
        }
        if (roots[i] < t) {
          w += y_ < y0 ? unit : -unit
        }
        else {
          w += y2 < y_ ? unit : -unit
        }
      }
      return w
    }
    // 极值在范围外，只有一种单调性
    else {
      // 端点
      let unit = (roots[0] === 0 || roots[0] === 1) ? 0.5 : 1

      let x_ = quadraticAt(x0, x1, x2, roots[0])
      // 曲线上
      if (x_ === x) {
        return Infinity
      }
      if (x_ < x) {
        return 0
      }
      return y2 < y0 ? unit : -unit
    }
  }
}
let roots = []
/**
 * 对弧非零规则检测
 */
function windingArc (
  cx: number, cy: number, r: number, startAngle: number, endAngle: number,
  anticlockwise: number, x: number, y: number
) {
  y -= cy
  if (y > r || y < -r) {
    return 0
  }
  let tmp = Math.sqrt(r * r - y * y)

  roots[0] = -tmp
  roots[1] = tmp

  let diff = Math.abs(startAngle - endAngle);
  if (diff < 1e-4) {
    return 0
  }
  if (diff % PI2 < 1e-4) {
    // 圆
    startAngle = 0
    endAngle = PI2
    let dir = anticlockwise ? 1 : -1
    if (tmp === r) {
      // 圆上
      return Infinity
    } else if (x > roots[0] + cx && x < roots[1] + cx) {
      return dir
    }
    else {
      return 0
    }
  }
  // 起始点和终点的纵坐标，判定水平线是否路过端点
  let startY = Math.sin(startAngle) * r + cy
  let endY = Math.sin(endAngle) * r + cy
  if (anticlockwise) {
    let tmp = startAngle
    startAngle = normalizeRadian(endAngle)
    endAngle = normalizeRadian(tmp)
  }
  else {
    startAngle = normalizeRadian(startAngle)
    endAngle = normalizeRadian(endAngle)
  }
  if (startAngle > endAngle) {
    endAngle += PI2
  }

  let w = 0
  for (let i = 0; i < 2; i++) {
    let x_ = roots[i]
    if (x_ + cx > x) {
      let angle = Math.atan2(y, x_)
      let dir = anticlockwise ? 1 : -1
      if (angle < 0) {
        angle = PI2 + angle
      }
      if (
        (angle >= startAngle && angle <= endAngle)
        || (angle + PI2 >= startAngle && angle + PI2 <= endAngle)
      ) {
        // 弧上
        if (tmp === r) {
          return Infinity
        }
        // 端点处
        if ((y + cy) === startY || (y + cy) === endY) {
          dir /= 2
        }
        // 左半边方向反转
        if (angle > Math.PI / 2 && angle < Math.PI * 1.5) {
          dir = -dir
        }
        w += dir
      }
    }
  }
  return w;
}
/**
 * 路径包含检测
 * @param pathData 绘制的路径数据
 * @param lineWidth 线宽
 * @param isStroke 是否描边检测
 * @param x 待检测点横坐标
 * @param y 待监测点纵坐标
 */
function pathContain (data: PathData[], lineWidth: number, isStroke: boolean, x: number, y: number) {
  // 当前元素路径起始点，用于closePath，第一个命令和moveTo会改变它
  let start = [0, 0]
  // 上一个命令的终点
  let prePathFinal = [0, 0]
  // 当前命令的起点，用来和prePathFinal一起计算包围盒
  let pathStartPoint = [0, 0]
  let params: any[]
  let pathData: PathData
  // 非零规则的值
  let nozero = 0
  function windingPreToStart() {
    if (!isStroke) {
      nozero += windingLine(
        prePathFinal[0],
        prePathFinal[1],
        pathStartPoint[0],
        pathStartPoint[1],
        x,
        y
      )
    }
  }
  // 遍历绘制过程，分别求取包围盒
  for (let i = 0; i < data.length; i += 1) {
    pathData = data[i]
    params = pathData.params
    if (
      (i === 0)
      || ((pathData.type !== PathType.bezierCurveTo)
        && (pathData.type !== PathType.quadraticCurveTo))
    ) {
      pathStartPoint[0] = params[0]
      pathStartPoint[1] = params[1]
    }
    // 对于第一个命令不是moveto的情况更新绘制起点和最开始的起点
    // 对于arc会在后续处理
    if (i === 0) {
      start[0] = pathStartPoint[0]
      start[1] = pathStartPoint[1]
      prePathFinal[0] = pathStartPoint[0] // x
      prePathFinal[1] = pathStartPoint[1]
    }
    // 对于非moveto的造成的移动，圆弧在后面处理
    if (
      isStroke
      && (pathData.type !== PathType.arc)
      && (pathData.type !== PathType.moveTo)
      && (pathData.type !== PathType.closePath)
    ) {
      if (lineContainStroke(prePathFinal[0], prePathFinal[1], pathStartPoint[0], pathStartPoint[1], lineWidth, x, y)) {
        return true
      }
    }
    // 根据绘制方法的不同用不同的计算方式
    switch (pathData.type) {
      case PathType.arc:
        if (isStroke) {
          if (arcContainStroke(
            params[0],
            params[1],
            params[2],
            params[3],
            params[4],
            params[5],
            lineWidth,
            x,
            y
          )) {
            return true
          }
        } else {
          nozero += windingArc(
            params[0],
            params[1],
            params[2],
            params[3],
            params[4],
            params[5],
            x,
            y
          )
        }
        pathStartPoint[0] = Math.cos(params[3]) * params[2] + params[0]
        pathStartPoint[1] = Math.sin(params[3]) * params[2] + params[1]
        if (
          isStroke
        ) {
          if (lineContainStroke(prePathFinal[0], prePathFinal[1], pathStartPoint[0], pathStartPoint[1], lineWidth, x, y)) {
            return true
          }
        }
        windingPreToStart()
        prePathFinal[0] = Math.cos(params[4]) * params[2] + params[0]
        prePathFinal[1] = Math.sin(params[4]) * params[2] + params[1]
        if (i === 0) {
          start[0] = pathStartPoint[0]
          start[1] = pathStartPoint[1]
        }
        break
      case PathType.arcTo:
        if (isStroke) {

        } else {

        }
        break
      case PathType.bezierCurveTo:
        if (isStroke) {
          if (cubicContainStroke(
            prePathFinal[0],
            prePathFinal[1],
            params[0],
            params[1],
            params[2],
            params[3],
            params[4],
            params[5],
            lineWidth,
            x,
            y
          )) {
            return true
          }
        } else {
          nozero += windingCubic(
            prePathFinal[0],
            prePathFinal[1],
            params[0],
            params[1],
            params[2],
            params[3],
            params[4],
            params[5],
            x,
            y
          )
        }
        windingPreToStart()
        prePathFinal[0] = params[4]
        prePathFinal[1] = params[5]
        break
      case PathType.lineTo:
        if (isStroke) {
          if (lineContainStroke(
            prePathFinal[0],
            prePathFinal[1],
            params[0],
            params[1],
            lineWidth,
            x,
            y
          )) {
            return true
          }
        } else {
          nozero += windingLine(
            prePathFinal[0],
            prePathFinal[1],
            params[0],
            params[1],
            x,
            y
          )
        }
        prePathFinal[0] = params[0]
        prePathFinal[1] = params[1]
        break
      case PathType.moveTo:
        start[0] = params[0] // x
        start[1] = params[1] // y
        prePathFinal[0] = params[0] // x
        prePathFinal[1] = params[1] // y
        break
      case PathType.quadraticCurveTo:
        if (isStroke) {
          if (quadraticContainStroke(
            prePathFinal[0],
            prePathFinal[1],
            params[0],
            params[1],
            params[2],
            params[3],
            lineWidth,
            x,
            y
          )) {
            return true
          }
        } else {
          nozero += windingQuadratic(
            prePathFinal[0],
            prePathFinal[1],
            params[0],
            params[1],
            params[2],
            params[3],
            x,
            y
          )
        }
        windingPreToStart()
        prePathFinal[0] = params[2]
        prePathFinal[1] = params[3]
        break
      case PathType.rect:
        let x0 = params[0]
        let y0 = params[1]
        let x1 = x0 + params[2]
        let y1 = y0 + params[3]
        if (isStroke) {
          if (
            lineContainStroke(x0, y0, x1, y0, lineWidth, x, y) ||
            lineContainStroke(x0, y0, x0, y1, lineWidth, x, y) ||
            lineContainStroke(x0, y1, x1, y1, lineWidth, x, y) ||
            lineContainStroke(x1, y0, x1, y1, lineWidth, x, y)
          ) {
            return true
          }
        } else {
          // 对于矩形，检测左右两点线段即可
          nozero += windingLine(x1, y0, x1, y1, x, y)
          nozero += windingLine(x0, y1, x0, y0, x, y)
        }
        windingPreToStart()
        prePathFinal[0] = params[0]
        prePathFinal[1] = params[1]
        break
      case PathType.drawImage:
        let x_0 = params[0]
        let y_0 = params[1]
        let x_1 = x0 + params[2]
        let y_1 = y0 + params[3]
        // 同rect，但是没有描边
        nozero += windingLine(x_1, y_0, x_1, y_1, x, y)
        nozero += windingLine(x_0, y_1, x_0, y_0, x, y)
        break
      case PathType.closePath:
        if (isStroke) {
          if (lineContainStroke(prePathFinal[0], prePathFinal[1], start[0], start[1], lineWidth, x, y)) {
            return true
          }
        } else {
          nozero += windingLine(prePathFinal[0], prePathFinal[1], start[0], start[1], x, y)
        }
        prePathFinal[0] = start[0]
        prePathFinal[1] = start[1]
      default:
        break
    }
  }
  // 填充判定需要认为已经闭合路径了
  if (!isStroke) {
    nozero += windingLine(
      prePathFinal[0],
      prePathFinal[1],
      start[0],
      start[1],
      x,
      y
    )
  }

  return nozero !== 0
}
/**
 * 描边检测
 * @param pathData 绘制的路径数据
 * @param lineWidth 线宽
 * @param x 待检测点横坐标
 * @param y 待监测点纵坐标
 */
export function containStroke (pathDatas: PathData[], lineWidth: number, x: number, y: number) {
  return pathContain(pathDatas, lineWidth, true, x, y)
}
/**
 * 填充检测
 * @param pathData 绘制的路径数据
 * @param x 待检测点横坐标
 * @param y 待监测点纵坐标
 */
export function contain (pathDatas: PathData[], x: number, y: number) {
  return pathContain(pathDatas, 0, false, x, y)
}