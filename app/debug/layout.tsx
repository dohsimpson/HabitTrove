import { ReactNode } from "react";
import { notFound } from 'next/navigation'

export default function Debug({children}: {children: ReactNode}) {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return (
    <div className="debug">
      {children}
    </div>
  )
}