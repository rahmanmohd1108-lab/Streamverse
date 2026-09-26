import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDuration } from "@/lib/constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatDuration }
