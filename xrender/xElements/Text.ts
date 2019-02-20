import XElement, { XElementShape, XElementOptions, XElementStyle } from './XElement'
import Rect from './Rect'
import { clone, merge } from '../util'
import { getWrapText, renderText, getFontData, parsePadding, LineText } from '../util/text'

export interface TextShape extends XElementShape {
  x?: number
  y?: number
  /**
   * 要绘制的文字
   */
  text?: string
  /**
   * 此`maxWidth`不同于`canvas`绘制时的`maxWidth`，用来控制换行和省略的，且只是一个限制，而不是指定宽度
   */
  maxWidth?: number
  maxHeight?: number
  /**
   * 和`max*`的区别在于指定了宽高
   */
  height?: number
  width?: number
  rows?: number
  /**
   * 是否允许换行，默认不换行
   */
  wrap?: boolean
  /**
   * 超出部分如何显示
   */
  overflow?: 'hidden' | 'visible' | 'ellipsis'
  /**
   * 边距
   */
  padding?: number[] | number
}
interface TextOptions extends XElementOptions {
  shape?: TextShape
  /**
   * 为包围盒应用的样式
   */
  rectStyle?: XElementStyle
}

class Text extends XElement {
  name = 'text'
  shape: TextShape = {
    text: '',
    x: 0,
    y: 0,
    padding: 0
  }
  rows: number
  boundingRect: Rect
  lineTexts: LineText[] = []
  rectStyle: XElementStyle = {
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
  fontData = {
    lineHeight: 12,
    top: 0
  }
  boundingRectPosition = [0, 0]
  constructor (opt: TextOptions = {}) {
    super(opt)
    // this.style.cursor = 'default'
    this.updateOptions()
  }
  updateOptions(opt?: TextOptions) {
    super.updateOptions(opt)
    opt = opt || this.options
    if (opt.rectStyle) {
      merge(this.rectStyle, opt.rectStyle)
    }
    const fontData = this.fontData = getFontData(this.style)
    const shape = opt.shape
    let padding = parsePadding(this.shape.padding)
    if (shape.rows) {
      this.shape.maxHeight = this.shape.rows * fontData.lineHeight + padding[0] + padding[2]
    }
    // 计算方式是相同的
    if (shape.height) {
      shape.maxHeight = shape.height
    }
    if (shape.width) {
      shape.maxWidth = shape.width
    }
    
  }
  updateClipRect (x: number, y: number, width: number, height: number) {
    if (this.shape.overflow === 'visible') {
      return
    }
    let opt = {
      scale: clone(this.scale),
      rotation: this.rotation,
      position: clone(this.position),
      origin: clone(this.origin),
      shape: {
        x,
        y,
        width,
        height
      },
      style: {
        stroke: '#f00',
        opacity: 0.5
      }
    }
    let rect = this.clip
    if (!rect) {
      rect = new Rect(opt)
      this.setClip(rect)
    } else {
      rect.attr(opt)
    }
  }
  updateBoundingRect (x: number, y: number, width: number, height: number) {
    let opt = {
      scale: clone(this.scale),
      rotation: this.rotation,
      position: clone(this.position),
      origin: clone(this.origin),
      shape: {
        x,
        y,
        width,
        height
      },
      style: this.rectStyle,
      relativeGroup: this.relativeGroup
    }
    let rect = this.boundingRect
    if (!rect) {
      rect = new Rect(opt)
    } else {
      rect.attr(opt)
    }
    // 它和Text用相同的变换
    if (this.parent) {
      // 仅仅用于绘制时判断，所以不需要调用setParent
      rect.parent = this.parent
    }

    this.boundingRect = rect
  }
  beforeRender (ctx: CanvasRenderingContext2D) {
    super.beforeRender(ctx)
  }
  render (ctx: CanvasRenderingContext2D) {
    if (this.hasFill()) {
      renderText(ctx, this.lineTexts, 'fillText')
    }
    if (this.hasStroke()) {
      renderText(ctx, this.lineTexts, 'strokeText')
    }
  }
  beforeSetCtxClip (ctx: CanvasRenderingContext2D) {
    // 虽然放在这里不是很合适，但是目前只能想到这么做来避免被裁剪掉
    let shape = this.shape
    let x = shape.x
    let y = shape.y
    let clipX = x
    let clipY = y
    let padding = parsePadding(this.shape.padding)
    let lineHeight = this.fontData.lineHeight
    clipY += padding[0]
    clipX += padding[3]
    let lineTexts = getWrapText(
      // 这里就减去top
      clipX, clipY - this.fontData.top, ctx, shape.text,
      shape, this.style, lineHeight, padding
    )
    let textWidth = Math.max(...lineTexts.map(lineText => lineText.width))
    let textHeight = lineTexts.length * lineHeight

    let clipWidth = textWidth
    let clipHeight = textHeight
    let boundingRectWidth = textWidth + padding[1] + padding[3]
    let boundingRectHeight = textHeight + padding[0] + padding[2]
    if (shape.height) {
      clipHeight = shape.height - padding[0] - padding[2]
      boundingRectHeight = shape.height
    }
    if (shape.width) {
      clipWidth = shape.width - padding[1] - padding[3]
      boundingRectWidth = shape.width
    }

    let offsetX = 0
    let offsetY = 0
    switch (this.style.textAlign) {
      case 'right':
        offsetX = -boundingRectWidth
        break
      case 'center':
        offsetX = -boundingRectWidth / 2
        break
      case 'left':
      default:
        break
    }
    switch (this.style.textBaseline) {
      case 'bottom':
        offsetY = -boundingRectHeight
        break
      case 'middle':
        offsetY = -boundingRectHeight / 2
        break
      case 'top':
      default:
        break
    }

    clipX += offsetX
    clipY += offsetY
    x += offsetX
    y += offsetY
    this.lineTexts = lineTexts.map(lineText => {
      lineText.y += offsetY
      lineText.x += offsetX

      return lineText
    })
    this.updateClipRect(clipX, clipY, clipWidth, clipHeight)
    this.updateBoundingRect(x, y, boundingRectWidth, boundingRectHeight)
    this.boundingRect.refresh(ctx)
  }
  setCtxClip (ctx: CanvasRenderingContext2D) {
    this.beforeSetCtxClip(ctx)
    super.setCtxClip(ctx)
  }
  initEventHandler () {
    super.initEventHandler.call(this)
    // this.initMouseWheel()
  }
  /**
   * 监听滚轮事件，以便可以滚动
   */
  initMouseWheel () {
    this.on('mousewheel', e => {
      let rawEvent = e.rawEvent as WheelEvent
      rawEvent.preventDefault()
      this.attr({
        shape: {
          y: this.shape.y - rawEvent.deltaY / 5
        }
      })
    })
  }
  contain (x: number, y: number) {
    // 变换和描边等
    return this.boundingRect.contain(x, y)
  }
  getBoundingRect () {
    return this.boundingRect.getBoundingRect()
  }
}

export default Text
