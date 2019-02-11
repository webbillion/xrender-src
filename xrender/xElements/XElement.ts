import { merge } from '../util'
/**
 * 目前什么都没有
 */
export interface XElementShape {
}
/**
 * 颜色
 */
type Color = string | CanvasGradient | CanvasPattern
export interface XElementStyle {
  // 先只设定描边颜色和填充
  /**
   * 填充
   */
  fill?: Color
  /**
   * 描边
   */
  stroke?: Color
}
/**
 * 元素选项接口
 */
export interface XElementOptions {
  /**
   * 元素类型
   */
  type?: string
  /**
   * 形状
   */
  shape?: XElementShape
  /**
   * 样式
   */
  style?: XElementStyle
}

class XElement {
  name = 'xelement'
  shape: XElementShape = {}
  style: XElementStyle = {}
  options: XElementOptions
  constructor (opt: XElementOptions) {
    this.options = opt
  }
  /**
   * 这一步不在构造函数内进行是因为放在构造函数内的话，会被子类的默认属性声明重写
   */
  updateOptions () {
    let opt = this.options
    if (opt.shape) {
      merge(this.shape, opt.shape)
    }
    if (opt.style) {
      merge(this.style, opt.style)
    }
  }
  /**
   * 绘制
   */
  render (ctx: CanvasRenderingContext2D) {

  }
  /**
   * 绘制之前进行样式的处理
   */
  beforeRender (ctx: CanvasRenderingContext2D) {
    this.updateOptions()
    let style = this.style
    ctx.save()
    ctx.fillStyle = style.fill
    ctx.strokeStyle = style.stroke
    ctx.beginPath()
  }
  /**
   * 绘制之后进行还原
   */
  afterRender (ctx: CanvasRenderingContext2D) {
    ctx.stroke()
    ctx.fill()
    ctx.restore()
  }
  /**
   * 刷新，这个方法由外部调用
   */
  refresh (ctx: CanvasRenderingContext2D) {
    this.beforeRender(ctx)
    this.render(ctx)
    this.afterRender(ctx)
  }
}

export default XElement
