import { defineComponent, ref, h, PropType, reactive, provide, watch, nextTick, ComponentOptions } from 'vue'
import { getConfig, getI18n, renderer, createEvent } from '@vxe-ui/core'
import { toCssUnit } from '../../ui/src/dom'
import { FormDesignWidgetInfo, getWidgetGroup, getWidgetCustomGroup } from './widget-info'
import XEUtils from 'xe-utils'
import LayoutWidgetComponent from './layout-widget'
import LayoutViewComponent from './layout-view'
import LayoutSettingComponent from './layout-setting'
import LayoutStyleComponent from './layout-style'
import { getDefaultSettingFormData } from './default-setting-data'

import type { VxeFormDesignDefines, VxeFormDesignPropTypes, VxeFormDesignEmits, FormDesignInternalData, FormDesignReactData, FormDesignPrivateRef, VxeFormDesignPrivateComputed, VxeFormDesignConstructor, VxeFormDesignPrivateMethods, FormDesignMethods, FormDesignPrivateMethods, VxeFormProps } from '../../../types'

export default defineComponent({
  name: 'VxeFormDesign',
  props: {
    size: {
      type: String as PropType<VxeFormDesignPropTypes.Size>,
      default: () => getConfig().formDesign.size
    },
    height: {
      type: [String, Number] as PropType<VxeFormDesignPropTypes.Height>,
      default: () => getConfig().formDesign.height
    },
    widgets: {
      type: Array as PropType<VxeFormDesignPropTypes.Widgets>,
      default: () => XEUtils.clone(getConfig().formDesign.widgets) || []
    },
    showPC: {
      type: Boolean as PropType<VxeFormDesignPropTypes.ShowPC>,
      default: () => getConfig().formDesign.showPC
    },
    showMobile: {
      type: Boolean as PropType<VxeFormDesignPropTypes.ShowMobile>,
      default: () => getConfig().formDesign.showMobile
    },
    formRender: Object as PropType<VxeFormDesignPropTypes.FormRender>
  },
  emits: [
    'click-widget',
    'add-widget',
    'copy-widget',
    'remove-widget'
  ] as VxeFormDesignEmits,
  setup (props, context) {
    const { emit } = context

    const xID = XEUtils.uniqueId()

    const refElem = ref<HTMLDivElement>()
    const refLayoutStyle = ref<any>()

    const reactData = reactive<FormDesignReactData>({
      formData: {} as VxeFormDesignPropTypes.FormData,
      widgetConfigs: [],
      widgetObjList: [],
      dragWidget: null,
      sortWidget: null,
      activeWidget: null
    })

    const internalData = reactive<FormDesignInternalData>({
    })

    const refMaps: FormDesignPrivateRef = {
      refElem
    }

    const computeMaps: VxeFormDesignPrivateComputed = {
    }

    const $xeFormDesign = {
      xID,
      props,
      context,
      reactData,
      internalData,

      getRefMaps: () => refMaps,
      getComputeMaps: () => computeMaps
    } as unknown as VxeFormDesignConstructor & VxeFormDesignPrivateMethods

    const createWidget = (name: string) => {
      return new FormDesignWidgetInfo($xeFormDesign, name, reactData.widgetObjList) as VxeFormDesignDefines.WidgetObjItem
    }

    const createEmptyWidget = () => {
      return new FormDesignWidgetInfo($xeFormDesign, '', reactData.widgetObjList) as VxeFormDesignDefines.WidgetObjItem
    }

    const loadConfig = (config: VxeFormDesignDefines.FormDesignConfig) => {
      if (config) {
        const { formConfig, widgetData } = config
        loadFormConfig(formConfig || {})
        loadWidgetData(widgetData || [])
      }
      return nextTick()
    }

    const getFormConfig = (): VxeFormProps => {
      return Object.assign({}, reactData.formData)
    }

    const loadFormConfig = (formConfig: VxeFormProps) => {
      reactData.formData = Object.assign({}, formConfig)
      return nextTick()
    }

    const getWidgetData = (): VxeFormDesignDefines.WidgetObjItem[] => {
      return reactData.widgetObjList.slice(0)
    }

    const loadWidgetData = (widgetData: VxeFormDesignDefines.WidgetObjItem[]) => {
      reactData.widgetObjList = widgetData ? widgetData.slice(0) : []
      return nextTick()
    }

    const formDesignMethods: FormDesignMethods = {
      dispatchEvent (type, params, evnt) {
        emit(type, createEvent(evnt, { $xeFormDesign }, params))
      },
      createWidget,
      createEmptyWidget,
      getConfig () {
        return {
          formConfig: getFormConfig(),
          formData: reactData.formData,
          widgetData: getWidgetData()
        }
      },
      loadConfig,
      getFormConfig,
      loadFormConfig,
      getWidgetData,
      loadWidgetData,
      refreshPreviewView () {
        const $layoutStyle = refLayoutStyle.value
        if ($layoutStyle) {
          $layoutStyle.updatePreviewView()
        }
        return nextTick()
      }
    }

    const updateWidgetConfigs = () => {
      const { widgets } = props
      const widgetConfs: VxeFormDesignDefines.WidgetConfigGroup[] = []
      const baseWidgets: VxeFormDesignDefines.WidgetObjItem[] = []
      const layoutWidgets: VxeFormDesignDefines.WidgetObjItem[] = []
      const advancedWidgets: VxeFormDesignDefines.WidgetObjItem[] = []
      const customGroups: VxeFormDesignDefines.WidgetConfigGroup[] = []

      renderer.forEach((item, name) => {
        const { createFormDesignWidgetConfig } = item
        if (createFormDesignWidgetConfig) {
          const widthItem = createWidget(name)
          const widgetGroup = getWidgetGroup(name)
          const widgetCustomGroup = getWidgetCustomGroup(name)
          // 如果自定义组
          if (widgetCustomGroup) {
            const cusGroup = customGroups.find(item => item.title === widgetCustomGroup)
            if (cusGroup) {
              cusGroup.children.push(widthItem)
            } else {
              customGroups.push({
                title: widgetCustomGroup,
                children: [widthItem]
              })
            }
          } else {
            switch (widgetGroup) {
              case 'layout':
                layoutWidgets.push(widthItem)
                break
              case 'advanced':
                advancedWidgets.push(widthItem)
                break
              default:
                baseWidgets.push(widthItem)
                break
            }
          }
        }
      })

      if (baseWidgets.length) {
        widgetConfs.push({
          title: getI18n('vxe.formDesign.widget.baseGroup'),
          children: baseWidgets
        })
      }
      if (layoutWidgets.length) {
        widgetConfs.push({
          title: getI18n('vxe.formDesign.widget.layoutGroup'),
          children: layoutWidgets
        })
      }
      if (advancedWidgets.length) {
        widgetConfs.push({
          title: getI18n('vxe.formDesign.widget.advancedGroup'),
          children: advancedWidgets
        })
      }
      if (customGroups.length) {
        widgetConfs.push(...customGroups)
      }

      if (widgets && widgets.length) {
        reactData.widgetConfigs = props.widgets.map(group => {
          return {
            title: group.title,
            children: group.children
              ? group.children.map(name => {
                const widthItem = createWidget(name)
                return widthItem
              })
              : []
          }
        })
      } else {
        reactData.widgetConfigs = widgetConfs
      }
    }

    const formDesignPrivateMethods: FormDesignPrivateMethods = {
      handleClickWidget (evnt: KeyboardEvent, item: VxeFormDesignDefines.WidgetObjItem) {
        if (item && item.name) {
          reactData.activeWidget = item
          formDesignMethods.dispatchEvent('click-widget', { item }, evnt)
        }
      },
      handleCopyWidget (evnt: KeyboardEvent, widget: VxeFormDesignDefines.WidgetObjItem) {
        const { widgetObjList } = reactData
        const rest = XEUtils.findTree(widgetObjList, obj => obj.id === widget.id, { children: 'children' })
        if (rest) {
          evnt.stopPropagation()
          const { path } = rest
          const rootIndex = Number(path[0])
          const newWidget = createWidget(widget.name)
          // 标题副本
          if (newWidget.title) {
            newWidget.title = getI18n('vxe.formDesign.widget.copyTitle', [`${widget.title}`.replace(getI18n('vxe.formDesign.widget.copyTitle', ['']), '')])
          }
          if (rootIndex >= widgetObjList.length - 1) {
            widgetObjList.push(newWidget)
          } else {
            widgetObjList.splice(rootIndex + 1, 0, newWidget)
          }
          reactData.activeWidget = newWidget
          reactData.widgetObjList = [...widgetObjList]
          formDesignMethods.dispatchEvent('copy-widget', { widget, newWidget }, evnt)
        }
      },
      handleRemoveWidget (evnt: KeyboardEvent, widget: VxeFormDesignDefines.WidgetObjItem) {
        const { widgetObjList } = reactData
        const rest = XEUtils.findTree(widgetObjList, obj => obj.id === widget.id, { children: 'children' })
        if (rest) {
          const { index, parent, items } = rest
          evnt.stopPropagation()
          if (index >= items.length - 1) {
            reactData.activeWidget = items[index - 1]
          } else {
            reactData.activeWidget = items[index + 1] || null
          }
          // 如果是子控件
          if (parent) {
            items[index] = createEmptyWidget()
          } else {
            items.splice(index, 1)
          }
          reactData.widgetObjList = [...widgetObjList]
          formDesignMethods.dispatchEvent('remove-widget', { widget }, evnt)
        }
      }
    }

    const createSettingForm = () => {
      const { formRender, showPC, showMobile } = props
      let formData: Record<string, any> = getDefaultSettingFormData({
        pcVisible: showPC,
        mobileVisible: showMobile
      })
      if (formRender) {
        const compConf = renderer.get(formRender.name)
        const createFormConfig = compConf ? compConf.createFormDesignSettingFormConfig : null
        formData = (createFormConfig ? createFormConfig({}) : {}) || {}
      }

      reactData.formData = formData
    }

    Object.assign($xeFormDesign, formDesignMethods, formDesignPrivateMethods)

    const renderLayoutTop = () => {
      return h('div', {
        class: 'vxe-design-form--header-wrapper'
      }, [
        h('div', {
          class: 'vxe-design-form--header-left'
        }),
        h('div', {
          class: 'vxe-design-form--header-middle'
        }),
        h('div', {
          class: 'vxe-design-form--header-right'
        }, [
          h(LayoutStyleComponent as ComponentOptions, {
            ref: refLayoutStyle
          })
        ])
      ])
    }

    const renderVN = () => {
      const { height } = props
      return h('div', {
        ref: refElem,
        class: 'vxe-design-form',
        style: height
          ? {
              height: toCssUnit(height)
            }
          : null
      }, [
        h('div', {
          class: 'vxe-design-form--header'
        }, renderLayoutTop()),
        h('div', {
          class: 'vxe-design-form--body'
        }, [
          h(LayoutWidgetComponent),
          h(LayoutViewComponent),
          h(LayoutSettingComponent)
        ])
      ])
    }

    $xeFormDesign.renderVN = renderVN

    watch(() => props.widgets, () => {
      updateWidgetConfigs()
    })

    watch(() => props.formRender, () => {
      createSettingForm()
    })

    createSettingForm()
    updateWidgetConfigs()

    provide('$xeFormDesign', $xeFormDesign)

    return $xeFormDesign
  },
  render () {
    return this.renderVN()
  }
})
