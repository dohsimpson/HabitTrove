import Image from "next/image"

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image src="/icons/icon.png" alt="HabitTrove Logo" width={96} height={96} className="h-12 w-12 hidden xs:inline" />
      <span className="font-bold text-xl">HabitTrove</span>
    </div>
  )
}
