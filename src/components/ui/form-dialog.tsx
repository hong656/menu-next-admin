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
} from "@/components/ui/select"; // Import shadcn/ui select components
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "select" | "file";
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: Array<{ label: string; value: string }>;
};

export type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  initialValues?: Record<string, string>;
  isLoading?: boolean;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  submitLabel = "Create",
  cancelLabel = "Cancel",
  className,
  initialValues,
  isLoading,
  onSubmit,
}: FormDialogProps): React.ReactElement {
  const defaultValues = useMemo(() => {
    return fields.reduce<Record<string, string>>((acc, f) => {
      acc[f.name] = f.defaultValue ?? "";
      return acc;
    }, {});
  }, [fields]);

  const initialFormValues = useMemo(() => {
    return { ...defaultValues, ...initialValues };
  }, [defaultValues, initialValues]);

  const [values, setValues] = useState<Record<string, string>>(initialFormValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setValues(initialFormValues);
  }, [initialFormValues]);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // reset when closing
      setValues(initialFormValues);
      setError("");
      setSubmitting(false);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(values);
      handleOpenChange(false);
    } catch (err: unknown) {
      console.log(err);
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
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
              {field.type === "select" ? (
                <Select
                  name={field.name}
                  required={field.required}
                  value={values[field.name] ?? ""}
                  onValueChange={(value) => handleChange(field.name, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "file" ? (
                <div className="space-y-2">
                  <input
                    id={field.name}
                    name={field.name}
                    type="file"
                    accept="image/*"
                    required={field.required}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Create a temporary URL for the file
                        const fileUrl = URL.createObjectURL(file);
                        handleChange(field.name, fileUrl);
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {values[field.name] && (
                    <div className="mt-2">

                    </div>
                  )}
                </div>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={values[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}
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
            <Button type="submit" className="cursor-pointer" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}