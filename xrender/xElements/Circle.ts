import XElement, { XElementShape, XElementOptions } from './XElement'

interface CircleShape extends XElementShape {
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
}
interface CircleOptions extends XElementOptions {
  shape?: CircleShape
}

class Circle extends XElement {
  name ='circle'
  shape: CircleShape = {
    cx: 0,
    cy: 0,
    r: 100
  }
  constructor (opt: CircleOptions = {}) {
    super(opt)
    this.updateOptions()
  }
  render (ctx: CanvasRenderingContext2D) {
    let shape = this.shape
    ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2, true)
  }
}

export default Circle
