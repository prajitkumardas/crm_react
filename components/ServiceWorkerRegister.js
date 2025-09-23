'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '../lib/swRegistration'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null // This component doesn't render anything
}