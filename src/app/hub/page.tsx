"use client"

import { Suspense } from "react"
import HubContent from "./HubContent"

// Prevent Next.js from statically pre-rendering this page
export const dynamic = 'force-dynamic'

export default function HubPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <HubContent />
    </Suspense>
  )
}