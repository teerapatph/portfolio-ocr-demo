import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  error = false,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { error?: boolean }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        `relative h-4 w-full overflow-hidden rounded-full shadow-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 ${error ? 'border border-red-400' : 'border border-green-200'}`,
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          `h-full flex-1 transition-all duration-500 rounded-full ${error ? 'bg-red-500' : 'bg-gradient-to-r from-green-400 via-green-500 to-green-600'} animate-progress-stripes`)
        }
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
      <style jsx>{`
        @keyframes progress-stripes {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        .animate-progress-stripes {
          background-image: repeating-linear-gradient(135deg, rgba(255,255,255,0.15) 0 10px, transparent 10px 20px);
          background-size: 40px 40px;
          animation: progress-stripes 1s linear infinite;
        }
      `}</style>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
