import XElement, { XElementShape, XElementOptions } from './XElement'

interface LineShape extends XElementShape {
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
   * 进度
   */
  percent?: number
}
interface LineOptions extends XElementOptions {
  shape?: LineShape
}

class Line extends XElement {
  name ='circle'
  shape: LineShape = {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    percent: 1
  }
  constructor (opt: LineOptions = {}) {
    super(opt)
    this.updateOptions()
  }
  render (ctx: CanvasRenderingContext2D) {
    let shape = this.shape
    ctx.moveTo(shape.x1, shape.y1)
    let x2 = shape.x2
    let y2 = shape.y2
    if (shape.percent < 1) {
      x2 =  shape.x1 + (x2 - shape.x1) * shape.percent
      y2 =  shape.y1 + (y2 - shape.y1) * shape.percent
    }
    ctx.lineTo(x2, y2)
  }
}

export default Line
