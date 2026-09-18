"use client";

import type { ButtonHTMLAttributes } from "react";
import type { VariantProps } from "class-variance-authority";
import {
  Button as BeautifulButton,
  buttonVariants,
  type ButtonVariant,
} from "@/components/atoms/Button";

export { buttonVariants };
export type { ButtonVariant };

export function Button({
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <BeautifulButton variant={variant} size={size} {...props} />;
}
