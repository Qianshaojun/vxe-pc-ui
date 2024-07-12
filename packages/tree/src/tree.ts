import { defineComponent, ref, h, reactive, PropType, computed, VNode, createCommentVNode, watch, onUnmounted, nextTick } from 'vue'
import { createEvent, getIcon, getConfig, useSize } from '../../ui'
import XEUtils from 'xe-utils'
import { getSlotVNs } from '../../ui/src/vn'
import { toCssUnit } from '../../ui/src/dom'
import VxeLoadingComponent from '../../loading/src/loading'

import type { TreeReactData, VxeTreeEmits, VxeTreePropTypes, TreeInternalData, TreePrivateRef, VxeTreeDefines, VxeTreePrivateComputed, TreePrivateMethods, TreeMethods, ValueOf, VxeTreeConstructor, VxeTreePrivateMethods } from '../../../types'

/**
 * 生成节点的唯一主键
 */
function getNodeUniqueId () {
  return XEUtils.uniqueId('node_')
}

export default defineComponent({
  name: 'VxeTree',
  props: {
    data: Array as PropType<VxeTreePropTypes.Data>,
    height: [String, Number] as PropType<VxeTreePropTypes.Height>,
    minHeight: {
      type: [String, Number] as PropType<VxeTreePropTypes.MinHeight>,
      default: () => getConfig().tree.minHeight
    },
    loading: Boolean as PropType<VxeTreePropTypes.Loading>,
    loadingConfig: Object as PropType<VxeTreePropTypes.LoadingConfig>,
    accordion: {
      type: Boolean as PropType<VxeTreePropTypes.Accordion>,
      default: () => getConfig().tree.accordion
    },
    childrenField: {
      type: String as PropType<VxeTreePropTypes.ChildrenField>,
      default: () => getConfig().tree.childrenField
    },
    keyField: {
      type: String as PropType<VxeTreePropTypes.KeyField>,
      default: () => getConfig().tree.keyField
    },
    parentField: {
      type: String as PropType<VxeTreePropTypes.ParentField>,
      default: () => getConfig().tree.parentField
    },
    titleField: {
      type: String as PropType<VxeTreePropTypes.TitleField>,
      default: () => getConfig().tree.titleField
    },
    hasChildField: {
      type: String as PropType<VxeTreePropTypes.HasChildField>,
      default: () => getConfig().tree.hasChildField
    },
    mapChildrenField: {
      type: String as PropType<VxeTreePropTypes.MapChildrenField>,
      default: () => getConfig().tree.mapChildrenField
    },
    transform: Boolean as PropType<VxeTreePropTypes.Transform>,
    isCurrent: {
      type: Boolean as PropType<VxeTreePropTypes.IsCurrent>,
      default: () => getConfig().tree.isCurrent
    },
    isHover: {
      type: Boolean as PropType<VxeTreePropTypes.IsHover>,
      default: () => getConfig().tree.isHover
    },
    showLine: {
      type: Boolean as PropType<VxeTreePropTypes.ShowLine>,
      default: () => getConfig().tree.showLine
    },
    trigger: String as PropType<VxeTreePropTypes.Trigger>,
    indent: {
      type: Number as PropType<VxeTreePropTypes.Indent>,
      default: () => getConfig().tree.indent
    },
    showRadio: {
      type: Boolean as PropType<VxeTreePropTypes.ShowRadio>,
      default: () => getConfig().tree.showRadio
    },
    checkNodeKey: {
      type: [String, Number] as PropType<VxeTreePropTypes.CheckNodeKey>,
      default: () => getConfig().tree.checkNodeKey
    },
    radioConfig: {
      type: Object as PropType<VxeTreePropTypes.RadioConfig>,
      default: () => XEUtils.clone(getConfig().tree.radioConfig, true)
    },
    showCheckbox: {
      type: Boolean as PropType<VxeTreePropTypes.ShowCheckbox>,
      default: () => getConfig().tree.showCheckbox
    },
    checkNodeKeys: {
      type: Array as PropType<VxeTreePropTypes.CheckNodeKeys>,
      default: () => getConfig().tree.checkNodeKeys
    },
    checkboxConfig: {
      type: Object as PropType<VxeTreePropTypes.CheckboxConfig>,
      default: () => XEUtils.clone(getConfig().tree.checkboxConfig, true)
    },
    lazy: Boolean as PropType<VxeTreePropTypes.Lazy>,
    toggleMethod: Function as PropType<VxeTreePropTypes.ToggleMethod>,
    loadMethod: Function as PropType<VxeTreePropTypes.LoadMethod>,
    showIcon: {
      type: Boolean as PropType<VxeTreePropTypes.ShowIcon>,
      default: true
    },
    iconOpen: {
      type: String as PropType<VxeTreePropTypes.IconOpen>,
      default: () => getConfig().tree.iconOpen
    },
    iconClose: {
      type: String as PropType<VxeTreePropTypes.IconClose>,
      default: () => getConfig().tree.iconClose
    },
    iconLoaded: {
      type: String as PropType<VxeTreePropTypes.IconLoaded>,
      default: () => getConfig().tree.iconLoaded
    },
    size: { type: String as PropType<VxeTreePropTypes.Size>, default: () => getConfig().tree.size || getConfig().size }
  },
  emits: [
    'update:modelValue',
    'update:checkNodeKey',
    'update:checkNodeKeys',
    'node-click',
    'node-dblclick',
    'radio-change',
    'checkbox-change'
  ] as VxeTreeEmits,
  setup (props, context) {
    const { emit, slots } = context

    const xID = XEUtils.uniqueId()

    const { computeSize } = useSize(props)

    const refElem = ref<HTMLDivElement>()

    const reactData = reactive<TreeReactData>({
      currentNode: null,
      nodeMaps: {},
      selectRadioKey: props.checkNodeKey,
      treeList: [],
      treeExpandedMaps: {},
      treeExpandLazyLoadedMaps: {},
      selectCheckboxMaps: {},
      indeterminateCheckboxMaps: {}
    })

    const internalData: TreeInternalData = {
    }

    const refMaps: TreePrivateRef = {
      refElem
    }

    const computeTitleField = computed(() => {
      return props.titleField || 'title'
    })

    const computeKeyField = computed(() => {
      return props.keyField || 'id'
    })

    const computeParentField = computed(() => {
      return props.parentField || 'parentId'
    })

    const computeChildrenField = computed(() => {
      return props.childrenField || 'children'
    })

    const computeHasChildField = computed(() => {
      return props.hasChildField || 'hasChild'
    })

    const computeMapChildrenField = computed(() => {
      return props.mapChildrenField || 'children'
    })

    const computeRadioOpts = computed(() => {
      return Object.assign({ showIcon: true }, props.radioConfig)
    })

    const computeCheckboxOpts = computed(() => {
      return Object.assign({ showIcon: true }, props.checkboxConfig)
    })

    const computeLoadingOpts = computed(() => {
      return Object.assign({}, getConfig().tree.loadingConfig, props.loadingConfig)
    })

    const computeTreeStyle = computed(() => {
      const { height, minHeight } = props
      const stys: Record<string, string> = {}
      if (height) {
        stys.height = toCssUnit(height)
      }
      if (minHeight) {
        stys.minHeight = toCssUnit(minHeight)
      }
      return stys
    })

    const computeMaps: VxeTreePrivateComputed = {
    }

    const $xeTree = {
      xID,
      props,
      context,
      internalData,
      reactData,

      getRefMaps: () => refMaps,
      getComputeMaps: () => computeMaps
    } as unknown as VxeTreeConstructor & VxeTreePrivateMethods

    const getNodeid = (node: any) => {
      const keyField = computeKeyField.value
      const nodeid = XEUtils.get(node, keyField)
      return XEUtils.eqNull(nodeid) ? '' : encodeURIComponent(nodeid)
    }

    const isExpandByNode = (node: any) => {
      const { treeExpandedMaps } = reactData
      const nodeid = getNodeid(node)
      return !!treeExpandedMaps[nodeid]
    }

    const isCheckedByRadioNodeid = (nodeid: any) => {
      const { selectRadioKey } = reactData
      return selectRadioKey === nodeid
    }

    const isCheckedByRadioNode = (node: any) => {
      return isCheckedByRadioNodeid(getNodeid(node))
    }

    const isCheckedByCheckboxNodeid = (nodeid: any) => {
      const { selectCheckboxMaps } = reactData
      return !!selectCheckboxMaps[nodeid]
    }

    const isCheckedByCheckboxNode = (node: any) => {
      return isCheckedByCheckboxNodeid(getNodeid(node))
    }

    const isIndeterminateByCheckboxNodeid = (nodeid: any) => {
      const { indeterminateCheckboxMaps } = reactData
      return !!indeterminateCheckboxMaps[nodeid]
    }

    const isIndeterminateByCheckboxNode = (node: any) => {
      return isIndeterminateByCheckboxNodeid(getNodeid(node))
    }

    const emitCheckboxMode = (value: VxeTreePropTypes.CheckNodeKeys) => {
      emit('update:checkNodeKeys', value)
    }

    const emitRadioMode = (value: VxeTreePropTypes.CheckNodeKey) => {
      emit('update:checkNodeKey', value)
    }

    const updateCheckboxChecked = (nodeKeys: VxeTreePropTypes.CheckNodeKeys) => {
      const selectKeyMaps: Record<string, boolean> = {}
      if (nodeKeys) {
        nodeKeys.forEach((key) => {
          selectKeyMaps[key] = true
        })
      }
      reactData.selectCheckboxMaps = selectKeyMaps
    }

    const handleSetExpand = (nodeid: string, expanded: boolean, expandedMaps: Record<string, boolean>) => {
      if (expanded) {
        if (expandedMaps[nodeid]) {
          expandedMaps[nodeid] = true
        }
      } else {
        if (expandedMaps[nodeid]) {
          delete expandedMaps[nodeid]
        }
      }
    }

    const dispatchEvent = (type: ValueOf<VxeTreeEmits>, params: Record<string, any>, evnt: Event | null) => {
      emit(type, createEvent(evnt, { $tree: $xeTree }, params))
    }

    const createNode = (records: any[]) => {
      const keyField = computeKeyField.value
      return Promise.resolve(
        records.map(obj => {
          const item = { ...obj }
          let nodeid = getNodeid(item)
          if (!nodeid) {
            nodeid = getNodeUniqueId()
            XEUtils.set(item, keyField, nodeid)
          }
          return item
        })
      )
    }

    const treeMethods: TreeMethods = {
      dispatchEvent,
      clearExpand () {
        reactData.treeExpandedMaps = {}
        return nextTick()
      },
      setExpandByNodeid (nodeids, expanded) {
        const expandedMaps: Record<string, boolean> = Object.assign(reactData.treeExpandedMaps)
        if (nodeids) {
          if (!XEUtils.isArray(nodeids)) {
            nodeids = [nodeids]
          }
          nodeids.forEach((nodeid: string) => {
            handleSetExpand(nodeid, expanded, expandedMaps)
          })
          reactData.treeExpandedMaps = expandedMaps
        }
        return nextTick()
      },
      setExpand (nodes, expanded) {
        const expandedMaps: Record<string, boolean> = Object.assign(reactData.treeExpandedMaps)
        if (nodes) {
          if (!XEUtils.isArray(nodes)) {
            nodes = [nodes]
          }
          nodes.forEach((node: any) => {
            const nodeid = getNodeid(node)
            handleSetExpand(nodeid, expanded, expandedMaps)
          })
          reactData.treeExpandedMaps = expandedMaps
        }
        return nextTick()
      },
      toggleExpandByNodeid (nodeids) {
        const expandedMaps: Record<string, boolean> = Object.assign(reactData.treeExpandedMaps)
        if (nodeids) {
          if (!XEUtils.isArray(nodeids)) {
            nodeids = [nodeids]
          }
          nodeids.forEach((nodeid: string) => {
            handleSetExpand(nodeid, !expandedMaps[nodeid], expandedMaps)
          })
          reactData.treeExpandedMaps = expandedMaps
        }
        return nextTick()
      },
      toggleExpand (nodes) {
        const expandedMaps: Record<string, boolean> = Object.assign(reactData.treeExpandedMaps)
        if (nodes) {
          if (!XEUtils.isArray(nodes)) {
            nodes = [nodes]
          }
          nodes.forEach((node: any) => {
            const nodeid = getNodeid(node)
            handleSetExpand(nodeid, !expandedMaps[nodeid], expandedMaps)
          })
          reactData.treeExpandedMaps = expandedMaps
        }
        return nextTick()
      },
      setAllExpand () {
        const expandedMaps: Record<string, boolean> = Object.assign(reactData.treeExpandedMaps)
        const childrenField = computeChildrenField.value
        XEUtils.eachTree(reactData.treeList, (node) => {
          const nodeid = getNodeid(node)
          expandedMaps[nodeid] = true
        }, { children: childrenField })
        reactData.treeExpandedMaps = expandedMaps
        return nextTick()
      },
      /**
       * 用于树结构，给行数据加载子节点
       */
      loadChildren (node, childRecords) {
        const { transform } = props
        const { nodeMaps } = reactData
        const childrenField = computeChildrenField.value
        const mapChildrenField = computeMapChildrenField.value
        const parentNodeItem = nodeMaps[getNodeid(node)]
        const parentLevel = parentNodeItem ? parentNodeItem.level : 0
        const parentNodes = parentNodeItem ? parentNodeItem.nodes : []
        return createNode(childRecords).then((nodeList) => {
          XEUtils.eachTree(nodeList, (childRow, index, items, path, parent, nodes) => {
            const itemNodeId = getNodeid(childRow)
            nodeMaps[itemNodeId] = {
              item: node,
              itemIndex: -1,
              items,
              parent: parent || parentNodeItem.item,
              nodes: parentNodes.concat(nodes),
              level: parentLevel + nodes.length,
              lineCount: 0,
              treeLoaded: false
            }
          }, { children: childrenField })
          node[childrenField] = nodeList
          if (transform) {
            node[mapChildrenField] = nodeList
          }
          updateNodeLine(node)
          return nodeList
        })
      },
      isExpandByNode,
      isCheckedByRadioNodeid,
      isCheckedByRadioNode,
      isCheckedByCheckboxNodeid,
      isIndeterminateByCheckboxNode,
      isCheckedByCheckboxNode
    }

    const cacheNodeMap = () => {
      const { treeList } = reactData
      const keyField = computeKeyField.value
      const childrenField = computeChildrenField.value
      const keyMaps: Record<string, VxeTreeDefines.NodeCacheItem> = {}
      XEUtils.eachTree(treeList, (item, itemIndex, items, path, parent, nodes) => {
        let nodeid = getNodeid(item)
        if (!nodeid) {
          nodeid = getNodeUniqueId()
          XEUtils.set(item, keyField, nodeid)
        }
        keyMaps[nodeid] = {
          item,
          itemIndex,
          items,
          parent,
          nodes,
          level: nodes.length,
          lineCount: 0,
          treeLoaded: false
        }
      }, { children: childrenField })
      reactData.nodeMaps = keyMaps
    }

    const updateData = (list: any[]) => {
      const { transform } = props
      const keyField = computeKeyField.value
      const parentField = computeParentField.value
      const mapChildrenField = computeMapChildrenField.value
      if (transform) {
        reactData.treeList = XEUtils.toArrayTree(list, { key: keyField, parentKey: parentField, mapChildren: mapChildrenField })
      } else {
        reactData.treeList = list ? list.slice(0) : []
      }
      cacheNodeMap()
    }

    const handleCountLine = (item: any, isRoot: boolean, nodeItem: VxeTreeDefines.NodeCacheItem) => {
      const { treeExpandedMaps } = reactData
      const childrenField = computeChildrenField.value
      const nodeid = getNodeid(item)
      nodeItem.lineCount++
      if (treeExpandedMaps[nodeid]) {
        XEUtils.arrayEach(item[childrenField], (childItem, childIndex, childList) => {
          if (!isRoot || childIndex < childList.length - 1) {
            handleCountLine(childItem, false, nodeItem)
          }
        })
      }
    }

    const updateNodeLine = (node: any) => {
      const { nodeMaps } = reactData
      if (node) {
        const nodeid = getNodeid(node)
        const nodeItem = nodeMaps[nodeid]
        if (nodeItem) {
          XEUtils.lastArrayEach(nodeItem.nodes, childItem => {
            const nodeid = getNodeid(childItem)
            const nodeItem = nodeMaps[nodeid]
            if (nodeItem) {
              nodeItem.lineCount = 0
              handleCountLine(childItem, true, nodeItem)
            }
          })
        }
      }
    }

    const handleNodeClickEvent = (evnt: MouseEvent, node: any) => {
      const { showRadio, showCheckbox, trigger, isCurrent } = props
      const radioOpts = computeRadioOpts.value
      const checkboxOpts = computeCheckboxOpts.value
      let triggerRadio = false
      let triggerCheckbox = false
      let triggerExpand = false
      if (isCurrent) {
        reactData.currentNode = node
      } else if (reactData.currentNode) {
        reactData.currentNode = null
      }
      if (trigger === 'node') {
        triggerExpand = true
        toggleExpandEvent(evnt, node)
      }
      if (showRadio && radioOpts.trigger === 'node') {
        triggerRadio = true
        changeRadioEvent(evnt, node)
      }
      if (showCheckbox && checkboxOpts.trigger === 'node') {
        triggerCheckbox = true
        changeCheckboxEvent(evnt, node)
      }
      dispatchEvent('node-click', { node, triggerRadio, triggerCheckbox, triggerExpand }, evnt)
    }

    const handleNodeDblclickEvent = (evnt: MouseEvent, node: any) => {
      dispatchEvent('node-dblclick', { node }, evnt)
    }

    const handleAsyncTreeExpandChilds = (node: any): Promise<void> => {
      const checkboxOpts = computeCheckboxOpts.value
      const { loadMethod } = props
      const { checkStrictly } = checkboxOpts
      return new Promise(resolve => {
        if (loadMethod) {
          const { treeExpandLazyLoadedMaps } = reactData
          const { nodeMaps } = reactData
          const nodeid = getNodeid(node)
          const nodeItem = nodeMaps[nodeid]
          treeExpandLazyLoadedMaps[nodeid] = true
          Promise.resolve(
            loadMethod({ $tree: $xeTree, node })
          ).then((childRecords: any) => {
            nodeItem.treeLoaded = true
            if (treeExpandLazyLoadedMaps[nodeid]) {
              delete treeExpandLazyLoadedMaps[nodeid]
            }
            if (!XEUtils.isArray(childRecords)) {
              childRecords = []
            }
            if (childRecords) {
              return treeMethods.loadChildren(node, childRecords).then(childRows => {
                const { treeExpandedMaps } = reactData
                if (childRows.length && !treeExpandedMaps[nodeid]) {
                  treeExpandedMaps[nodeid] = true
                }
                // 如果当前节点已选中，则展开后子节点也被选中
                if (!checkStrictly && treeMethods.isCheckedByCheckboxNodeid(node)) {
                  // handleCheckedCheckboxRow(childRows, true)
                }
                return nextTick()
              })
            }
          }).catch(() => {
            const { treeExpandLazyLoadedMaps } = reactData
            nodeItem.treeLoaded = false
            if (treeExpandLazyLoadedMaps[nodeid]) {
              delete treeExpandLazyLoadedMaps[nodeid]
            }
          }).finally(() => {
            return nextTick()
          })
        } else {
          resolve()
        }
      })
    }

    /**
     * 展开与收起树节点
     * @param nodeList
     * @param expanded
     * @returns
     */
    const handleBaseTreeExpand = (nodeList: any[], expanded: boolean) => {
      const { lazy, accordion, toggleMethod } = props
      const { nodeMaps, treeExpandLazyLoadedMaps } = reactData
      const tempExpandedMaps = Object.assign({}, reactData.treeExpandedMaps)
      const childrenField = computeChildrenField.value
      const hasChildField = computeHasChildField.value
      const result: any[] = []
      let validNodes = toggleMethod ? nodeList.filter((node: any) => toggleMethod({ $tree: $xeTree, expanded, node })) : nodeList
      if (accordion) {
        validNodes = validNodes.length ? [validNodes[validNodes.length - 1]] : []
        // 同一级只能展开一个
        const nodeid = getNodeid(validNodes[0])
        const nodeItem = nodeMaps[nodeid]
        if (nodeItem) {
          nodeItem.items.forEach(item => {
            const itemNodeId = getNodeid(item)
            if (tempExpandedMaps[itemNodeId]) {
              delete tempExpandedMaps[itemNodeId]
            }
          })
        }
      }
      if (expanded) {
        validNodes.forEach((item) => {
          const itemNodeId = getNodeid(item)
          if (!tempExpandedMaps[itemNodeId]) {
            const nodeItem = nodeMaps[itemNodeId]
            const isLoad = lazy && item[hasChildField] && !nodeItem.treeLoaded && !treeExpandLazyLoadedMaps[itemNodeId]
            // 是否使用懒加载
            if (isLoad) {
              result.push(handleAsyncTreeExpandChilds(item))
            } else {
              if (item[childrenField] && item[childrenField].length) {
                tempExpandedMaps[itemNodeId] = true
                updateNodeLine(item)
              }
            }
          }
        })
      } else {
        validNodes.forEach(item => {
          const itemNodeId = getNodeid(item)
          if (tempExpandedMaps[itemNodeId]) {
            delete tempExpandedMaps[itemNodeId]
          }
        })
      }
      reactData.treeExpandedMaps = tempExpandedMaps
      return Promise.all(result)
    }

    const toggleExpandEvent = (evnt: MouseEvent, node: any) => {
      const { lazy } = props
      const { treeExpandedMaps, treeExpandLazyLoadedMaps } = reactData
      const nodeid = getNodeid(node)
      const expanded = !treeExpandedMaps[nodeid]
      evnt.stopPropagation()
      if (!lazy || !treeExpandLazyLoadedMaps[nodeid]) {
        handleBaseTreeExpand([node], expanded)
      }
    }

    const handleNodeCheckboxStatus = (node: any, selectKeyMaps: Record<string, boolean>, indeterminateMaps: Record<string, boolean>) => {
      const childrenField = computeChildrenField.value
      const childList: any[] = XEUtils.get(node, childrenField)
      const nodeid = getNodeid(node)
      if (childList && childList.length) {
        let checkSome = false
        let checkSize = 0
        childList.forEach(childNode => {
          const childNodeid = getNodeid(childNode)
          const isChecked = selectKeyMaps[childNodeid]
          if (isChecked || indeterminateMaps[childNodeid]) {
            if (isChecked) {
              checkSize++
            }
            checkSome = true
          }
        })
        const checkAll = checkSize === childList.length
        if (checkAll) {
          if (!selectKeyMaps[nodeid]) {
            selectKeyMaps[nodeid] = true
          }
          if (indeterminateMaps[nodeid]) {
            delete indeterminateMaps[nodeid]
          }
        } else {
          if (selectKeyMaps[nodeid]) {
            delete selectKeyMaps[nodeid]
          }
          indeterminateMaps[nodeid] = checkSome
        }
      } else {
        if (indeterminateMaps[nodeid]) {
          delete indeterminateMaps[nodeid]
        }
      }
    }

    const updateCheckboxStatus = () => {
      const { treeList } = reactData
      const childrenField = computeChildrenField.value
      const checkboxOpts = computeCheckboxOpts.value
      const { checkStrictly } = checkboxOpts
      if (!checkStrictly) {
        const selectKeyMaps = Object.assign({}, reactData.selectCheckboxMaps)
        const indeterminateMaps: Record<string, boolean> = {}
        XEUtils.eachTree(treeList, (node, index, items, path, parent, nodes) => {
          const childList: any[] = XEUtils.get(node, childrenField)
          if (!childList || !childList.length) {
            handleNodeCheckboxStatus(node, selectKeyMaps, indeterminateMaps)
          }
          if (index === items.length - 1) {
            for (let len = nodes.length - 2; len >= 0; len--) {
              const parentItem = nodes[len]
              handleNodeCheckboxStatus(parentItem, selectKeyMaps, indeterminateMaps)
            }
          }
        })
        reactData.selectCheckboxMaps = selectKeyMaps
        reactData.indeterminateCheckboxMaps = indeterminateMaps
      }
    }

    const changeCheckboxEvent = (evnt: MouseEvent, node: any) => {
      evnt.stopPropagation()
      const checkboxOpts = computeCheckboxOpts.value
      const { checkStrictly } = checkboxOpts
      const selectKeyMaps = Object.assign({}, reactData.selectCheckboxMaps)
      const childrenField = computeChildrenField.value
      const nodeid = getNodeid(node)
      let isChecked = false
      if (selectKeyMaps[nodeid]) {
        delete selectKeyMaps[nodeid]
      } else {
        isChecked = true
        selectKeyMaps[nodeid] = isChecked
      }
      if (!checkStrictly) {
        XEUtils.eachTree(XEUtils.get(node, childrenField), (childNode) => {
          const childNodeid = getNodeid(childNode)
          if (isChecked) {
            if (!selectKeyMaps[childNodeid]) {
              selectKeyMaps[childNodeid] = true
            }
          } else {
            if (selectKeyMaps[childNodeid]) {
              delete selectKeyMaps[childNodeid]
            }
          }
        }, { children: childrenField })
      }
      reactData.selectCheckboxMaps = selectKeyMaps
      updateCheckboxStatus()
      const value = Object.keys(reactData.selectCheckboxMaps)
      emitCheckboxMode(value)
      dispatchEvent('checkbox-change', { value }, evnt)
    }

    const changeRadioEvent = (evnt: MouseEvent, node: any) => {
      evnt.stopPropagation()
      const value = getNodeid(node)
      reactData.selectRadioKey = value
      emitRadioMode(value)
      dispatchEvent('radio-change', { value }, evnt)
    }

    const treePrivateMethods: TreePrivateMethods = {
    }

    Object.assign($xeTree, treeMethods, treePrivateMethods)

    const renderRadio = (node: any, nodeid: string, isChecked: boolean) => {
      const { showRadio } = props
      const radioOpts = computeRadioOpts.value
      const { showIcon, checkMethod, visibleMethod } = radioOpts
      const isVisible = !visibleMethod || visibleMethod({ node })
      let isDisabled = !!checkMethod
      if (showRadio && showIcon && isVisible) {
        if (checkMethod) {
          isDisabled = !checkMethod({ node })
        }
        return h('div', {
          class: ['vxe-tree--radio-option', {
            'is--checked': isChecked,
            'is--disabled': isDisabled
          }],
          onClick: (evnt) => {
            if (!isDisabled) {
              changeRadioEvent(evnt, node)
            }
          }
        }, [
          h('span', {
            class: ['vxe-radio--icon', isChecked ? getIcon().RADIO_CHECKED : getIcon().RADIO_UNCHECKED]
          })
        ])
      }
      return createCommentVNode()
    }

    const renderCheckbox = (node: any, nodeid: string, isChecked: boolean) => {
      const { showCheckbox } = props
      const checkboxOpts = computeCheckboxOpts.value
      const { showIcon, checkMethod, visibleMethod } = checkboxOpts
      const isIndeterminate = isIndeterminateByCheckboxNodeid(nodeid)
      const isVisible = !visibleMethod || visibleMethod({ node })
      let isDisabled = !!checkMethod
      if (showCheckbox && showIcon && isVisible) {
        if (checkMethod) {
          isDisabled = !checkMethod({ node })
        }
        return h('div', {
          class: ['vxe-tree--checkbox-option', {
            'is--checked': isChecked,
            'is--indeterminate': isIndeterminate,
            'is--disabled': isDisabled
          }],
          onClick: (evnt) => {
            if (!isDisabled) {
              changeCheckboxEvent(evnt, node)
            }
          }
        }, [
          h('span', {
            class: ['vxe-checkbox--icon', isIndeterminate ? getIcon().CHECKBOX_INDETERMINATE : (isChecked ? getIcon().CHECKBOX_CHECKED : getIcon().CHECKBOX_UNCHECKED)]
          })
        ])
      }
      return createCommentVNode()
    }

    const renderNode = (node: any): VNode => {
      const { lazy, showRadio, showCheckbox, showLine, indent, iconOpen, iconClose, iconLoaded, showIcon } = props
      const { nodeMaps, treeExpandedMaps, currentNode, selectRadioKey, treeExpandLazyLoadedMaps } = reactData
      const childrenField = computeChildrenField.value
      const titleField = computeTitleField.value
      const hasChildField = computeHasChildField.value
      const childList: any[] = XEUtils.get(node, childrenField)
      const hasChild = childList && childList.length
      const titleSlot = slots.title
      const extraSlot = slots.extra
      const nodeid = getNodeid(node)
      const isExpand = treeExpandedMaps[nodeid]
      const nodeItem = nodeMaps[nodeid]
      const nodeValue = XEUtils.get(node, titleField)
      const childVns: VNode[] = []
      if (hasChild && treeExpandedMaps[nodeid]) {
        if (showLine) {
          childVns.push(
            h('div', {
              key: 'line',
              class: 'vxe-tree--node-child-line',
              style: {
                height: `calc(${nodeItem.lineCount} * var(--vxe-ui-tree-node-height) - var(--vxe-ui-tree-node-height) / 2)`,
                left: `${(nodeItem.level + 1) * (indent || 1)}px`
              }
            })
          )
        }
        childList.forEach(childItem => {
          childVns.push(renderNode(childItem))
        })
      }

      let isRadioChecked = false
      if (showRadio) {
        // eslint-disable-next-line eqeqeq
        isRadioChecked = nodeid == selectRadioKey
      }

      let isCheckboxChecked = false
      if (showCheckbox) {
        isCheckboxChecked = isCheckedByCheckboxNodeid(nodeid)
      }

      let hasLazyChilds = false
      let isLazyLoading = false
      let isLazyLoaded = false
      if (lazy) {
        isLazyLoading = !!treeExpandLazyLoadedMaps[nodeid]
        hasLazyChilds = node[hasChildField]
        isLazyLoaded = !!nodeItem.treeLoaded
      }

      return h('div', {
        class: ['vxe-tree--node-wrapper', `node--level-${nodeItem.level}`],
        nodeid
      }, [
        h('div', {
          class: ['vxe-tree--node-item', {
            'is--current': currentNode && nodeid === getNodeid(currentNode),
            'is-radio--checked': isRadioChecked,
            'is-checkbox--checked': isCheckboxChecked
          }],
          style: {
            paddingLeft: `${(nodeItem.level - 1) * (indent || 1)}px`
          },
          onClick (evnt) {
            handleNodeClickEvent(evnt, node)
          },
          onDblclick (evnt) {
            handleNodeDblclickEvent(evnt, node)
          }
        }, [
          showIcon || showLine
            ? h('div', {
              class: 'vxe-tree--node-item-switcher'
            }, showIcon && (lazy ? (isLazyLoaded ? hasChild : hasLazyChilds) : hasChild)
              ? [
                  h('div', {
                    class: 'vxe-tree--node-item-icon',
                    onClick (evnt) {
                      toggleExpandEvent(evnt, node)
                    }
                  }, [
                    h('i', {
                      class: isLazyLoading ? (iconLoaded || getIcon().TREE_NODE_LOADED) : (isExpand ? (iconOpen || getIcon().TREE_NODE_OPEN) : (iconClose || getIcon().TREE_NODE_CLOSE))
                    })
                  ])
                ]
              : [])
            : createCommentVNode(),
          renderRadio(node, nodeid, isRadioChecked),
          renderCheckbox(node, nodeid, isCheckboxChecked),
          h('div', {
            class: 'vxe-tree--node-item-inner'
          }, [
            h('div', {
              class: 'vxe-tree--node-item-title'
            }, titleSlot ? getSlotVNs(titleSlot({ node })) : `${nodeValue}`),
            extraSlot
              ? h('div', {
                class: 'vxe-tree--node-item-extra'
              }, getSlotVNs(extraSlot({ node })))
              : createCommentVNode()
          ])
        ]),
        hasChild && treeExpandedMaps[nodeid]
          ? h('div', {
            class: 'vxe-tree--node-child-wrapper'
          }, childVns)
          : createCommentVNode()
      ])
    }

    const renderNodeList = () => {
      const { treeList } = reactData
      return h('div', {
        class: 'vxe-tree--node-list-wrapper'
      }, treeList.map(node => renderNode(node)))
    }

    const renderVN = () => {
      const { loading, trigger, showLine, isHover } = props
      const vSize = computeSize.value
      const radioOpts = computeRadioOpts.value
      const checkboxOpts = computeCheckboxOpts.value
      const treeStyle = computeTreeStyle.value
      const loadingOpts = computeLoadingOpts.value
      const loadingSlot = slots.loading
      return h('div', {
        ref: refElem,
        class: ['vxe-tree', {
          [`size--${vSize}`]: vSize,
          'show--line': showLine,
          'checkbox--highlight': checkboxOpts.highlight,
          'radio--highlight': radioOpts.highlight,
          'node--hover': isHover,
          'node--trigger': trigger === 'node',
          'is--loading': loading
        }],
        style: treeStyle
      }, [
        renderNodeList(),
        /**
         * 加载中
         */
        h(VxeLoadingComponent, {
          class: 'vxe-tree--loading',
          modelValue: loading,
          icon: loadingOpts.icon,
          text: loadingOpts.text
        }, loadingSlot
          ? {
              default: () => loadingSlot({ $tree: $xeTree })
            }
          : {})
      ])
    }

    $xeTree.renderVN = renderVN

    const dataFlag = ref(0)
    watch(() => props.data ? props.data.length : 0, () => {
      dataFlag.value++
    })
    watch(() => props.data, () => {
      dataFlag.value++
    })
    watch(dataFlag, () => {
      updateData(props.data || [])
    })

    watch(() => props.checkNodeKey, (val) => {
      reactData.selectRadioKey = val
    })

    const checkboxFlag = ref(0)
    watch(() => props.checkNodeKeys ? props.checkNodeKeys.length : 0, () => {
      checkboxFlag.value++
    })
    watch(() => props.checkNodeKeys, () => {
      checkboxFlag.value++
    })
    watch(checkboxFlag, () => {
      updateCheckboxChecked(props.checkNodeKeys || [])
    })

    onUnmounted(() => {
      reactData.treeList = []
      reactData.treeExpandedMaps = {}
      reactData.nodeMaps = {}
    })

    updateData(props.data || [])
    updateCheckboxChecked(props.checkNodeKeys || [])

    return $xeTree
  },
  render () {
    return this.renderVN()
  }
})
