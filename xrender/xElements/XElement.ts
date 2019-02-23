import XRender from '../XRender'
import { isString, isObject, merge, isFunction, inherit, extendsClass, clone, getAnimationTarget } from '../util'
import Animation from '../Animation'
import { EasingFnType } from '../Easing'
import Group from './Group'
import Stage from '../Stage'
import Eventful from '../Eventful'
import Path from '../Path'
import BoundingRect from '../BoundingRect'
import { XrEvent } from '../domHandler'
import { contain, containStroke } from '../contain'
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
  /**
   * 鼠标样式
   */
  cursor?: string
  /**
   * 字体大小
   */
  fontSize?: number
  /**
   * 字体种类
   */
  fontFamily?: string
  shadowBlur?: number
  shadowColor?: Color
  shadowOffsetX?: number
  shadowOffsetY?: number
  textBaseline?: string
  textAlign?: string
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
  /**
   * 是否开启可拖曳
   */
  dragable?: boolean
}
/**
 * 将指定样式绑定到上下文中
 */
export function bindStyle (ctx: CanvasRenderingContext2D, style: XElementStyle) {
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
  let font = `${style.fontSize}px ${style.fontFamily}`
  ctx.font = font;
  ['lineWidth', 'shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY'].forEach(prop => {
    if (style[prop] !== ctx[prop]) {
      ctx[prop] = style[prop]
    }
  })
  let textBaseline = style.textBaseline
  if (['top', 'middle', 'bottom'].indexOf(textBaseline) === -1) {
    // 默认为顶部
    textBaseline = 'top'
    // 要更新style里的值
    style.textBaseline = textBaseline
  }
  ctx.textBaseline = 'top'
  let textAlign = style.textAlign
  if (['left', 'center', 'right'].indexOf(textAlign) === -1) {
    // 默认为左侧
    textAlign = 'left'
    style.textAlign = style.textAlign
  }
  ctx.textAlign = 'left'
}
export interface Transform {
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

class XElement implements Transform, Eventful {
  _handlers: { [prop: string]: Function[]; }
  on(event: string, handler: (e: XrEvent) => void): void {
    throw new Error("Method not implemented.")
  }
  off(event?: string, handler?: Function): void {
    throw new Error("Method not implemented.")
  }
  dispatch(event: string, params: any): void {
    Eventful.prototype.dispatch.call(this, event, params)
    if (this.parent && (this.parent.parent || this.parent._xr)) {
      this.parent.dispatch(event, params)
    } else {
      this._xr.dispatch(event, params)
    }
  }
  name = 'xelement'
  shape: XElementShape = {}
  style: XElementStyle = {
    fill: 'none',
    stroke: 'none',
    lineWidth: 1,
    opacity: 1,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'serif',
    textAlign: 'left',
    textBaseline: 'top'
  }
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
  /**
   * 组元素才有
   */
  stage: Stage
  /**
   * 自身所关联的stage
   */
  __stage: Stage
  /**
   * 路径代理
   */
  path: Path
  /**
   * 鼠标是否悬浮在元素上
   */
  hover: boolean
  /**
   * 用于裁剪的元素，只能通过`setClip`设置
   */
  clip: XElement
  /**
   * 是否被用于裁剪，如果是的话，不会进行描边和填充
   */
  isClip: boolean
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

  _rect: BoundingRect
  /**
   * 是否开启可拖曳
   */
  dragable = false
  /**
   * 是否正在被删除，`Layer`遇到此标记等同于`drity`，然后调用删除自身的方法
   * 而`Stage`删除元素时此标记为真会将此元素删除，否则标记为真，然后调用`dirty()`
   */
  deleteing = false
  constructor (opt: XElementOptions = {}) {
    extendsClass(this, Eventful)
    this.path = new Path()
    this.options = opt
    this.initEventHandler()
  }
  /**
   * 这一步不在构造函数内进行是因为放在构造函数内的话，会被子类的默认属性声明重写
   */
  updateOptions (opt?: XElementOptions) {
    if (!opt) {
      this.updateOptionsFromParent()
      opt = this.options
    }
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
    ['origin', 'scale', 'position', 'rotation', 'dragable'].forEach(key => {
      if (opt[key] !== undefined) {
        this[key] = opt[key]
        this.selfNeedTransform = true
      }
    });
    ['zLevel', 'relativeGroup', 'zIndex', 'renderByFrame'].forEach(key => {
      if (opt[key] !== undefined) {
        this[key] = opt[key]
        // 设置`clip`的相对定位元素
        if (key === 'relativeGroup') {
          this.clip && this.clip.attr({
            relativeGroup: opt[key]
          })
        }
      }
    })
  }
  /**
   * 合并自身和父元素的配置
   */
  getOptions () {
    let opt = clone(this.options);
    // 不包括变换相关的属性
    ['position','scale', 'origin', 'rotation', 'dragable'].forEach(key => {
      delete opt[key]
    })
    if (!this.parent) {
      return opt
    }
    return merge(opt, this.parent.getOptions())
  }
  /**
   * 先从父元素更新配置
   */
  updateOptionsFromParent () {
    if (!this.parent) {
      return
    }
    this.updateOptions(this.parent.getOptions())
  }
  /**
   * 绘制
   */
  render (ctx: CanvasRenderingContext2D | Path) {

  }
  /**
   * 绘制之前进行样式的处理
   */
  beforeRender (ctx: CanvasRenderingContext2D) {
    // 需要注意的是，裁剪路径有自己的`transform`体系，为了让裁剪路径和元素本身有相同的相对变换，需要在`setClip`中设置parent
    ctx.save()
    this.setCtxClip(ctx)
    this.handleParentBeforeRender(ctx)
    ctx.save()
    bindStyle(ctx, this.style)
    this.setTransform(ctx)
    ctx.beginPath()
  }
  hasStroke () {
    if (this.style.stroke === 'none') {
      return false
    }
    // 认为图片没有描边
    if (this.style.stroke && this.style.lineWidth > 0 && this.name !== 'image') {
      return true
    }

    return false
  }
  hasFill () {
    if (this.style.fill === 'none') {
      return false
    }
    if (this.style.fill) {
      return true
    }

    return false
  }
  /**
   * 绘制之后进行还原
   */
  afterRender (ctx: CanvasRenderingContext2D) {
    if (this.hasFill() && !this.isClip) {
      ctx.fill()
    }
    if (this.hasStroke() && !this.isClip) {
      ctx.stroke()
    }
    ctx.restore()
    this.handleParentAfterRender(ctx)
    // 在最后，重置裁剪
    ctx.restore()
  }
  /**
   * 刷新，这个方法由外部调用
   */
  refresh (ctx: CanvasRenderingContext2D) {
    if (this.ignored) {
      return
    }
    this.beforeRender(ctx)
    this.path.start(ctx)
    this.render(this.path)
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
    this.dirty()
  }
  /**
   * 隐藏元素
   */
  hide () {
    this.ignored = true
    // 因此同样适用于隐藏Group
    this.dirty()
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
    // 先停止动画e
    this.animation && this.animation.stop()
    this.animation = new Animation(getAnimationTarget(this, target))
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
  // setTransform (ctx: CanvasRenderingContext2D) {
  //   this.setRelativeTransform(ctx)
  //   if (!this.selfNeedTransform) {
  //     return
  //   }
  //   // 首先变换中心点
  //   ctx.translate(this.origin[0], this.origin[1])
  //   // 应用缩放
  //   ctx.scale(this.scale[0], this.scale[1])
  //   // 应用旋转
  //   ctx.rotate(this.rotation)
  //   // 恢复
  //   ctx.translate(-this.origin[0] / this.scale[0], -this.origin[1] / this.scale[1])
  //   // 平移
  //   ctx.translate(this.position[0] / this.scale[0], this.position[1] / this.scale[1])
  // }
  setTransform (ctx: CanvasRenderingContext2D) {
    this.setRelativeTransform(ctx)
    if (!this.selfNeedTransform) {
      return
    }
    // 平移
    ctx.translate(this.position[0], this.position[1])
    // 首先变换中心点
    ctx.translate(this.origin[0], this.origin[1])
    // 应用缩放
    ctx.scale(this.scale[0], this.scale[1])
    // 应用旋转
    ctx.rotate(this.rotation)
    // 恢复
    ctx.translate(-this.origin[0] / this.scale[0], -this.origin[1] / this.scale[1])
    
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
    // 更新配置
    this.updateOptions()
    // 更新裁剪路径的父元素
    if (this.clip) {
      this.setClip(this.clip)
    }
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
    this._rect = null
    // 并不需要对父元素也进行标记
    this._dirty = true
    this._xr && this._xr.render()
  }
  /**
   * 是否包含某个点
   */
  contain (x: number, y: number) {
    // 触发事件时可能还没有调用refresh
    if (!this.path._ctx) {
      return
    }
    if (this.clip) {
      if (!this.clip.contain(x, y)) {
        return
      }
    }
    let local = this.getLocalCord(x, y)
    x = local[0]
    y = local[1]

    if (this.getBoundingRect().contain(x, y)) {
      if (this.hasStroke()) {
        if (containStroke(this.path.data, this.style.lineWidth, x, y)) {
          return true
        }
      }
      if (this.hasFill()) {
        return contain(this.path.data, x, y)
      }
    }
  }
  getBoundingRect () {
    // 第一次和需要更新时才重新获取包围盒
    // 为此需要在更新时将_rect置为null
    // 尽管不是所有属性更新都会引起包围盒变化，暂时先不管
    if (!this._rect) {
      this._rect = this.path.getBoundingRect()
      let rect = this._rect
      let lineWidth = this.style.lineWidth
      if (this.hasStroke()) {
        // 因为描边是两边都描
        rect.x -= lineWidth / 2
        rect.y -= lineWidth / 2
        rect.width += lineWidth
        rect.height += lineWidth
      }
    }
    return this._rect
  }
  /**
   * 将坐标重置为本地坐标
   */
  getLocalCord (x: number, y: number) {
    // 计算的时候取相对定位的组，而不是父元素
    if (this.relativeGroup) {
      let inParentCord = this.relativeGroup.getLocalCord(x, y)
      x = inParentCord[0]
      y = inParentCord[1]
    }
    if (this.selfNeedTransform) {
      let transformCord = getTransformCord(x, y, {
        scale: this.scale,
        origin: this.origin,
        position: this.position,
        rotation: this.rotation
      })
      x = transformCord[0]
      y = transformCord[1]
    }


    return [x, y]
    
  }
  initEventHandler () {
    this.initDragEvent()
  }
  initDragEvent () {
    let lastX = 0
    let lastY = 0
    let draging = false
    if (this)
    this.on('mousedown', e => {
      // 冒泡的时候子元素没有设置`dragable`才移动
      if (!this.dragable || (this !== e.target && e.target.dragable)) {
        return
      }
      draging = true
      lastX = e.x
      lastY = e.y
      this._xr.setCursor('move')
    })
    this.on('mousemove', e => {
      if (!draging || !this.dragable || (this !== e.target && e.target.dragable)) {
        return
      }
      let xDiff = e.x - lastX
      let yDiff = e.y - lastY
      this.attr({
        position: [this.position[0] += xDiff, this.position[1] += yDiff]
      })
      lastX = e.x
      lastY = e.y
    })
    this.on('mouseup', e => {
      if (!this.dragable  || (this !== e.target && e.target.dragable)) {
        return
      }
      draging = false
      this._xr.setCursor(this.style.cursor)
    })
    this.on('mouseleave', e => {
      if (!this.dragable  || (this !== e.target  && e.target.dragable)) {
        return
      }
      this._xr.setCursor('default')
      draging = false
    })
  }
  /**
   * 设置裁剪路径
   */
  setClip (xel: XElement) {
    this.clip = xel
    // 为了能应用变换
    if (this.parent) {
      // 但又不被`getAll`所获取
      xel.ignored = true
      xel.setParent(this.parent)
      xel.options.relativeGroup = this.relativeGroup
      // 否则会不断循环
      xel._xr = null
    }
    this.dirty()
  }
  /**
   * 移除裁剪路径
   */
  removeClip () {
    this.clip.ignored = false
    this.clip = null
    this.dirty()
  }
  /**
   * 为上下文设定裁剪路径
   */
  setCtxClip (ctx: CanvasRenderingContext2D) {
    if (this.clip) {
      this.clip.isClip = true
      this.clip.refresh(ctx)
      this.clip.isClip = false
      ctx.clip()
    }
  }
  dispose () {
    if (this.animation) {
      this.animation.stop()
      this.animation.clear()
    }
  }
  removeSelf () {
    this.__stage.delete(this)
  }
}
inherit(XElement, Eventful, ['dispatch'])

export function getTransformCord(x, y, transform: Transform) {
  // 所有距离都要乘以缩放系数
  let scaleX = transform.scale[0]
  let scaleY = transform.scale[1]
  // 平移
  x -= transform.position[0]
  y -= transform.position[1]
  
  // 得出它绕中心点旋转相反角度后的坐标
  // 证明过程参考前文
  let sinRotation = Math.sin(-transform.rotation)
  let cosRotation = Math.cos(-transform.rotation)
  let x2ox = x - transform.origin[0]
  let y2oy = y - transform.origin[1]
  x = x2ox * cosRotation - y2oy * sinRotation + transform.origin[0]
  y = x2ox * sinRotation + y2oy * cosRotation + transform.origin[1]
  
  // 缩放
  x = x / scaleX
  y = y / scaleY

  return [x, y]
}

export default XElement
      