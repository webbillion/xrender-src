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
    xelements.forEach(xel => {
      xel.setXr(this)
    })
    this.stage.add(...xelements)
    this.render()
  }
  render () {
    this.painter.render()
  }
}

export default XRender
