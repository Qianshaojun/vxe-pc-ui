import { defineComponent, h, inject, provide, PropType, createCommentVNode } from 'vue'
import XEUtils from 'xe-utils'
import { getIcon, getI18n, renderer, VxeComponentSlotType } from '../../ui'
import { getFuncText, isEnableConf } from '../../ui/src/utils'
import { getSlotVNs } from '../../ui/src/vn'
import { renderTitle } from './render'
import { isActiveItem } from './util'

import type { VxeFormConstructor, VxeFormDefines, VxeFormPrivateMethods } from '../../../types'

const VxeFormConfigItem = defineComponent({
  name: 'VxeFormConfigItem',
  props: {
    itemConfig: Object as PropType<VxeFormDefines.ItemInfo>
  },
  setup (props) {
    const $xeForm = inject('$xeForm', {} as VxeFormConstructor & VxeFormPrivateMethods)
    const xeformiteminfo = { itemConfig: props.itemConfig }
    provide('xeFormItemInfo', xeformiteminfo)

    const renderVN = () => {
      const { reactData } = $xeForm
      const { data, rules, readonly, disabled, span: allSpan, align: allAlign, titleBold: allTitleBold, titleAlign: allTitleAlign, titleWidth: allTitleWidth, titleColon: allTitleColon, titleAsterisk: allTitleAsterisk, titleOverflow: allTitleOverflow, vertical: allVertical, padding: allPadding } = $xeForm.props
      const { computeValidOpts } = $xeForm.getComputeMaps()
      const item = props.itemConfig as VxeFormDefines.ItemInfo
      const { collapseAll } = reactData
      const validOpts = computeValidOpts.value
      const { slots, title, visible, folding, field, collapseNode, itemRender, showError, errRule, className, titleOverflow, vertical, padding, children, showTitle, contentClassName, contentStyle, titleClassName, titleStyle } = item
      const compConf = isEnableConf(itemRender) ? renderer.get(itemRender.name) : null
      const itemClassName = compConf ? (compConf.formItemClassName || compConf.itemClassName) : ''
      const itemStyle = compConf ? (compConf.formItemStyle || compConf.itemStyle) : null
      const itemContentClassName = compConf ? (compConf.formItemContentClassName || compConf.itemContentClassName) : ''
      const itemContentStyle = compConf ? (compConf.formItemContentStyle || compConf.itemContentStyle) : null
      const itemTitleClassName = compConf ? (compConf.formItemTitleClassName || compConf.itemTitleClassName) : ''
      const itemTitleStyle = compConf ? (compConf.formItemTitleStyle || compConf.itemTitleStyle) : null
      const defaultSlot = slots ? slots.default : null
      const titleSlot = slots ? slots.title : null
      const span = item.span || allSpan
      const align = item.align || allAlign
      const itemPadding = XEUtils.eqNull(padding) ? allPadding : padding
      const itemVertical = XEUtils.eqNull(vertical) ? allVertical : vertical
      const titleBold = XEUtils.eqNull(item.titleBold) ? allTitleBold : item.titleBold
      const titleAlign = XEUtils.eqNull(item.titleAlign) ? allTitleAlign : item.titleAlign
      const titleWidth = itemVertical ? null : (XEUtils.eqNull(item.titleWidth) ? allTitleWidth : item.titleWidth)
      const titleColon = XEUtils.eqNull(item.titleColon) ? allTitleColon : item.titleColon
      const titleAsterisk = XEUtils.eqNull(item.titleAsterisk) ? allTitleAsterisk : item.titleAsterisk
      const itemOverflow = XEUtils.eqNull(titleOverflow) ? allTitleOverflow : titleOverflow
      const ovEllipsis = itemOverflow === 'ellipsis'
      const ovTitle = itemOverflow === 'title'
      const ovTooltip = itemOverflow === true || itemOverflow === 'tooltip'
      const hasEllipsis = ovTitle || ovTooltip || ovEllipsis
      const params = { data, disabled, readonly, field, property: field, item, $form: $xeForm, $grid: $xeForm.xegrid }
      if (visible === false) {
        return createCommentVNode()
      }
      let isRequired = false
      let isValid = false
      if (!readonly && rules) {
        const itemRules = rules[field]
        if (itemRules && itemRules.length) {
          isValid = true
          isRequired = itemRules.some((rule) => rule.required)
        }
      }
      // 如果为项集合
      const isGather = children && children.length > 0
      if (isGather) {
        const childVNs = children.map((childItem, index) => {
          return h(VxeFormConfigItem, {
            key: index,
            itemConfig: childItem
          })
        })
        return childVNs.length
          ? h('div', {
            class: ['vxe-form--gather vxe-form--item-row', item.id, span ? `vxe-form--item-col_${span} is--span` : '', className ? (XEUtils.isFunction(className) ? className(params) : className) : '']
          }, childVNs)
          : createCommentVNode()
      }
      let contentVNs: VxeComponentSlotType[] = []
      const rftContent = compConf ? (compConf.renderFormItemContent || compConf.renderItemContent) : null
      if (defaultSlot) {
        contentVNs = $xeForm.callSlot(defaultSlot, params)
      } else if (rftContent) {
        contentVNs = getSlotVNs(rftContent(itemRender, params))
      } else if (field) {
        contentVNs = [XEUtils.toValueString(XEUtils.get(data, field))]
      }
      if (collapseNode) {
        contentVNs.push(
          h('div', {
            class: 'vxe-form--item-trigger-node',
            onClick: $xeForm.toggleCollapseEvent
          }, [
            h('span', {
              class: 'vxe-form--item-trigger-text'
            }, collapseAll ? getI18n('vxe.form.unfolding') : getI18n('vxe.form.folding')),
            h('i', {
              class: ['vxe-form--item-trigger-icon', collapseAll ? getIcon().FORM_FOLDING : getIcon().FORM_UNFOLDING]
            })
          ])
        )
      }
      if (errRule && validOpts.showMessage) {
        contentVNs.push(
          h('div', {
            class: 'vxe-form--item-valid',
            style: errRule.maxWidth
              ? {
                  width: `${errRule.maxWidth}px`
                }
              : null
          }, errRule.content)
        )
      }
      const ons = ovTooltip
        ? {
            onMouseenter (evnt: MouseEvent) {
              $xeForm.triggerTitleTipEvent(evnt, params)
            },
            onMouseleave: $xeForm.handleTitleTipLeaveEvent
          }
        : {}
      return h('div', {
        class: [
          'vxe-form--item',
          item.id,
          span ? `vxe-form--item-col_${span} is--span` : '',
          className ? (XEUtils.isFunction(className) ? className(params) : className) : '',
          itemClassName ? (XEUtils.isFunction(itemClassName) ? itemClassName(params) : itemClassName) : '',
          {
            'is--title': title,
            'is--colon': titleColon,
            'is--bold': titleBold,
            'is--padding': itemPadding,
            'is--vertical': itemVertical,
            'is--asterisk': titleAsterisk,
            'is--valid': isValid,
            'is--required': isRequired,
            'is--hidden': folding && collapseAll,
            'is--active': isActiveItem($xeForm, item),
            'is--error': showError
          }
        ],
        style: XEUtils.isFunction(itemStyle) ? itemStyle(params) : itemStyle
      }, [
        h('div', {
          class: 'vxe-form--item-inner'
        }, [
          (showTitle !== false) && (title || titleSlot)
            ? h('div', {
              class: [
                'vxe-form--item-title',
                titleAlign ? `align--${titleAlign}` : '',
                hasEllipsis ? 'is--ellipsis' : '',
                itemTitleClassName ? (XEUtils.isFunction(itemTitleClassName) ? itemTitleClassName(params) : itemTitleClassName) : '',
                titleClassName ? (XEUtils.isFunction(titleClassName) ? titleClassName(params) : titleClassName) : ''
              ],
              style: Object.assign(
                {},
                XEUtils.isFunction(itemTitleStyle) ? itemTitleStyle(params) : itemTitleStyle,
                XEUtils.isFunction(titleStyle) ? titleStyle(params) : titleStyle,
                titleWidth
                  ? {
                      width: isNaN(titleWidth as number) ? titleWidth : `${titleWidth}px`
                    }
                  : null
              ),
              title: ovTitle ? getFuncText(title) : null,
              ...ons
            }, renderTitle($xeForm, item))
            : null,
          h('div', {
            class: [
              'vxe-form--item-content',
              align ? `align--${align}` : '',
              itemContentClassName ? (XEUtils.isFunction(itemContentClassName) ? itemContentClassName(params) : itemContentClassName) : '',
              contentClassName ? (XEUtils.isFunction(contentClassName) ? contentClassName(params) : contentClassName) : ''
            ],
            style: Object.assign({}, XEUtils.isFunction(itemContentStyle) ? itemContentStyle(params) : itemContentStyle, XEUtils.isFunction(contentStyle) ? contentStyle(params) : contentStyle)
          }, contentVNs)
        ])
      ])
    }

    const $xeFormconfigitem = {
      renderVN
    }

    provide('$xeFormGather', null)

    return $xeFormconfigitem
  },
  render () {
    return this.renderVN()
  }
})

export default VxeFormConfigItem
