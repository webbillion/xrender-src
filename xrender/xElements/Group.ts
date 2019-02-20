import XElement, { XElementShape, XElementOptions } from './XElement'
import Stage from '../Stage'
import XRender from '../XRender'
import BoundingRect from '../BoundingRect'

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
    this.style.cursor = 'default'
    this.stage = new Stage()
  }
  render (ctx: CanvasRenderingContext2D) {
  }
  beforeRender (ctx: CanvasRenderingContext2D) {
    ctx.save()
    this.setTransform(ctx)
  }
  afterRender (ctx: CanvasRenderingContext2D) {
    ctx.restore()
  }
  /**
   * 需要为子元素也设置xr
   */
  setXr (xr: XRender) {
    super.setXr(xr)
    this.stage.getAll((xel) => {
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
    ctx.translate(this.shape.x, this.shape.y)
    super.setTransform(ctx)
    
  }
  /**
   * 重置变换，为`setTransform`的逆过程，通常由子孙元素调用
   * 暂时定位只有`Group`有这个方法
   */
  resumeTransform (ctx: CanvasRenderingContext2D) {
    if (!this.selfNeedTransform) {
      return
    }
    ctx.translate(this.origin[0], this.origin[1])
    ctx.rotate(1 / this.rotation)
    ctx.scale(1 / this.scale[0], 1 / this.scale[1])
    ctx.translate(-this.origin[0], -this.origin[1])
    ctx.translate(-this.shape.x, -this.shape.y)
    ctx.translate(-this.position[0], -this.position[1])
  }
  dirty () {
    let children = this.stage.xelements
    for (let i = 0; i < children.length; i += 1) {
      children[i].dirty()
    }
  }
  contain (x: number, y: number) {
    let local = this.getLocalCord(x, y)
    x = local[0]
    y = local[1]

    return this.getBoundingRect().contain(x, y)
  }
  getBoundingRect () {
    let children = this.stage.getAll()
    // TODO: 缓存结果
    let rect = new BoundingRect(0, 0, 0, 0)
    let child: XElement
    for (let i = 0; i < children.length; i += 1) {
      child = children[i]
      rect.union(child.getBoundingRect().applyTransform(child))
    }
    this._rect = rect
    return rect
  }
  dispose () {
    super.dispose()
    this.stage.dispose()
  }
}

export default Group
