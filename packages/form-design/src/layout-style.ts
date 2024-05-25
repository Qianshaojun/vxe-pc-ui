import { VNode, createCommentVNode, defineComponent, h, inject, ref, reactive, provide } from 'vue'
import { renderer } from '@vxe-ui/core'
import { getSlotVNs } from '../../ui/src/vn'
import VxeButtonComponent from '../../button/src/button'
import VxeDrawerComponent from '../../drawer/src/drawer'
import VxeTabsComponent from '../../tabs/src/tabs'
import VxeTabPaneComponent from '../../tabs/src/tab-pane'
import VxeFormViewComponent from './form-view'
import { DefaultPCStyleFormComponent, DefaultMobileStyleFormComponent } from './default-style-form'
import { createDefaultFormViewPCFormConfig, createDefaultFormViewMobileFormConfig } from './default-setting-data'

import type { VxeFormDesignConstructor, VxeFormViewDefines, VxeFormDesignPrivateMethods, VxeFormDesignDefines, VxeFormDesignLayoutStyle } from '../../../types'

export default defineComponent({
  name: 'FormDesignLayoutStyle',
  props: {},
  emits: [],
  setup () {
    const $xeFormDesign = inject<(VxeFormDesignConstructor & VxeFormDesignPrivateMethods) | null>('$xeFormDesign', null)

    const reactData = reactive({
      activeTab: 1
    })

    const $xeFormDesignLayoutStyle: VxeFormDesignLayoutStyle = {
      reactData,

      renderVN () {
        return []
      }
    }

    if (!$xeFormDesign) {
      return $xeFormDesignLayoutStyle
    }

    const { props: formDesignProps, reactData: formDesignReactData } = $xeFormDesign

    const settingVisible = ref(false)
    const settingConfig = ref<VxeFormDesignDefines.FormDesignConfig | null>(null)

    const updatePreviewView = () => {
      settingConfig.value = $xeFormDesign.getConfig()
    }

    const openPreviewEvent = () => {
      updatePreviewView()
      settingVisible.value = true
    }

    const createFormViewFormConfig = (params: VxeFormViewDefines.CreateFormConfigParams<VxeFormDesignDefines.DefaultSettingFormDataObjVO>) => {
      const { viewRender } = params
      const { activeTab } = reactData
      const { name } = viewRender || {}
      const compConf = renderer.get(name) || {}
      const createPCFormConfig = compConf ? compConf.createFormViewFormConfig : null
      const createMobileFormConfig = compConf ? compConf.createFormViewMobileFormConfig : null
      if (activeTab === 2) {
        if (createMobileFormConfig) {
          return createMobileFormConfig(params)
        }
        return createDefaultFormViewMobileFormConfig(params)
      }
      if (createPCFormConfig) {
        return createPCFormConfig(params)
      }
      return createDefaultFormViewPCFormConfig(params)
    }

    const formDesignLayoutStyleMethod = {
      updatePreviewView
    }

    Object.assign($xeFormDesignLayoutStyle, formDesignLayoutStyleMethod)

    const renderStylePreview = () => {
      const { activeTab } = reactData
      return h('div', {
        class: ['vxe-design-form--layout-style-preview', `is--${activeTab === 2 ? 'mobile' : 'pc'}`]
      }, [
        h(VxeFormViewComponent, {
          config: settingConfig.value,
          createFormConfig: createFormViewFormConfig
        }),
        h(VxeFormViewComponent, {
          config: settingConfig.value,
          createFormConfig: createFormViewFormConfig
        })
      ])
    }

    const renderMobileStyle = () => {
      const { formRender } = formDesignProps
      const { formData } = formDesignReactData
      if (formRender) {
        const compConf = renderer.get(formRender.name)
        const renderSettingMobileFormView = compConf ? compConf.renderFormDesignMobileStyleFormView : null
        if (renderSettingMobileFormView) {
          return h('div', {
            class: 'vxe-design-form--custom-setting-mobile-form-view'
          }, getSlotVNs(renderSettingMobileFormView({ }, { $formDesign: $xeFormDesign, formConfig: formData })))
        }
      }
      return h(DefaultMobileStyleFormComponent, {
        formData
      })
    }

    const renderPCStyle = () => {
      const { formRender } = formDesignProps
      const { formData } = formDesignReactData
      if (formRender) {
        const compConf = renderer.get(formRender.name)
        const renderStylePCFormView = compConf ? compConf.renderFormDesignStyleFormView : null
        if (renderStylePCFormView) {
          return h('div', {
            class: 'vxe-design-form--custom-setting-pc-form-view'
          }, getSlotVNs(renderStylePCFormView({ }, { $formDesign: $xeFormDesign, formConfig: formData })))
        }
      }
      return h(DefaultPCStyleFormComponent, {
        formData
      })
    }

    const renderStyleSetting = () => {
      const { showPC, showMobile } = formDesignProps
      const { activeTab } = reactData
      return h('div', {
        class: 'vxe-design-form--layout-style-setting'
      }, [
        h(VxeTabsComponent, {
          modelValue: activeTab,
          titleWidth: showPC && showMobile ? '50%' : '100%',
          titleAlign: 'center',
          onChange: updatePreviewView,
          'onUpdate:modelValue' (val) {
            reactData.activeTab = val
          }
        }, {
          default () {
            const tabVNs: VNode[] = []
            if (showPC) {
              tabVNs.push(
                h(VxeTabPaneComponent, {
                  title: '电脑端',
                  k: 1,
                  name: 1
                }, {
                  default () {
                    return renderPCStyle()
                  }
                })
              )
            }
            if (showMobile) {
              tabVNs.push(
                h(VxeTabPaneComponent, {
                  title: '手机端',
                  key: 2,
                  name: 2
                }, {
                  default () {
                    return renderMobileStyle()
                  }
                })
              )
            }
            return tabVNs
          }
        })
      ])
    }

    const renderVN = () => {
      const { showPC, showMobile } = formDesignProps
      return [
        h(VxeButtonComponent, {
          mode: 'text',
          status: 'primary',
          content: '样式设置',
          onClick: openPreviewEvent
        }),
        h(VxeDrawerComponent, {
          modelValue: settingVisible.value,
          title: '表单样式设置',
          height: '90vh',
          maskClosable: true,
          position: 'bottom',
          'onUpdate:modelValue' (val) {
            settingVisible.value = val
          }
        }, {
          default () {
            return h('div', {
              class: 'vxe-design-form--layout-style'
            }, [
              renderStylePreview(),
              showPC || showMobile ? renderStyleSetting() : createCommentVNode()
            ])
          }
        })
      ]
    }

    $xeFormDesignLayoutStyle.renderVN = renderVN

    provide('$xeFormDesignLayoutStyle', $xeFormDesignLayoutStyle)

    return $xeFormDesignLayoutStyle
  },
  render () {
    return this.renderVN()
  }
})
