import XElement, { XElementShape, XElementOptions } from './XElement'

interface ArcShape extends XElementShape {
  /**
   * 圆心x坐标
   */
  cx: number
  /**
   * 圆心y坐标
   */
  cy: number
  /**
   * 半径
   */
  r: number
  /**
   * 开始角度
   */
  startAngle: number
  /**
   * 结束角度
   */
  endAngle: number
  /**
   * 是否顺时针，默认为true
   */
  clockwise?: boolean
}
interface ArcOptions extends XElementOptions {
  shape?: ArcShape
}

class Arc extends XElement {
  name = 'arc'
  shape: ArcShape = {
    cx: 0,
    cy: 0,
    r: 100,
    startAngle: 0,
    endAngle: 0,
    clockwise: true
  }
  constructor (opt: ArcOptions = {}) {
    super(opt)
    this.updateOptions()
  }
  render (ctx: CanvasRenderingContext2D) {
    let shape = this.shape
    ctx.arc(shape.cx, shape.cy, shape.r, shape.startAngle, shape.endAngle, !shape.clockwise)
  }
}

export default Arc
