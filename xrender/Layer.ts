import { isString } from './util'

export interface LayerOptions {
  width?: number
  height?: number
  backgroundColor?: string
}
/**
 * 创建canvas
 */
function createCanvas (container: HTMLElement, opt: LayerOptions, zIndex: number) { 
  let canvas = document.createElement('canvas');
  container.appendChild(canvas)
  if(!opt.height) {
    opt.height = container.clientHeight
  }
  if (!opt.width) {
    opt.width = container.clientWidth
  }
  canvas.width = opt.width
  canvas.height = opt.height
  // 默认所有canvas都是透明的，这样才能叠加，只有最开始创建的层有背景色
  canvas.style.cssText = `
    position: absolute;
    width: ${opt.width}px;
    height: ${opt.height}px;
    left: 0;
    top: 0;
    z-index: ${zIndex};
    background-color: ${zIndex === 1 ? (opt.backgroundColor || 'transparent') : 'transparent'};
  `

  return canvas
}

class Layer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  opt: LayerOptions
  /**
   * 同`XElement._dirty`
   */
  _dirty = false
  /**
   * 层所属元素在所有元素列表中的开始和结束索引
   * 如果遍历所有元素，结束索引认为0，则应该销毁这一层
   */
  startIndex = -1
  endIndex = -1
  drawIndex = -1
  constructor (container: HTMLElement, opt: LayerOptions = {}, zIndex = 1) {
    this.opt = opt
    let canvas = createCanvas(container, opt, zIndex)
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }
  /**
   * 绘制之前要清空画布
   */
  clear () {
    this.ctx.clearRect(0, 0, this.opt.width, this.opt.height)
  }
  /**
   * 当一个层不再有元素和它关联，应该销毁自身和cavnas，以节省空间
   * 对于`XElement`，后续也会提供`dispose`方法
   */
  dispose () {
    this.canvas.remove()
    this.canvas = null
    this.ctx = null
    this.opt = null
    
  }
}

export default Layer
