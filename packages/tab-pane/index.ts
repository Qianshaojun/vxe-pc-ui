import { App } from 'vue'
import { VxeUI } from '@vxe-ui/core'
import VxeTabPaneComponent from '../tabs/src/tab-pane'
import { dynamicApp } from '../dynamics'

export const VxeTabPane = Object.assign({}, VxeTabPaneComponent, {
  install (app: App) {
    app.component(VxeTabPaneComponent.name as string, VxeTabPaneComponent)
    VxeUI.component(VxeTabPaneComponent)
  }
})

dynamicApp.component(VxeTabPaneComponent.name as string, VxeTabPaneComponent)

export const TabPane = VxeTabPane
export default VxeTabPane
