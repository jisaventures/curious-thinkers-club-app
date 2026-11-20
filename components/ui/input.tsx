import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-[#eadfce] bg-white px-4 text-base text-[#173528] outline-none placeholder:text-[#8aa092] focus:border-[#1e4d3a] focus:ring-2 focus:ring-[#1e4d3a]/20",
        className,
      )}
      {...props}
    />
  );
}
