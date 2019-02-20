import XElement, { XElementShape, XElementOptions } from './XElement'
import {
  quadraticSubdivide,
  quadraticAt,
  cubicAt,
  cubicSubdivide
} from '../util/curve'

interface BezierCurveShape extends XElementShape {
  /**
   * 起点横坐标
   */
  x1: number
  /**
   * 起点纵坐标
   */
  y1: number
  /**
   * 终点横坐标
   */
  x2: number
  /**
   * 终点纵坐标
   */
  y2: number
  /**
   * 控制点1横坐标
   */
  cpx1: number
  /**
   * 控制点1纵坐标
   */
  cpy1: number
  /**
   * 控制点2横坐标，三次曲线
   */
  cpx2?: number
  /**
   * 控制点2纵坐标，三次曲线
   */
  cpy2?: number
  /**
   * 进度
   */
  percent?: number
}
interface BezierCurveOptions extends XElementOptions {
  shape?: BezierCurveShape
}

class BezierCurve extends XElement {
  name = 'beziercurve'
  shape: BezierCurveShape = {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    cpx1: 0,
    cpy1: 0,
    percent: 1
  }
  constructor (opt: BezierCurveOptions = {}) {
    super(opt)
    this.updateOptions()
  }
  render (ctx: CanvasRenderingContext2D) {
    let shape = this.shape
    let x1 = shape.x1
    let y1 = shape.y1
    let x2 = shape.x2
    let y2 = shape.y2
    let cpx1 = shape.cpx1
    let cpy1 = shape.cpy1
    let cpx2 = shape.cpx2
    let cpy2 = shape.cpy2
    let percent = shape.percent
    if (percent === 0) {
        return
    }
    let out = []
    ctx.moveTo(x1, y1)
    if (cpx2 === undefined || cpy2 == undefined) {
      if (percent < 1) {
          quadraticSubdivide(
              x1, cpx1, x2, percent, out
          )
          cpx1 = out[1]
          x2 = out[2]
          quadraticSubdivide(
              y1, cpy1, y2, percent, out
          )
          cpy1 = out[1]
          y2 = out[2]
      }
      ctx.quadraticCurveTo(cpx1, cpy1,x2, y2)
    }
    else {
      if (percent < 1) {
        cubicSubdivide(x1, cpx1, cpx2, x2, percent, out)
        cpx1 = out[1]
        cpx2 = out[2]
        x2 = out[3]
        cubicSubdivide(y1, cpy1, cpy2, y2, percent, out)
        cpy1 = out[1]
        cpy2 = out[2]
        y2 = out[3]
      }
      ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2)
    }
  }
}

export default BezierCurve
