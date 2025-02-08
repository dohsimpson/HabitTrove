import { ReactNode } from "react";

export default function Debug({children}: {children: ReactNode}) {
  if (process.env.NODE_ENV !== 'development') return null
  return (
    <div className="debug">
      {children}
    </div>
  )
}