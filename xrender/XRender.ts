import XElement from './xElements/XElement'
import Stage from './Stage'
import Painter from './Painter'

class XRender {
  stage: Stage
  painter: Painter
  constructor (dom: string | HTMLElement) {
    let stage = new Stage()
    this.stage = stage
    this.painter = new Painter(dom, stage)
  }
  add (...xelements: XElement[]) {
    this.stage.add(...xelements)
    this.render()
  }
  render () {
    this.painter.render()
  }
}

export default XRender
