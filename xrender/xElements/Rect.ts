import XElement, { XElementShape, XElementOptions } from './XElement'

interface RectShape extends XElementShape {
  /**
   * 左上角x
   */
  x: number
  /**
   * 左上角y
   */
  y: number
  width: number
  height: number
}
interface RectOptions extends XElementOptions {
  shape: RectShape
}

class Rect extends XElement {
  name ='rect'
  shape: RectShape = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
  constructor (opt: RectOptions) {
    super(opt)
    this.updateOptions()
  }
  render (ctx: CanvasRenderingContext2D) {
    let shape = this.shape
    ctx.rect(shape.x, shape.y, shape.width, shape.height)
  }
}

export default Rect
