import { Transform } from '../xElements/XElement'
import BoundingRect from '../BoundingRect'
/**
 * 对包围盒应用变换
 * 思路是对每一个点应用变换，然后重新求包围盒
 */
export function rectTransform (rect: BoundingRect,transform: Transform) {
  let x0 = rect.x
  let y0 = rect.y
  let x1 = rect.x + rect.width
  let y1 = rect.y + rect.height
  let point1 = [x0, y0]
  let point2 = [x1, y0]
  let point3 = [x1, y1]
  let point4 = [x0, y1]
  pointTransform(point1, transform)
  pointTransform(point2, transform)
  pointTransform(point3, transform)
  pointTransform(point4, transform)
  let min = [0, 0]
  let max = [0, 0]
  minPoints(min, point1, point2, point3, point4)
  maxPoints(max, point1, point2, point3, point4)

  return new BoundingRect(
    min[0],
    min[1],
    max[0] - min[0],
    max[1] - min[1]
  )
}
function pointTransform (point: number[], transform: Transform) {
  let x = point[0]
  let y = point[1]
  // 所有距离都要乘以缩放系数
  let scaleX = transform.scale[0]
  let scaleY = transform.scale[1]
  // 绕中心点缩放
  x = x * scaleX
  y = y * scaleY
  // 平移
  x += transform.position[0]
  y += transform.position[1]
  // 得出它绕中心点旋转对应角度后的坐标
  // 证明过程参考前文
  let sinRotation = Math.sin(transform.rotation)
  let cosRotation = Math.cos(transform.rotation)
  let x2ox = x - transform.origin[0]
  let y2oy = y - transform.origin[1]
  x = x2ox * cosRotation - y2oy * sinRotation + transform.origin[0]
  y = x2ox * sinRotation + y2oy * cosRotation + transform.origin[1]
  

  point[0] = x
  point[1] = y
}
function minPoints (min: number[], ...points: number[][]) {
  min[0] = Math.min(...points.map(point => point[0]))
  min[1] = Math.min(...points.map(point => point[1]))
}
function maxPoints (max: number[], ...points: number[][]) {
  max[0] = Math.max(...points.map(point => point[0]))
  max[1] = Math.max(...points.map(point => point[1]))
}