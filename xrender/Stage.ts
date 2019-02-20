import XElement from './xElements/XElement'

class Stage {
  /**
   * 所有元素的集合
   */
  xelements: XElement[] = []
  constructor () {
    console.log('Stage')
  }
  /**
   * 添加元素
   * 显然可能会添加多个元素
   */
  add (...xelements: XElement[]) {
    this.xelements.push(...xelements)
  }
  /**
   * 删除指定元素
   */
  delete (xel: XElement) {
    let index = this.xelements.indexOf(xel)
    if (index > -1) {
      this.xelements.splice(index)
    }
  }
  /**
   * 获取所有元素
   */
  getAll (callback?: (xel: XElement) => void) {
    let xelements = this.updateXElements(callback)

    return xelements
  }
  updateXElements (callback?: (xel: XElement) => void) {
    // zIndex高的在前
    // zLevel高的在后，其它按加入次序排列
    return this.expandXElements(callback).sort((a, b) => {
      let zIndex = b.zIndex - a.zIndex
      return  zIndex === 0 ? a.zLevel - b.zLevel : zIndex
    })
  }
  /**
   * 展开所有元素
   * 有一个副作用，目前用来设置xr
   */
  expandXElements (callback?: (xel: XElement) => void) {
    let list: XElement[] = []
    let xElements = this.xelements
    for (let childIndex = 0; childIndex < xElements.length; childIndex += 1) {
      let xel = xElements[childIndex]
      if (xel.stage) {
        // 已经经过筛选了
        let children = xel.stage.getAll(callback)
        for (let i = 0, j = list.length; i < children.length; i += 1, j += 1) {
          list[j] = children[i]
        }
      } else {
        callback && callback(xel)
        if (!xel.ignored) {
          list.push(xel)
        } 
      }
    }

    return list
  }
}

export default Stage
