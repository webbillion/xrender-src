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
  getAll () {
    let xelements = this.updateXElements()

    return xelements
  }
  updateXElements () {
    // zIndex高的在后
    // zLevel高的在后，其它按加入次序排列
    return this.expandXElements().sort((a, b) => {
      let zIndex = a.zIndex - b.zIndex
      return  zIndex === 0 ? a.zLevel - b.zLevel : zIndex
    })
  }
  /**
   * 展开所有元素
   */
  expandXElements () {
    let list: XElement[] = []
    this.xelements.forEach(xel => {
      if (xel.stage) {
        list.push(...xel.stage.getAll())
      } else if (!xel.ignored) {
        list.push(xel)
      }
    })

    return list
  }
}

export default Stage
