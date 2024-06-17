import { App } from 'vue'
import VxeImagePreviewComponent from '../image/src/preview'
import { VxeUI } from '@vxe-ui/core'
import { dynamicApp } from '../dynamics'
import { openPreviewImage } from '../image/src/util'

export const VxeImagePreview = Object.assign(VxeImagePreviewComponent, {
  install (app: App) {
    app.component(VxeImagePreviewComponent.name as string, VxeImagePreviewComponent)
    VxeUI.component(VxeImagePreviewComponent)
    VxeUI.previewImage = openPreviewImage
  }
})

dynamicApp.component(VxeImagePreviewComponent.name as string, VxeImagePreviewComponent)

export const ImagePreview = VxeImagePreview
export default VxeImagePreview
