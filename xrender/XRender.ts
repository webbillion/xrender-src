import XElement from './xElements/XElement'
import Stage from './Stage'
import Painter, { PainterOptions } from './Painter'
import Eventful from './Eventful'
import { inherit, extendsClass } from './util'
import createDomHandler, { DomHandler } from './domHandler'

export interface XRenderOptions extends PainterOptions {

}

class XRender implements Eventful {
  _handlers: { [prop: string]: Function[]; }
  on(event: string, handler: Function): void {
    throw new Error("Method not implemented.")
  }
  off(event?: string, handler?: Function): void {
    throw new Error("Method not implemented.")
  }
  dispatch(event: string, params?: any): void {
    throw new Error("Method not implemented.")
  }
  stage: Stage
  painter: Painter
  domHandler: DomHandler
  constructor (dom: string | HTMLElement, opt: XRenderOptions = {}) {
    extendsClass(this, Eventful)
    let stage = new Stage()
    this.stage = stage
    this.painter = new Painter(dom, stage, opt)
    this.initDomHandler()
    this.initEventHandler()
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
  /**
   * 初始化事件
   */
  initDomHandler () {
    const domHandler = this.domHandler = createDomHandler(this.painter.layerContainer, this.stage)
    let domEventHandlers = this.domHandler.domEventsHandlers
    for (let eventName in domEventHandlers) {
      domHandler.on(eventName, e => {
        this.dispatch(eventName, e)
      })
    }
  }
  /**
   * 对一些事件进行初始化，比如鼠标样式的变化
   */
  initEventHandler () {
    this.on('mouseenter', (e) => {
      if (e.target.name === 'group') {
        return
      }
      this.setCursor(e.target.style.cursor)
    })
    this.on('mouseleave', (e) => {
      if (e.target.name === 'group') {
        return
      }
      this.setCursor('default')
    })
  }
  /**
   * 设置鼠标样式
   */
  setCursor (cursor = 'pointer') {
    this.painter.layerContainer.style.cursor = cursor
  }
}

inherit(XRender, Eventful)

export default XRender
