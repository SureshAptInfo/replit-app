import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants
        new: "border-transparent bg-purple-100 text-purple-700",
        contacted: "border-transparent bg-blue-100 text-blue-700",
        follow_up: "border-transparent bg-indigo-100 text-indigo-700",
        interested: "border-transparent bg-yellow-100 text-yellow-700",
        converted: "border-transparent bg-green-100 text-green-700",
        lost: "border-transparent bg-red-100 text-red-700",
        // Source variants
        facebook: "border-transparent bg-blue-100 text-blue-700",
        google: "border-transparent bg-purple-100 text-purple-700",
        website: "border-transparent bg-green-100 text-green-700",
        referral: "border-transparent bg-orange-100 text-orange-700",
        manual: "border-transparent bg-gray-100 text-gray-700",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-2.5 py-0.75 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
