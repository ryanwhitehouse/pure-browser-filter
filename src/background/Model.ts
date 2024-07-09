import { NSFWJS, predictionType } from 'nsfwjs'

import { ILogger } from '../utils/Logger'

export type ModelSettings = {
  filterStrictness: number
}

type IModel = {
  predictImage: (image: HTMLImageElement, url: string) => Promise<boolean>
  setSettings: (settings: ModelSettings) => void
}

export class Model implements IModel {
  private readonly model: NSFWJS
  private readonly logger: ILogger

  private readonly FILTER_LIST: Set<string>
  private readonly firstFilterPercentages: Map<string, number>
  private readonly secondFilterPercentages: Map<string, number>
  private readonly thirdFilterPercentages: Map<string, number>
  private readonly fourthFilterPercentages: Map<string, number>

  constructor (model: NSFWJS, logger: ILogger, settings: ModelSettings) {
    this.model = model
    this.logger = logger

    this.logger.log('Model is loaded')

    this.FILTER_LIST = new Set(['Hentai', 'Porn', 'Sexy'])

    this.firstFilterPercentages = new Map()
    this.secondFilterPercentages = new Map()
    this.thirdFilterPercentages = new Map()
    this.fourthFilterPercentages = new Map()

    this.setSettings(settings)
  }

  public handleFilterStrictness ({ value, minValue, maxValue }: {value: number, minValue: number, maxValue: number}): number {
    const MIN = minValue
    const MAX = maxValue

    // console.log('testing log')
    this.logger.log('getting filter strictness')

    const calc = (value: number): number => {
      if (value <= 1) return MAX
      else if (value >= 100) return MIN
      else {
        const coefficient = 1 - (value / 100)
        return (coefficient * (MAX - MIN)) + MIN
      }
    }

    return Math.round((calc(value) / 100) * 10000) / 10000
  }

  public setSettings (settings: ModelSettings): void {
    // const { filterStrictness } = settings
    const filterStrictness = 70

    this.firstFilterPercentages.clear()
    this.secondFilterPercentages.clear()
    this.thirdFilterPercentages.clear()
    this.fourthFilterPercentages.clear()

    for (const className of this.FILTER_LIST.values()) {
      this.firstFilterPercentages.set(
        className,
        this.handleFilterStrictness({
          value: filterStrictness,
          maxValue: 100,
          minValue: className === 'Porn' ? 10 : className === 'Hentai' ? 20 : 35
        })
      )
    }

    for (const className of this.FILTER_LIST.values()) {
      this.secondFilterPercentages.set(
        className,
        this.handleFilterStrictness({
          value: filterStrictness,
          maxValue: 50,
          minValue: className === 'Porn' ? 5 : className === 'Hentai' ? 10 : 20
        })
      )
    }

    for (const className of this.FILTER_LIST.values()) {
      this.thirdFilterPercentages.set(
        className,
        this.handleFilterStrictness({
          value: filterStrictness,
          maxValue: 30,
          minValue: className === 'Porn' ? 3 : className === 'Hentai' ? 7 : 15
        })
      )
    }

    for (const className of this.FILTER_LIST.values()) {
      this.fourthFilterPercentages.set(
        className,
        this.handleFilterStrictness({
          value: filterStrictness,
          maxValue: 25,
          minValue: className === 'Porn' ? 1 : className === 'Hentai' ? 5 : 10
        })
      )
    }
  }

  public async predictImage (image: HTMLImageElement, url: string): Promise<boolean> {
    // eslint-disable-next-line no-constant-condition
    if (this.logger.status) {
      const start = new Date().getTime()

      const prediction = await this.model.classify(image, 4)
      const { result, className, probability } = this.handlePrediction(prediction)

      const end = new Date().getTime()
      console.log(`IMG prediction (${end - start} ms) is ${className} ${probability} for ${url}`)

      return result
    } else {
      const prediction = await this.model.classify(image, 4)
      return this.handlePrediction(prediction).result
    }
  }

  private handlePrediction (prediction: predictionType[]): { result: boolean, className: string, probability: number } {
    const [{ className: cn1, probability: pb1 }, { className: cn2, probability: pb2 }, { className: cn3, probability: pb3 }, { className: cn4, probability: pb4 }] = prediction

    const result1 = this.FILTER_LIST.has(cn1) && pb1 > (this.firstFilterPercentages.get(cn1) as number)
    if (result1) return ({ result: result1, className: cn1, probability: pb1 })

    const result2 = this.FILTER_LIST.has(cn2) && pb2 > (this.secondFilterPercentages.get(cn2) as number)
    if (result2) return ({ result: result2, className: cn2, probability: pb2 })

    const result3 = this.FILTER_LIST.has(cn3) && pb3 > (this.thirdFilterPercentages.get(cn3) as number)
    if (result3) return ({ result: result3, className: cn3, probability: pb3 })

    const result4 = this.FILTER_LIST.has(cn4) && pb4 > (this.fourthFilterPercentages.get(cn4) as number)
    if (result4) return ({ result: result4, className: cn4, probability: pb4 })

    return ({ result: false, className: cn1, probability: pb1 })
  }

}
