import { defineComponent, ref, h, reactive, PropType, provide, computed, createCommentVNode, watch, nextTick, onMounted } from 'vue'
import XEUtils from 'xe-utils'
import VxeTabPaneComponent from './tab-pane'
import { getSlotVNs } from '../../ui/src/vn'

import { VxeTabsPropTypes, VxeTabPaneProps, TabsReactData, TabsPrivateRef, VxeTabsPrivateComputed, VxeTabsConstructor, VxeTabsPrivateMethods, VxeTabPaneDefines } from '../../../types'

export default defineComponent({
  name: 'VxeTabs',
  props: {
    modelValue: [String, Number, Boolean] as PropType<VxeTabsPropTypes.ModelValue>,
    options: Array as PropType<VxeTabsPropTypes.Options>,
    destroyOnClose: Boolean as PropType<VxeTabsPropTypes.DestroyOnClose>,
    type: String as PropType<VxeTabsPropTypes.Type>
  },
  emits: [
    'update:modelValue',
    'click',
    'change',
    'load'
  ],
  setup (props, context) {
    const { slots, emit } = context

    const xID = XEUtils.uniqueId()

    const refElem = ref<HTMLDivElement>()
    const refHeaderElem = ref<HTMLDivElement>()

    const reactData = reactive<TabsReactData>({
      staticTabs: [],
      activeName: props.modelValue,
      initNames: props.modelValue ? [props.modelValue] : [],
      lintLeft: 0,
      lintWidth: 0
    })

    const refMaps: TabsPrivateRef = {
      refElem
    }

    const computeActiveOptionTab = computed(() => {
      const { options } = props
      const { activeName } = reactData
      return options ? options.find(item => item.name === activeName) : null
    })

    const computeActiveDefaultTab = computed(() => {
      const { staticTabs, activeName } = reactData
      return staticTabs.find(item => item.name === activeName)
    })

    const computeMaps: VxeTabsPrivateComputed = {
    }

    const $xeTabs = {
      xID,
      props,
      context,
      reactData,

      getRefMaps: () => refMaps,
      getComputeMaps: () => computeMaps
    } as unknown as VxeTabsConstructor & VxeTabsPrivateMethods

    const callSlot = (slotFunc: any, params: any) => {
      if (slotFunc) {
        if (XEUtils.isString(slotFunc)) {
          slotFunc = slots[slotFunc] || null
        }
        if (XEUtils.isFunction(slotFunc)) {
          return getSlotVNs(slotFunc(params))
        }
      }
      return []
    }

    const updateLineStyle = () => {
      nextTick(() => {
        const { type, options } = props
        const { staticTabs, activeName } = reactData
        const headerWrapperEl = refHeaderElem.value
        let lintWidth = 0
        let lintLeft = 0
        if (headerWrapperEl) {
          const index = XEUtils.findIndexOf(staticTabs.length ? staticTabs : options, item => item.name === activeName)
          if (index > -1) {
            const tabEl = headerWrapperEl.children[index] as HTMLDivElement
            const tabWidth = tabEl.clientWidth
            if (type === 'card') {
              lintWidth = tabWidth + 1
              lintLeft = tabEl.offsetLeft
            } else if (type === 'border-card') {
              lintWidth = tabWidth + 1
              lintLeft = tabEl.offsetLeft - 1
            } else if (!type) {
              lintWidth = Math.max(4, Math.floor(tabWidth * 0.6))
              lintLeft = tabEl.offsetLeft + Math.floor((tabWidth - lintWidth) / 2)
            }
          }
        }
        reactData.lintLeft = lintLeft
        reactData.lintWidth = lintWidth
      })
    }

    const clickEvent = (evnt: KeyboardEvent, item: VxeTabPaneProps | VxeTabPaneDefines.TabConfig) => {
      const { initNames, activeName } = reactData
      const { name } = item
      let isInit = false
      const value = name
      if (!initNames.includes(name)) {
        isInit = true
        initNames.push(name)
      }
      reactData.activeName = name
      emit('update:modelValue', value)
      if (name !== activeName) {
        emit('change', { value, name, $event: evnt })
      }
      emit('click', { name, $event: evnt })
      if (isInit) {
        emit('load', { name, $event: evnt })
      }
    }

    const renderTabHeader = (list: VxeTabsPropTypes.Options | VxeTabPaneDefines.TabConfig[]) => {
      const { type } = props
      const { activeName, lintLeft, lintWidth } = reactData
      return h('div', {
        class: 'vxe-tabs-header'
      }, [
        h('div', {
          ref: refHeaderElem,
          class: 'vxe-tabs-header--wrapper'
        }, list.map(item => {
          const { title, name, slots } = item
          const tabSlot = slots ? slots.tab : null
          return h('div', {
            key: name,
            class: ['vxe-tab-header--item', {
              'is--active': activeName === name
            }],
            onClick (evnt: KeyboardEvent) {
              clickEvent(evnt, item)
            }
          }, [
            h('div', {
              class: 'vxe-tab-header--item-name'
            }, tabSlot ? callSlot(tabSlot, { name, title }) : `${title}`)
          ])
        })),
        h('span', {
          class: `vxe-tabs-header--active-line-${type || 'default'}`,
          style: {
            left: `${lintLeft}px`,
            width: `${lintWidth}px`
          }
        })
      ])
    }

    const renderOptionPane = (item: VxeTabPaneProps) => {
      const { initNames, activeName } = reactData
      const { name, slots } = item
      const defaultSlot = slots ? slots.default : null
      return h(VxeTabPaneComponent, item, {
        default () {
          return name && initNames.includes(name)
            ? h('div', {
              key: name,
              class: ['vxe-tab-pane--item', {
                'is--visible': activeName === name
              }]
            }, callSlot(defaultSlot, {}))
            : createCommentVNode()
        }
      })
    }

    const renderOptionContent = (options: VxeTabsPropTypes.Options) => {
      const { destroyOnClose } = props
      const activeOptionTab = computeActiveOptionTab.value
      if (destroyOnClose) {
        return activeOptionTab ? [renderOptionPane(activeOptionTab)] : createCommentVNode()
      }
      return options.map(renderOptionPane)
    }

    const renderDefaultPane = (item: VxeTabPaneDefines.TabConfig) => {
      const { initNames, activeName } = reactData
      const { name, slots } = item
      const defaultSlot = slots ? slots.default : null
      return name && initNames.includes(name)
        ? h('div', {
          key: name,
          class: ['vxe-tab-pane--item', {
            'is--visible': activeName === name
          }]
        }, callSlot(defaultSlot, {}))
        : createCommentVNode()
    }

    const renderDefaultContent = (staticTabs: VxeTabPaneDefines.TabConfig[]) => {
      const { destroyOnClose } = props
      const activeDefaultTab = computeActiveDefaultTab.value
      if (destroyOnClose) {
        return activeDefaultTab ? [renderDefaultPane(activeDefaultTab)] : createCommentVNode()
      }
      return staticTabs.map(renderDefaultPane)
    }

    const renderVN = () => {
      const { type, options } = props
      const { staticTabs } = reactData
      const defaultSlot = slots.default

      return h('div', {
        ref: refElem,
        class: ['vxe-tabs', `vxe-tabs--${type || 'default'}`]
      }, [
        h('div', {
          class: 'vxe-tabs-slots'
        }, defaultSlot ? defaultSlot({}) : []),
        renderTabHeader(defaultSlot ? staticTabs : (options || [])),
        h('div', {
          class: 'vxe-tabs-pane'
        }, defaultSlot ? renderDefaultContent(staticTabs) : renderOptionContent(options || []))
      ])
    }

    watch(() => props.modelValue, (val) => {
      reactData.activeName = val
    })

    watch(() => reactData.activeName, () => {
      updateLineStyle()
    })

    onMounted(() => {
      updateLineStyle()
    })

    $xeTabs.renderVN = renderVN

    provide('$xeTabs', $xeTabs)

    return $xeTabs
  },
  render () {
    return this.renderVN()
  }
})