import XElement, { XElementShape, XElementOptions } from './XElement'
import { isString } from '../util'

interface ImageShape extends XElementShape {
  /**
   * 左上角x
   */
  x?: number
  /**
   * 左上角y
   */
  y?: number
  /**
   * 图片宽度
   */
  width?: number
  /**
   * 图片高度
   */
  height?: number
  /**
   * 图片地址
   */
  image?: string | CanvasImageSource
  // 这四个参数参考对应api
  sx?: number
  sy?: number
  sWidth?: number
  sHeight?: number
}
interface ImageOptions extends XElementOptions {
  shape?: ImageShape
}

class Image extends XElement {
  name = 'image'
  shape: ImageShape = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }
  imgElement: CanvasImageSource
  constructor (opt: ImageOptions = {}) {
    super(opt)
    // 在创建实例时就尝试创建图片
    let image = opt.shape && opt.shape.image
    if (isString(image)) {
      image = document.createElement('img')
      image.src = opt.shape.image as string
      // 需要注意的是，如果传入的是一个字符串，要等图片载入之后再刷新一次
      image.onload = () => {
        this.dirty()
      }
    }
    this.imgElement = image as CanvasImageSource
    this.updateOptions()
  }
  render (ctx: CanvasRenderingContext2D) {
    let imgElement = this.imgElement
    if (imgElement instanceof HTMLImageElement) {
      if (!imgElement.complete) {
        return
      }
    }
    let shape = this.shape
    if (shape.sx !== undefined) {
      ctx.drawImage(imgElement, shape.sx, shape.sy, shape.sWidth, shape.sHeight, shape.x, shape.y, shape.width, shape.height)
    } else {
      ctx.drawImage(imgElement, shape.x, shape.y, shape.width, shape.height)
    }
  }
}

export default Image
