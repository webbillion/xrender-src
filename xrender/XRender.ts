import XElement from './xElements/XElement'
import Stage from './Stage'
import Painter, { PainterOptions } from './Painter'

export interface XRenderOptions extends PainterOptions {

}

class XRender {
  stage: Stage
  painter: Painter
  constructor (dom: string | HTMLElement, opt: XRenderOptions = {}) {
    let stage = new Stage()
    this.stage = stage
    this.painter = new Painter(dom, stage, opt)
  }
  add (...xelements: XElement[]) {
    let xel
    for (let i = 0; i < xelements.length; i += 1) {
      xel = xelements[i]
      xel.setXr(this)
      this.stage.add(xel)
    }
    this.render()
  }
  render () {
    this.painter.render()
  }
}

export default XRender
