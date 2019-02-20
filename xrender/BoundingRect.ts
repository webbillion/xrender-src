import { Transform } from './xElements/XElement'
import { rectTransform } from './util/boundingRect'
/**
 * 构造包围盒
 */
class BoundingRect {
  x = 0
  y = 0
  width = 0
  height = 0
  constructor (x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
  /**
   * 判定点是否在包围盒内
   */
  contain (x: number, y: number) {
    return x >= this.x
      && x <= this.x + this.width
      && y >= this.y
      && y <= this.y + this.height
  }
  /**
   * 求和另一个包围盒的交集
   * 此包围盒不需要是`BoundingRect`的实例，有几个属性即可
   * 同时，直接修改当前包围盒，而不是新建一个
   */
  union (rect: {x : number, y: number, width: number, height: number}) {
    //  对于初始宽高为0的情况直接设置
    if (this.width <= 0 || this.height <= 0) {
      this.x = rect.x
      this.y = rect.y
      this.width = rect.width
      this.height = rect.height
      return
    }
    let x = Math.min(rect.x, this.x)
    let y = Math.min(rect.y, this.y)
    
    this.width = Math.max(
      this.x + this.width,
      rect.x + rect.width
    ) - x
    this.height = Math.max(
      this.y + this.height,
      rect.y + rect.height
    ) - y
    this.x = x
    this.y = y
  }
  /**
   * 对包围盒应用变换
   * 思路是对每一个点应用变换，然后重新求包围盒
   */
  applyTransform (transform: Transform) {
    return rectTransform(this, transform)
  }
}

export default BoundingRect
