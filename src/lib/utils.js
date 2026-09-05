import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** The same helper the rest of Gator uses: merge class lists, and let a later
 *  Tailwind utility win over an earlier one of the same kind. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
