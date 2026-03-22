import * as React from "react";
import type { FieldError as RHFFieldError } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FieldGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />;
}

export function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Label>) {
  return <Label className={cn(className)} {...props} />;
}

export function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

interface FieldErrorProps {
  errors?: (RHFFieldError | undefined)[];
  className?: string;
}

export function FieldError({ errors, className }: FieldErrorProps) {
  const message = errors?.find((e) => e?.message)?.message;
  if (!message) return null;
  return <p className={cn("text-xs text-destructive", className)}>{message}</p>;
}
