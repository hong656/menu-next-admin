"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Textarea } from "./textarea";
import { MultiSelect } from '@/components/ui/multi-select';

// FIX #1: Add 'multiselect' to the type, but keep values flexible.
export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "select" | "file" | "textarea" | "multiselect";
  placeholder?: string;
  required?: boolean;
  defaultValue?: any; // Use 'any' for flexibility with default values (e.g., [] for multiselect)
  options?: Array<{ label: string; value: string }>;
};

// FIX #2: Use a more flexible type for values to avoid breaking existing components.
// The component itself will ensure the correct types are used internally.
export type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  initialValues?: Record<string, any>;
  isLoading?: boolean;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  className,
  initialValues,
  isLoading,
  onSubmit,
}: FormDialogProps): React.ReactElement {
  const t = useTranslations('Button');
  const submitLabel = t("create");
  const cancelLabel = t("cancel");

  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // FIX #3: More robust state initialization.
  // This effect runs ONLY when the dialog opens, correctly setting the initial state.
  useEffect(() => {
    if (open) {
      const defaultValues = fields.reduce<Record<string, any>>((acc, field) => {
        // For multiselect, default to an empty array if no other default is provided.
        if (field.type === 'multiselect') {
          acc[field.name] = field.defaultValue ?? [];
        } else {
          acc[field.name] = field.defaultValue ?? "";
        }
        return acc;
      }, {});
      setValues({ ...defaultValues, ...initialValues });
    }
  }, [open, fields, initialValues]);

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError("");
      // No need to reset values here; the useEffect above handles it on re-open.
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(values);
      handleOpenChange(false); // Close dialog on successful submission
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("sm:max-w-md", className)}
        aria-describedby={description ? undefined : ""}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
              </label>
              
              {(() => {
                switch (field.type) {
                  case "select":
                    return (
                      <Select
                        name={field.name}
                        required={field.required}
                        value={String(values[field.name] ?? "")}
                        onValueChange={(value) => handleChange(field.name, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );

                  // FIX #4: Correctly handle value for MultiSelect
                  case "multiselect":
                    return (
                      <MultiSelect
                        options={field.options || []}
                        // Ensure the value is ALWAYS an array to prevent crashes.
                        value={Array.isArray(values[field.name]) ? values[field.name] : []}
                        onChange={(value) => handleChange(field.name, value)}
                        placeholder={field.placeholder}
                      />
                    );

                  case "textarea":
                    return (
                      <Textarea
                        id={field.name}
                        name={field.name}
                        placeholder={field.placeholder}
                        required={field.required}
                        value={String(values[field.name] ?? "")}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                      />
                    );
                  
                  // Handle file and default text inputs
                  case "file":
                    // NOTE: This implementation doesn't handle file objects for submission,
                    // only their local URL for preview. Submission logic would need adjustment.
                    return ( <Input id={field.name} name={field.name} type="file" required={field.required} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleChange(field.name, file); // Store the file object itself
                        }}
                    /> );
                  
                  default:
                    return (
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type ?? "text"}
                        placeholder={field.placeholder}
                        required={field.required}
                        value={String(values[field.name] ?? "")}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                      />
                    );
                }
              })()}
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              className="cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={submitting || isLoading}>
              {(submitting || isLoading) ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait </>
              ) : ( submitLabel )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}