import { App } from 'vue'
import { VxeUI } from '@vxe-ui/core'
import VxeTextareaComponent from './src/textarea'
import { dynamicApp } from '../dynamics'

export const VxeTextarea = Object.assign(VxeTextareaComponent, {
  install: function (app: App) {
    app.component(VxeTextareaComponent.name as string, VxeTextareaComponent)
    VxeUI.component(VxeTextareaComponent)
  }
})

dynamicApp.component(VxeTextareaComponent.name as string, VxeTextareaComponent)

export const Textarea = VxeTextarea
export default VxeTextarea
