import Stage from './Stage'
import { isString, debounce } from './util'

export interface PainterOptions {
  width?: number
  height?: number
  backgroundColor?: string
}
/**
 * 创建canvas
 */
function createCanvas (dom: string | HTMLCanvasElement | HTMLElement) {
  if (isString(dom)) {
    dom = document.querySelector(dom as string) as HTMLElement
  }
  if (dom instanceof HTMLCanvasElement) {
    return dom
  }
  let canvas = document.createElement('canvas');
  (<HTMLElement>dom).appendChild(canvas)

  canvas.height = (<HTMLElement>dom).clientHeight
  canvas.width = (<HTMLElement>dom).clientWidth

  return canvas
}
/**
 * 后续还有更多的样式需要设置
 */
function setCanvasStyle (canvas: HTMLCanvasElement, opt: PainterOptions) {
  if (opt.height) {
    canvas.height = opt.height
    canvas.style.height = `${opt.height}px`
  } else {
    opt.height = canvas.clientHeight
  }
  if (opt.width) {
    canvas.width = opt.width
    canvas.style.width = `${opt.width}px`
  } else {
    opt.width = canvas.clientWidth
  }
  if (opt.backgroundColor) {
    canvas.style.backgroundColor = opt.backgroundColor
  }
}
class Painter {
  canvas: HTMLCanvasElement
  stage: Stage
  ctx: CanvasRenderingContext2D
  opt: PainterOptions
  render = debounce(() => {
    this.beforeRender()
    let xelements = this.stage.getAll()
    for (let i = 0; i < xelements.length; i += 1) {
      xelements[i].refresh(this.ctx)
    }
  }, 10)
  constructor (dom: string | HTMLCanvasElement | HTMLElement, stage: Stage, opt: PainterOptions = {}) {
    this.opt = opt
    this.canvas = createCanvas(dom)
    setCanvasStyle(this.canvas, opt)
    this.stage = stage
    this.ctx = this.canvas.getContext('2d')
  }
  beforeRender () {
    this.ctx.clearRect(0, 0, this.opt.width, this.opt.height)
  }
}

export default Painter
