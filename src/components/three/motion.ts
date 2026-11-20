'use client'

import { createContext, useContext } from 'react'

/** True when the visitor asked their system for less motion. Scenes then skip idle animation. */
export const ReducedMotionContext = createContext(false)

export const useReducedMotionScene = () => useContext(ReducedMotionContext)

/**
 * "high": post-processing, soft shadows and the café HDRI. "low": the same scene without the extras, for
 * phones and slow GPUs. Chosen from the device first, then corrected by the measured frame rate.
 */
export type Quality = 'high' | 'low'

export const QualityContext = createContext<Quality>('high')

export const useQuality = () => useContext(QualityContext)
