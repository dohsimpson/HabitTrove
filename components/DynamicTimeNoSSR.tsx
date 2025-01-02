import dynamic from 'next/dynamic'
import { DynamicTime } from './DynamicTime'

const DynamicTimeNoSSR = dynamic(() => Promise.resolve(DynamicTime), {
  ssr: false
})

export { DynamicTimeNoSSR }
