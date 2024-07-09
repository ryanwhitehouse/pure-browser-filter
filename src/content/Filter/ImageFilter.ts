import { PredictionRequest } from '../../utils/messages'

import { Filter } from './Filter'

type imageFilterSettingsType = {
  filterEffect: 'blur' | 'hide' | 'grayscale'
}

export type IImageFilter = {
  analyzeImage: (image: HTMLImageElement, srcAttribute: boolean) => void
  setSettings: (settings: imageFilterSettingsType) => void
}

export class ImageFilter extends Filter implements IImageFilter {
  private readonly MIN_IMAGE_SIZE: number
  private settings: imageFilterSettingsType

  constructor () {
    super()
    this.MIN_IMAGE_SIZE = 41

    this.settings = { filterEffect: 'hide' }
  }

  public setSettings (settings: imageFilterSettingsType): void {
    this.settings = settings
  }

  public analyzeImage (image: HTMLImageElement, srcAttribute: boolean = false): void {
    if (
      (srcAttribute || image.dataset.nsfwFilterStatus === undefined) &&
      image.src.length > 0 &&
      (
        (image.width > this.MIN_IMAGE_SIZE && image.height > this.MIN_IMAGE_SIZE) ||
        image.height === 0 ||
        image.width === 0
      )
    ) {
      image.dataset.nsfwFilterStatus = 'processing'
      this._analyzeImage(image)
    }
  }

  private _analyzeImage (image: HTMLImageElement): void {
    this.hideImage(image)

    const request = new PredictionRequest(image.src)
    this.requestToAnalyzeImage(request)
      .then(({ result, url }) => {
        if (result) {
          /*
          if (this.settings.filterEffect === 'blur') {
            image.style.filter = 'blur(25px)'
            this.showImage(image, url)
          } else if (this.settings.filterEffect === 'grayscale') {
            image.style.filter = 'grayscale(1)'
            this.showImage(image, url)
          }
          */

          this.blockedItems++
          image.dataset.nsfwFilterStatus = 'nsfw'
          // image.dataset.src = ''
          image.src = ''
        } else {
          this.showImage(image, url)
        }
      }).catch(({ url }) => {
        console.error('Error while analyzing image:', url)
        // this.showImage(image, url)
      })
  }

  private hideImage (image: HTMLImageElement): void {
    // if (image.parentNode?.nodeName === 'BODY') image.hidden = true

    /*
    const spanContainer = image?.parentNode
    if (spanContainer != null && spanContainer instanceof HTMLSpanElement) {
      spanContainer.hidden = true
      spanContainer.style.visibility = 'hidden'
    }

    const divContainer = image?.parentNode?.parentNode?.parentNode
    if (divContainer != null && divContainer instanceof HTMLDivElement) {
      divContainer.hidden = true
      divContainer.style.visibility = 'hidden'
    }
      */

    image.hidden = true
    image.style.visibility = 'hidden'
  }

  private showImage (image: HTMLImageElement, url: string): void {
    if (image.src === url) {
      // if (image.parentNode?.nodeName === 'BODY') image.hidden = false

      image.hidden = false
      image.dataset.nsfwFilterStatus = 'sfw'
      image.style.visibility = 'visible'
    }
  }
}
