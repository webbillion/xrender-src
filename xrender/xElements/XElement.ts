import XRender from '../XRender'
import { isString, isObject, merge, isFunction } from '../util'
import Animation from '../Animation'
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
  opacity?: number
  lineWidth?: number
}
/**
 * 元素选项接口
 */
export interface XElementOptions extends Transform {
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
  /**
   * 元素所处层级
   */
  zLevel?: number
}
/**
 * 将指定样式绑定到上下文中
 */
function bindStyle (ctx: CanvasRenderingContext2D, style: XElementStyle) {
  let fill = style.fill || 'transparent'
  ctx.fillStyle = fill
  ctx.strokeStyle = style.stroke
  ctx.globalAlpha = style.opacity
  ctx.lineWidth = style.lineWidth
}
interface Transform {
  /**
   * 位置，即偏移
   */
  position?: [number, number]
  /**
   * 缩放
   */
  scale?: [number, number]
  /**
   * 旋转
   */
  rotation?: number
  /**
   * 变换中心
   */
  origin?: [number, number]
}

class XElement implements Transform {
  name = 'xelement'
  shape: XElementShape = {}
  style: XElementStyle = {}
  zLevel = 1
  options: XElementOptions
  _xr: XRender
  /**
   * 为真的话绘制时会忽略此元素
   */
  ignored: boolean
  animation: Animation
  position: [number, number] = [0, 0]
  scale: [number, number] = [1, 1]
  // 默认以左上角为变换中心，因为无法用百分比————每个图形元素的形状都不相同
  origin: [number, number] = [0, 0]
  rotation = 0
  /**
   * 到后面会发现，对不同的属性，需要有不同的设置方法
  */
  attrFunctions = {
    shape: (newShape: Object) => {
      let shape = this.options.shape
      merge(shape, newShape)
    },
    style: (newStyle) => {
      let style = this.options.style
      merge(style, newStyle)
    }
  }
  constructor (opt: XElementOptions = {}) {
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
    ['zLevel', 'origin', 'scale', 'position', 'rotation'].forEach(key => {
      if (opt[key]) {
        this[key] = opt[key]
      }
    })
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
    ctx.save()
    bindStyle(ctx, this.style)
    this.setTransform(ctx)
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
  /**
   * 设置元素相关的`xr`
   */
  setXr (xr: XRender) {
    this._xr = xr
  }
  /**
   * 实际设置属性的方法
   */
  attrKv (key: string, value: any) {
    let updateMethod = this.attrFunctions[key]
    if (updateMethod) {
      updateMethod(value)
    } else {
      this.options[key] = value
    }
  }
  /**
   * 更新属性并重绘
   */
  attr (key: String | Object, value?: any) {
    if (isString(key)) {
      this.attrKv(key as string, value)
    } else if (isObject(key)) {
      for (let name in key) {
        if (key.hasOwnProperty(name)) {
          this.attrKv(name, key[name])
        }
      }
    }
    this.updateOptions()
    this._xr.render()
  }
  /**
   * 显示元素
   */
  show () {
    this.ignored = false
    this._xr.render()
  }
  /**
   * 隐藏元素
   */
  hide () {
    this.ignored = true
    this._xr.render()
  }
  /**
   * 动画到某个状态
   */
  animateTo (target: Object, time: any, delay: any, easing: any, callback: any) {
    // 这一段复制的
    // animateTo(target, time, easing, callback)
    if (isString(delay)) {
      callback = easing
      easing = delay
      delay = 0
    // animateTo(target, time, delay, callback)
    } else if (isFunction(easing)) {
      callback = easing
      easing = 'linear'
      delay = 0
    // animateTo(target, time, callback)
    } else if (isFunction(delay)) {
      callback = delay
      delay = 0
    // animateTo(target, callback)
    } else if (isFunction(time)) {
      callback = time
      time = 500
    // animateTo(target)
    } else if (!time) {
      time = 500
    }
    // 先停止动画
    this.animation && this.animation.stop()
    let animateProps = [
      'shape',
      'style',
      'position',
      'scale',
      'origin',
      'rotation'
    ]
    let animteTarget = {}
    animateProps.forEach(prop => {
      animteTarget[prop] = this[prop]
    })
    this.animation = new Animation(animteTarget)

    return this.animation
      .during((target) => {
        this.attr(target)
      })
      .when(time, target)
      .done(callback)
      .delay(delay)
      .start(easing)
  }
  /**
   * 设置变换
   */
  setTransform (ctx: CanvasRenderingContext2D) {
    // 首先变换中心点
    ctx.translate(...this.origin)
    // 应用缩放
    ctx.scale(...this.scale)
    // 应用旋转
    ctx.rotate(this.rotation)
    // 恢复
    ctx.translate(-this.origin[0], -this.origin[1])
    // 平移
    ctx.translate(...this.position)
    
  }
}

export default XElement
