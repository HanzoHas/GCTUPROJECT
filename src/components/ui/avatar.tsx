import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden",
  {
    variants: {
      variant: {
        circle: "rounded-full",
        square: "rounded-md",
        squircle: "rounded-xl",
      },
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
      },
      border: {
        none: "",
        thin: "ring-1 ring-primary/20",
        thick: "ring-2 ring-primary/20",
      },
      status: {
        none: "",
        online: "after:content-[''] after:absolute after:bottom-0 after:right-0 after:h-2 after:w-2 after:rounded-full after:bg-emerald-500 after:ring-1 after:ring-white",
        offline: "after:content-[''] after:absolute after:bottom-0 after:right-0 after:h-2 after:w-2 after:rounded-full after:bg-gray-400 after:ring-1 after:ring-white",
        busy: "after:content-[''] after:absolute after:bottom-0 after:right-0 after:h-2 after:w-2 after:rounded-full after:bg-red-500 after:ring-1 after:ring-white",
        away: "after:content-[''] after:absolute after:bottom-0 after:right-0 after:h-2 after:w-2 after:rounded-full after:bg-amber-500 after:ring-1 after:ring-white",
      },
    },
    defaultVariants: {
      variant: "circle",
      size: "md",
      border: "none",
      status: "none",
    },
  }
)

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, variant, size, border, status, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      avatarVariants({ variant, size, border, status, className })
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-inherit bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback, avatarVariants }
