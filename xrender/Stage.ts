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
    // zIndex高的在后
    // zLevel高的在后，其它按加入次序排列
    // 即，最上层的就在最后面，方便事件检测时能倒序遍历
    // 将group排在最前面
    return this.expandXElements(callback).sort((a, b) => {
      let isGroup = a.name === 'group'
      let zIndex = a.zIndex - b.zIndex
      return !isGroup
             ? zIndex === 0 ? a.zLevel - b.zLevel : zIndex
             : -1 
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
        // 将自身也加入，为了能够触发事件
        children.push(xel)
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
