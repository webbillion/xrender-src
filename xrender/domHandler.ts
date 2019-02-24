import Stage from './Stage'
import XElement from './xElements/XElement'
import Eventful from './Eventful'
/**
 * 定义事件的格式
 */
export interface XrEvent {
  /**
   * 原始的事件信息
   */
  rawEvent?: Event
  /**
   * x坐标
   */
  x?: number
  /**
   * y坐标
   */
  y?: number
  /**
   * 触发事件的元素
   */
  target?: XElement
  /**
   * 事件类型
   */
  type?: string
}
/**
 * 鼠标事件名称
 * 目前也只考虑鼠标事件
 * 大部分事件不需要做特殊处理
 */
const mouseEvents = [
  'click',
  'mousedown',
  'mouseup',
  // 对于mouseleave等事件，只能通过mousemove来判断
  'mousemove'
  // ..等等
]
/**
 * 处理函数
 */
const handlers = {
  click (e: XrEvent, xel: XElement) {
    xel.dispatch('click', normalizeEvent(e, 'click', xel))
  },
  mousemove (e: XrEvent, xel: XElement, isContain: boolean) {
    // 鼠标已离开元素
    if (xel.hover && !isContain) {
      xel.dispatch('mouseleave', normalizeEvent(e, 'mouseleave', xel))
    // 继续移动
    } else if (xel.hover && isContain) {
      xel.dispatch('mousemove', normalizeEvent(e, 'mousemove', xel))
    // 初次进入
    } else if (!xel.hover && isContain) {
      xel.dispatch('mouseenter', normalizeEvent(e, 'mouseenter', xel))
    }
  },
  mousedown (e: XrEvent, xel: XElement) {
    xel.dispatch('mousedown', normalizeEvent(e, 'mousedown', xel))
  },
  mouseup (e: XrEvent, xel: XElement) {
    xel.dispatch('mouseup', normalizeEvent(e, 'mouseup', xel))
  }
}
/**
 * 将事件转换为内部的事件
 */
function normalizeEvent (e: XrEvent,  type: string, xel: XElement) {
  e.target = xel
  e.type = type

  return e
}
/**
 * 进行坐标转换
 */
function convertCoordinates (e: MouseEvent, dom: HTMLElement) {
  let rect = dom.getBoundingClientRect()
  let xrEvent: XrEvent
  xrEvent = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    rawEvent: e
  }
  if (xrEvent.x < 0) {
    xrEvent.x = 0
  }
  if (xrEvent.y < 0) {
    xrEvent.y = 0
  }

  return xrEvent
}
export class DomHandler extends Eventful {
  domEventsHandlers: {
    [prop: string]: Function
  } = {}
  dom: HTMLElement
  constructor (handlers: {
    [prop: string]: Function
  }, dom: HTMLElement) {
    super()
    this.domEventsHandlers = handlers
    this.dom = dom
  }
  dispose () {
    let handlers = this.domEventsHandlers
    for (let eventName in handlers) {
      this.dom.removeEventListener(eventName, handlers[eventName] as EventListenerOrEventListenerObject)
    }
  }
}
/**
 * 创建dom的事件处理
 */
export default function createDomHandler (dom: HTMLElement, stage: Stage) {
  const mouseEventsHandlers = {}
  const domHandler = new DomHandler(mouseEventsHandlers, dom)
  mouseEvents.forEach(eventName => {
    let handler = mouseEventsHandlers[eventName] = (e: MouseEvent) => {
      let xrEvent = convertCoordinates(e, dom)
      let xelements = stage.getAll()
      let xel: XElement
      let i = xelements.length - 1
      // 并不是说被是包含才调用对应的处理函数
      // 如`mouseleave`事件，虽然鼠标离开的坐标不在元素内，但元素仍然需要触发事件
      for (; i >= 0; i -= 1) {
        xel = xelements[i]
        if (xel.ignored) {
          continue
        }
        let isContain = xel.contain(xrEvent.x, xrEvent.y)
        if (isContain) {
          // 对于剩下的元素，可以直接设置hover为false来重置，不必再判断
          // 并且mouseleave要在mouseenter前触发
          for (i -= 1; i >= 0; i -= 1) {
            if (eventName === 'mousemove') {
              handlers[eventName](xrEvent, xelements[i], false)
            }
            xelements[i].hover = false
          }
        }
        if (isContain || (xel.hover && eventName === 'mousemove')) {
          handlers[eventName](xrEvent, xel, isContain)
        }
        // 为元素添加此属性以便做`mouseleave`等判断
        xel.hover = isContain
      }
      if (!xrEvent.target) {
        domHandler.dispatch(eventName, xrEvent)
      }
    }
    dom.addEventListener(eventName, handler)
  })

  return domHandler
}