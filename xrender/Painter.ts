import Stage from './Stage'
import Layer from './Layer'
import { isString, debounce } from './util'
import XElement from './xElements/XElement'

export interface PainterOptions {
  width?: number
  height?: number
  backgroundColor?: string
}
/**
 * 有多个层级时创建一个容器，让canvas相对于它定位
 */
function createRoot (width: number, height: number) {
  let root = document.createElement('div')
  root.style.cssText = `
    position: relative;
    overflow: hidden;
    width: ${width}px;
    height: ${height}px;
    padding: 0;
    margin: 0;
    border-width: 0;
  `

  return root
}
class Painter {
  root: HTMLElement
  layerContainer: HTMLElement
  stage: Stage
  opt: PainterOptions
  /**
   * 带层索引的对象
   */
  layerListMap: { [prop: string]: Layer } = {}
  /**
   * 正在绘制的id，调用`paintList`时，如果传入的id和最新的id不一样，则直接返回
   * 把元素留到下一帧绘制时，中途render被调用，则取消原来的绘制，重新绘制
   */
  drawId: number
  render = debounce(() => {
    if (!this.stage) {
      return
    }
    this.beforeRender()
    let xelements = this.stage.getAll()
    this.updateLayerList(xelements)
    this.drawId = Math.random()
    this.painList(xelements, this.drawId)
  }, 10)
  constructor (dom: string | HTMLElement, stage: Stage, opt: PainterOptions = {}) {
    this.opt = opt
    this.stage = stage
    let width = 0
    let height = 0
    if (isString(dom)) {
      dom = document.querySelector(dom as string) as HTMLElement
    }
    width = (<HTMLElement>dom).clientWidth
    height = (<HTMLElement>dom).clientHeight
    if (!opt.width) {
      opt.width = width
    }
    if (!opt.height) {
      opt.height = height
    }
    this.root = dom as HTMLElement
    let container = createRoot(opt.width, opt.height)
    this.layerContainer = container
    this.root.appendChild(container)
    /**
     * 默认的层
     */
    let mainLayer = new Layer(container, opt)
    this.layerListMap[1] = mainLayer
  }
  beforeRender () {
  }
  /**
   * 更新层
   */
  updateLayerList (xelList: XElement[]) {
    let preLayer = null
    let layerList = this.layerListMap
    // 开始之前重置
    this.eachLayer((layer) => {
      layer.startIndex = -1
      layer.endIndex = -1
      layer.drawIndex = -1
      layer.renderByFrame = false
    })
    for (let i = 0; i < xelList.length; i += 1) {
      let xel = xelList[i]
      let layer = layerList[xel.zIndex] || this.createLayer(xel.zIndex)
      if (xel.deleteing) {
        layer._dirty = true
        xel.removeSelf()
        xelList.splice(i, 1)
        i -= 1
        continue
      }
      // 到下一个层级了
      if (preLayer !== layer) {
        layer.startIndex = i
      }
      // 在这里进行标记
      if (xel._dirty) {
        layer._dirty = true
      }
      if (xel.renderByFrame) {
        layer.renderByFrame = true
      }
      layer.endIndex = i
      preLayer = layer
    }
    // 结束之后还有没有元素关联的层，销毁
    this.eachLayer((layer, zIndex) => {
      if (layer.startIndex === -1 && (parseInt(zIndex, 10) !== 1)) {
        layer.dispose()
        delete layerList[zIndex]
      }
    })
  }
  /**
   * 创建新的层并加入列表中 
   */
  createLayer (zIndex: number) {
    let layer = new Layer(this.layerContainer, this.opt, zIndex)
    this.layerListMap[zIndex] = layer

    return layer
  }
  /**
   * 提供一个遍历层的方法
   */
  eachLayer (fn: (layer: Layer, zIndex: string) => void | boolean) {
    // 从高到低
    let keys = Object.keys(this.layerListMap).sort((a, b) => Number(b) - Number(a))
    for (let i in keys) {
      let key = keys[i]
      // 返回为true则跳出此次遍历
      if (fn(this.layerListMap[key], key) as boolean) {
        break
      }
    }
  }
  painList (xelements: XElement[], drawId: number) {
    if (!this.stage) {
      return
    }
    if (drawId !== this.drawId) {
      return
    }
    this.eachLayer((layer, zIndex) => {
      if (!layer._dirty && parseInt(zIndex, 10) !== 1) {
        return
      }
      /**
       * 是否逐帧绘制
       */
      let userTimer = layer.renderByFrame
      let startTime = Date.now()
      let startIndex = layer.drawIndex > -1 ? layer.drawIndex : layer.startIndex
      if (layer.drawIndex === -1) {
        layer.clear()
      }
      if (startIndex === -1) {
        return
      }
      for (let i = startIndex; i <= layer.endIndex; i += 1) {
        xelements[i].refresh(layer.ctx)
        xelements[i]._dirty = false
        // 多余的部分留到下一帧绘制
        if (Date.now() - startTime > 16 && userTimer) {
          layer.drawIndex = i
          requestAnimationFrame(() => {
            this.painList(xelements, drawId)
          })
          return true
        }
      }
      layer._dirty = false
    })
  }
  dispose () {
    this.eachLayer(layer => layer.dispose())
    this.root.innerHTML = ''
    this.root =
    this.stage =
    this.layerContainer =
    this.layerListMap = null
  }
}

export default Painter
