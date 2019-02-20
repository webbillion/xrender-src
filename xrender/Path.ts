import BoundingRect from './BoundingRect'
import { fromArc, fromLine, fromCubic, fromQuadratic } from './bbox'

/**
 * 路径类型，即函数名称
 */
export enum PathType  {
  arc = 1,
  arcTo,
  bezierCurveTo,
  closePath,
  ellipse,
  lineTo,
  moveTo,
  quadraticCurveTo,
  rect,
  drawImage
}
export interface PathData  {
  type: PathType
  params: any[]
}

/**
 * 路径代理
 * 实现了context绘制路径的方法并
 * 保存元素绘制的路径
 * 并判断是否包含某个点
 */
class Path {
  /**
   * 保存着路径数据，格式先不管
   */
  data: PathData[] = []
  /**
   * 真正绘制的上下文
   */
  _ctx: CanvasRenderingContext2D
  /**
   * 包围盒
   */
  _rect: BoundingRect
  constructor (ctx?: CanvasRenderingContext2D) {
    // 可以使用beginPath重置
    this._ctx = ctx
  }
  /**
   * 传入ctx，并开始路径绘制，做一些重置操作
   */
  start (ctx?: CanvasRenderingContext2D) {
    if (ctx) [
      this._ctx = ctx
    ]
    // 重置数据
    this.data = []
  }
  /**
   * 添加数据
   */
  addData (type: PathType, ...params) {
    this.data[this.data.length] = {
      type,
      params
    }
  }
  // 以下方法调用ctx对应方法即可
  // 约定ctx已经存在
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    this.addData(PathType.arc, x, y, radius, startAngle, endAngle, anticlockwise)
    this._ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise)
  }
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this.addData(PathType.arcTo, x1, y1, x2, y2, radius)
    this._ctx.arcTo(x1, y1, x2, y2, radius)
  }
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    this.addData(PathType.bezierCurveTo, cp1x, cp1y, cp2x, cp2y, x, y)
    this._ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
  }
  closePath(): void {
    this.addData(PathType.closePath)
    this._ctx.closePath()
  }
  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    this.addData(PathType.ellipse, x, y, radiusX, radiusY, rotation, anticlockwise)
    this._ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise)
  }
  lineTo(x: number, y: number): void {
    this.addData(PathType.lineTo, x, y)
    this._ctx.lineTo(x, y)
  }
  moveTo(x: number, y: number): void {
    this.addData(PathType.moveTo, x, y)
    this._ctx.moveTo(x, y)
  }
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.addData(PathType.quadraticCurveTo, cpx, cpy, x, y)
    this._ctx.quadraticCurveTo(cpx, cpy, x, y)
  }
  rect(x: number, y: number, w: number, h: number): void {
    this.addData(PathType.rect, x, y, w, h)
    this._ctx.rect(x, y, w, h)
  }
  drawImage(img: CanvasImageSource, dx: number, dy: number, dw?: number, dh?: number, sx?: number, sy?: number, sw?: number, sh?: number) {
    if (!sx) {
      this._ctx.drawImage(img, dx, dy, dw, dh)
      this.addData(PathType.drawImage, dx, dy, dw, dh)
    } else {
      // 参数名称有错
      this._ctx.drawImage(img, dx, dy, dw, dh, sx, sy, sw, sh)
      this.addData(PathType.drawImage, sx, sy, sw, sh)
    }
  }
  /**
   * 当前路径是否包含某个点
   */
  contain (x: number, y: number) {
    if (!this._rect) {
      this._rect = this.getBoundingRect()
    }
    if (this._rect.contain(x, y)) {
      return true
    }
  }
  /**
   * 求取包围盒
   */
  getBoundingRect () {
    /**
     * 分别保存着xy的最小和最大值
     */
    let min = [0, 0]
    let max = [0, 0]
    // 当前元素路径起始点，用于closePath，第一个命令和moveTo会改变它
    let start = [0, 0]
    // 上一个命令的终点
    let prePathFinal = [0, 0]
    // 当前命令的起点，用来和prePathFinal一起计算包围盒
    let pathStartPoint = [0, 0]
    // 重置包围盒
    let rect: BoundingRect
    let data = this.data
    let pathData: PathData
    let params: any[]
    function union () {
      if (rect) {
        rect.union({
          x: min[0],
          y: min[1],
          width: max[0] - min[0],
          height: max[1] - min[1]
        })
      } else {
        rect = new BoundingRect(
          min[0],
          min[1],
          max[0] - min[0],
          max[1] - min[1]
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
      // 对于第一个命令不是moveto的情况设置绘制起点和当前元素路径起始点
      // 对于arc会在后续处理
      if (i === 0) {
        start[0] = pathStartPoint[0]
        start[1] = pathStartPoint[1]
        prePathFinal[0] = pathStartPoint[0] // x
        prePathFinal[1] = pathStartPoint[1]
      }
      // 根据绘制方法的不同用不同的计算方式
      switch (pathData.type) {
        case PathType.arc:
          pathStartPoint[0] = Math.cos(params[3]) * params[2] + params[0]
          pathStartPoint[1] = Math.sin(params[3]) * params[2] + params[1]
          // 从上一个命令的绘制终点到当前路径的起点构建包围盒
          fromLine(prePathFinal, pathStartPoint, min, max)
          union()
          fromArc(
            params[0],
            params[1],
            params[2],
            params[3],
            params[4],
            params[5],
            min,
            max
          )
          prePathFinal[0] = Math.cos(params[4]) * params[2] + params[0]
          prePathFinal[1] = Math.sin(params[4]) * params[2] + params[1]
          if (i === 0) {
            start[0] = pathStartPoint[0]
            start[1] = pathStartPoint[1]
          }
          break
        case PathType.arcTo:
          break
        case PathType.bezierCurveTo:
          fromLine(prePathFinal, pathStartPoint, min, max)
          union()  
          fromCubic(
            prePathFinal[0],
            prePathFinal[1],
            params[0],
            params[1],
            params[2],
            params[3],
            params[4],
            params[5],
            min,
            max
          ) 
          prePathFinal[0] = params[4]
          prePathFinal[1] = params[5]
          break
        case PathType.lineTo:
          fromLine(prePathFinal, params, min, max)
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
          fromLine(prePathFinal, pathStartPoint, min, max)
          union()
          fromQuadratic(
            prePathFinal[0],
            prePathFinal[1],
            params[0],
            params[1],
            params[2],
            params[3],
            min,
            max
          )
          prePathFinal[0] = params[2]
          prePathFinal[1] = params[3]
          break
        case PathType.rect:
          min[0] = params[0] // x
          min[1] = params[1] // y
          max[0] = params[0] + params[2] // w
          max[1] = params[1] + params[3] // h
          prePathFinal[0] = params[0]
          prePathFinal[1] = params[1]
          break
        case PathType.drawImage:
          min[0] = params[1] // x
          min[1] = params[2] // y
          max[0] = params[1] + params[3] // w
          max[1] = params[2] + params[4] // h
          break
        case PathType.closePath:
          prePathFinal[0] = start[0]
          prePathFinal[1] = start[1]
        default:
          break
      }
      // 和当前路径的包围盒相交
      union()
      // 每个命令结束后都要用当前路径终点和当前元素所有路径的起始点来构建包围盒
      fromLine(prePathFinal, start, min, max)
      union()
    }

    return rect || new BoundingRect(0, 0, 0, 0)
  }
}


export default Path
