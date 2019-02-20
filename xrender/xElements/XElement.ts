import XRender from '../XRender'
import { isString, isObject, merge, isFunction } from '../util'
import Animation from '../Animation'
import { EasingFnType } from '../Easing'
import Group from './Group'
import Stage from '../Stage'
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
  /**
   * 相对哪个`Group`定位
   */
  relativeGroup?: Group
  /**
   * 在哪个`Group`内
   */
  parent?: Group
  /**
   * 属于哪一层
   */
  zIndex?: number
  /**
   * 是否需要逐帧绘制
   */
  renderByFrame?: boolean
}
/**
 * 将指定样式绑定到上下文中
 */
function bindStyle (ctx: CanvasRenderingContext2D, style: XElementStyle) {
  let fill = style.fill || 'transparent'
  if (style.fill !== ctx.fillStyle) {
    ctx.fillStyle = fill
  }
  if (style.stroke !== ctx.strokeStyle) {
    ctx.strokeStyle = style.stroke
  }
  if (style.opacity !== ctx.globalAlpha) {
    ctx.globalAlpha = style.opacity
  }
  if (style.lineWidth !== ctx.lineWidth) {
    ctx.lineWidth = style.lineWidth
  }
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
  zIndex = 1
  /**
   * 元素是否为脏，如果是，重绘时会更新元素所在层，脏检查，这是常用的名词，虽然我不太懂
   */
  _dirty = true
  stage: Stage
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
  relativeGroup: Group
  parent: Group
  /**
   * 只对设置了相关属性的图形进行`transform`
   */
  selfNeedTransform = false
  renderByFrame = false
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
    } else {
      opt.shape = {}
    }
    if (opt.style) {
      merge(this.style, opt.style)
    } else {
      opt.style = {}
    }
    ['origin', 'scale', 'position', 'rotation'].forEach(key => {
      if (opt[key] !== undefined) {
        this[key] = opt[key]
      }
      this.selfNeedTransform = true
    });
    ['zLevel', 'relativeGroup', 'zIndex', 'renderByFrame'].forEach(key => {
      if (opt[key] !== undefined) {
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
    this.handleParentBeforeRender(ctx)
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
    this.handleParentAfterRender(ctx)
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
    this.dirty()
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
  animateTo (target: XElementOptions, time?: any, delay?: any, easing?: EasingFnType, callback?: any) {
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
    this.setRelativeTransform(ctx)
    if (!this.selfNeedTransform) {
      return
    }
    // 首先变换中心点
    ctx.translate(this.origin[0], this.origin[1])
    // 应用缩放
    ctx.scale(this.scale[0], this.scale[1])
    // 应用旋转
    ctx.rotate(this.rotation)
    // 恢复
    ctx.translate(-this.origin[0], -this.origin[1])
    // 平移
    ctx.translate(this.position[0], this.position[1])
  }
  /**
   * 设置相对元素的变换
   */
  setRelativeTransform (ctx: CanvasRenderingContext2D) {
    let parent = this.parent
    // 如果不在一个组内，不需要做任何操作
    while (parent) {
      // 父元素和定位元素相同跳出循环
      if (parent === this.relativeGroup) {
        break
      }
      // 否则重置父元素
      parent.resumeTransform(ctx)
      parent = parent.parent
    }
  }
  /**
   * 为自身设置父元素,同时将父元素设为相对定位的元素
   * 然后将自身加入父元素的`stage`中
   */
  setParent (parent: Group) {
    this.parent = parent
    this.relativeGroup = parent
    parent.stage.add(this)
    this.setXr(parent._xr)
  }
  /**
   * 在渲染之前对父元素进行处理
   * 包括应用样式等
   */
  handleParentBeforeRender (ctx: CanvasRenderingContext2D) {
    if (this.parent) {
      this.parent.beforeRender(ctx)
    }
  }
  /**
   * 渲染之后对父元素进行处理
   * 主要是调用`restore`
   */
  handleParentAfterRender (ctx: CanvasRenderingContext2D) {
    if (this.parent) {
      this.parent.afterRender(ctx)
    }
  }
  /**
   * 标记元素为脏
   * 在使用完毕后会标记为false
   */
  dirty () {
    // 并不需要对父元素也进行标记
    this._dirty = true
    this._xr && this._xr.render()
  }
}

export default XElement
