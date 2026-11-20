import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function friendlyError(message: string) {
  if (/earlier steps/i.test(message)) return "Finish the earlier steps first.";
  if (/not unlocked/i.test(message)) return "This pack is not unlocked for your club yet.";
  if (/5 children/i.test(message)) return "This account already has 5 children.";
  if (/already reviewed/i.test(message)) return "That upload has already been reviewed.";
  if (/admin only/i.test(message)) return "You need an admin account to do that.";
  if (/duplicate key|unique constraint/i.test(message)) return "That's already saved.";
  if (/invalid|nickname|first name|consent/i.test(message)) return message;
  return "Something went wrong. Please try again.";
}
