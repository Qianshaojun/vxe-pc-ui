import { App } from 'vue'
import { VxeUI } from '@vxe-ui/core'
import VxeImageComponent from './src/image'
import { dynamicApp } from '../dynamics'

export const VxeImage = Object.assign({}, VxeImageComponent, {
  install (app: App) {
    app.component(VxeImageComponent.name as string, VxeImageComponent)
    VxeUI.component(VxeImageComponent)
  }
})

dynamicApp.component(VxeImageComponent.name as string, VxeImageComponent)

export const Image = VxeImage
export default VxeImage
