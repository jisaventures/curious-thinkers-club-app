import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4d3a] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        gold: "bg-[#f0b429] text-[#1a3b2c] hover:bg-[#e3a61a]",
        bottle: "bg-[#1e4d3a] text-white hover:bg-[#16392c]",
        outline: "border border-[#e6d8c4] bg-white text-[#1a3b2c] hover:bg-[#fbf6ee]",
        ghost: "bg-transparent text-[#1e4d3a] hover:bg-[#e7f5e1]",
        mustard: "ctc-button",
        green: "ctc-button",
        grey: "ctc-button",
        member: "ctc-button",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const chunky = variant === "mustard" || variant === "green" || variant === "grey" || variant === "member";
  const classes = cn(chunky ? "ctc-button" : buttonVariants({ variant, size }), className);
  const shared = {
    "data-variant": chunky ? variant : undefined,
    "data-size": chunky ? size ?? "md" : undefined,
    className: classes,
    ...props,
  };
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string; style?: React.CSSProperties }>;
    return React.cloneElement(child, {
      ...shared,
      className: cn(classes, child.props.className),
      style: { ...(props.style as React.CSSProperties | undefined), ...child.props.style },
    });
  }
  return (
    <button type="button" {...shared}>
      {children}
    </button>
  );
}
