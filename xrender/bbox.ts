import BoundingRect from './BoundingRect'
import * as curve from './util/curve'

/**
 * 从圆弧绘制中求取包围盒
 * 写入min max中
 */
export function fromArc (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  anticlockwise: boolean | number,
  min: any[],
  max: any[]
) {
  // 思路是将圆弧分为好几段子圆弧，分别求包围盒
  // 首先如果这是一个圆，那么就不用进行后续计算，但是需要考虑的是，接近一个圆也可以认为是一个圆
  let delta = Math.abs(endAngle - startAngle)
  let PI2 = Math.PI * 2
  if (delta >= PI2 ||  Math.abs(delta - PI2) < 1e-3) {
    min[0] = cx - r
    min[1] = cy - r
    max[0] = cx + r
    max[1] = cy + r

    return
  }
  // 求出起点和终点的坐标
  let start = [Math.cos(startAngle) * r + cx, Math.sin(startAngle) * r + cy]
  let end = [Math.cos(endAngle) * r + cx, Math.sin(endAngle) * r + cy]
  // 得出初始包围盒
  fromLine(start, end, min, max)
  let rect = new BoundingRect(min[0], min[1], max[0] - min[0], max[1] - min[1])
  // 让起始角度和结束角度都大于0
  startAngle = startAngle % PI2
  if (startAngle < 0) {
    startAngle += PI2
  }
  endAngle = endAngle % PI2
  if (endAngle < 0) [
    endAngle += PI2
  ]
  // 如果是逆时针，将二者对调
  if (anticlockwise) {
    let temp = endAngle
    endAngle = startAngle
    startAngle = temp
  }
  // 求出起始点和终点之间所有最值，从0开始每次循环加90度
  let point = []
  for (let angle = 0; angle < endAngle; angle += (Math.PI / 2)) {
    if (angle > startAngle) {
      point[0] = Math.cos(angle) * r + cx
      point[1] = Math.sin(angle) * r + cy

      fromLine(min, point, min, [])
      fromLine(max, point, [], max)

      rect.union({
        x: min[0],
        y: min[1],
        width: max[0] - min[0],
        height: max[1] - min[1]
      })
    }
  }

  // 重新写入
  min[0] = rect.x
  min[1] = rect.y
  max[0] = rect.x + rect.width
  max[1] = rect.y + rect.height
}
/**
 * 从两点之间求出包围盒，并写入min max中
 */
export function fromLine (point1: number[], point2: number[], min: any[], max: any[]) {
  min[0] = Math.min(point1[0], point2[0])
  min[1] = Math.min(point1[1], point2[1])
  max[0] = Math.max(point1[0], point2[0])
  max[1] = Math.max(point1[1], point2[1])
}
let xDim = []
let yDim = []
/**
 * 从三阶贝塞尔曲线(p0, p1, p2, p3)中计算出最小包围盒，写入`min`和`max`中
 */
export function fromCubic(
    x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, min: any[], max: any[]
) {
    let cubicExtrema = curve.cubicExtrema
    let cubicAt = curve.cubicAt
    let i
    let n = cubicExtrema(x0, x1, x2, x3, xDim)
    min[0] = Infinity
    min[1] = Infinity
    max[0] = -Infinity
    max[1] = -Infinity

    for (i = 0; i < n; i++) {
        let x = cubicAt(x0, x1, x2, x3, xDim[i])
        min[0] = Math.min(x, min[0])
        max[0] = Math.max(x, max[0])
    }
    n = cubicExtrema(y0, y1, y2, y3, yDim)
    for (i = 0; i < n; i++) {
        let y = cubicAt(y0, y1, y2, y3, yDim[i])
        min[1] = Math.min(y, min[1])
        max[1] = Math.max(y, max[1])
    }

    min[0] = Math.min(x0, min[0])
    max[0] = Math.max(x0, max[0])
    min[0] = Math.min(x3, min[0])
    max[0] = Math.max(x3, max[0])

    min[1] = Math.min(y0, min[1])
    max[1] = Math.max(y0, max[1])
    min[1] = Math.min(y3, min[1])
    max[1] = Math.max(y3, max[1])
}

/**
 * 从二阶贝塞尔曲线(p0, p1, p2)中计算出最小包围盒，写入`min`和`max`中
 */
export function fromQuadratic(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, min: any[], max: any[]) {
    let quadraticExtremum = curve.quadraticExtremum
    let quadraticAt = curve.quadraticAt
    let tx =
        Math.max(
            Math.min(quadraticExtremum(x0, x1, x2), 1), 0
        )
    let ty =
        Math.max(
            Math.min(quadraticExtremum(y0, y1, y2), 1), 0
        )

    let x = quadraticAt(x0, x1, x2, tx)
    let y = quadraticAt(y0, y1, y2, ty)

    min[0] = Math.min(x0, x2, x)
    min[1] = Math.min(y0, y2, y)
    max[0] = Math.max(x0, x2, x)
    max[1] = Math.max(y0, y2, y)
}