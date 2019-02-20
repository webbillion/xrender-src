import XElement, { XElementShape, XElementOptions } from './XElement'
import Stage from '../Stage'
import XRender from '../XRender'

interface GroupShape extends XElementShape {
  /**
   * 左上角x
   */
  x?: number
  /**
   * 左上角y
   */
  y?: number
  width?: number
  height?: number
}
interface GroupOptions extends XElementOptions {
  shape?: GroupShape
}

class Group extends XElement {
  name ='group'
  shape: GroupShape = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
  stage: Stage
  constructor (opt: GroupOptions = {}) {
    super(opt)
    this.updateOptions()
    this.stage = new Stage()
  }
  render (ctx: CanvasRenderingContext2D) {
    let list = this.stage.getAll()
    list.forEach(xel => {
        xel.refresh(ctx)
    })
  }
  afterRender (ctx: CanvasRenderingContext2D) {
    ctx.restore()
  }
  /**
   * 需要为子元素也设置xr
   */
  setXr (xr: XRender) {
    super.setXr(xr)
    this.stage.getAll().forEach(xel => {
      xel.setXr(xr)
    })
  }
  /**
   * 添加元素
   */
  add (...xelements: XElement[]) {
    for (let i = 0; i < xelements.length; i += 1) {
      xelements[i].setParent(this)
    }
    this._xr && this._xr.render()
  }
  /**
   * 删除元素
   */
  delete (xel: XElement) {
    this.stage.delete(xel)
  }
  /**
   * 对于组，进行额外的变换使子元素能相对它定位
   */
  setTransform (ctx: CanvasRenderingContext2D) {
    super.setTransform(ctx)
    ctx.translate(this.shape.x, this.shape.y)
  }
  /**
   * 重置变换，为`setTransform`的逆过程，通常由子孙元素调用
   * 暂时定位只有`Group`有这个方法
   */
  resumeTransform (ctx: CanvasRenderingContext2D) {
    if (!this.selfNeedTransform) {
      return
    }
    ctx.translate(-this.shape.x, -this.shape.y)
    ctx.translate(-this.position[0], -this.position[1])
    ctx.translate(this.origin[0], this.origin[1])
    ctx.rotate(1 / this.rotation)
    ctx.scale(1 / this.scale[0], 1 / this.scale[1])
    ctx.translate(-this.origin[0], -this.origin[1])
  }
}

export default Group
