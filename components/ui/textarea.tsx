import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-2xl border border-[#eadfce] bg-white px-4 py-3 text-base text-[#173528] outline-none placeholder:text-[#8aa092] focus:border-[#1e4d3a] focus:ring-2 focus:ring-[#1e4d3a]/20",
        className,
      )}
      {...props}
    />
  );
}
