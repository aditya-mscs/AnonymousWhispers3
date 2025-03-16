"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { getDarknessBackgroundColor, getDarknessDescription } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface DarknessSliderProps {
  value: number[]
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  showLabel?: boolean
  className?: string
}

export function DarknessSlider({
  value,
  onValueChange,
  onValueCommit,
  showLabel = true,
  className,
}: DarknessSliderProps) {
  const [localValue, setLocalValue] = useState(value)

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Handle local value change
  const handleValueChange = (newValue: number[]) => {
    setLocalValue(newValue)
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  // Get the current rating value
  const rating = localValue[0]

  // Get color and description based on rating
  const colorClass = getDarknessBackgroundColor(rating)
  const description = getDarknessDescription(rating)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm">Your rating: {rating}/10</span>
        {showLabel && (
          <span
            className={cn(
              "text-sm font-medium px-2 py-0.5 rounded-full transition-colors",
              rating >= 8
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : rating >= 5
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : rating > 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
            )}
          >
            {description}
          </span>
        )}
      </div>

      <Slider
        value={localValue}
        min={0}
        max={10}
        step={1}
        onValueChange={handleValueChange}
        onValueCommit={onValueCommit}
        className="w-full"
        colorByValue={true}
      />

      {/* Labels for reference */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Basic</span>
        <span>Low-key</span>
        <span>Vibe</span>
        <span>Fire</span>
        <span>Slay</span>
      </div>
    </div>
  )
}

export default DarknessSlider

