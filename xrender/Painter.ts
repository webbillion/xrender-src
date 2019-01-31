import Stage from './Stage'
import { isString } from './util'

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

  return canvas
}

class Painter {
  canvas: HTMLCanvasElement
  stage: Stage
  ctx: CanvasRenderingContext2D
  constructor (dom: string | HTMLCanvasElement | HTMLElement, stage: Stage) {
    this.canvas = createCanvas(dom)
    this.stage = stage
    this.ctx = this.canvas.getContext('2d')
  }
  render () {
    let xelements = this.stage.getAll()
    for (let i = 0; i < xelements.length; i += 1) {
      xelements[i].refresh(this.ctx)
    }
  }
}

export default Painter
