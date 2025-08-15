"use client";

import React, { useState, useEffect, useMemo, ChangeEvent } from "react";
import Image from "next/image";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, UploadCloud } from "lucide-react";

// Configuration for each field in the form
export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "select" | "file";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  className?: string; // Allow custom styling for a field container
};

// Props for the entire dialog component
export type FileFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  // Use a more structured layout definition
  layout: {
    fileFields: string[]; // Names of fields to be rendered in the file column
    dataFields: string[]; // Names of fields for the main data column
  };
  initialValues?: Record<string, string>; // Initial values are always strings (e.g., image URL)
  isLoading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (formData: FormData) => Promise<void> | void;
};

export function FileFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  layout,
  initialValues,
  isLoading,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onSubmit,
}: FileFormDialogProps) {
  // State to hold form values, which can be strings or File objects
  const [values, setValues] = useState<Record<string, string | File>>({});
  // State specifically for image preview URLs
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fieldsByName = useMemo(() =>
    fields.reduce((acc, field) => {
      acc[field.name] = field;
      return acc;
    }, {} as Record<string, FieldConfig>), [fields]);


  // Effect to initialize form state when `initialValues` change
  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
      // Also set preview URLs for any file fields that have an initial URL
      const previews: Record<string, string> = {};
      layout.fileFields.forEach(fieldName => {
        if (initialValues[fieldName]) {
          previews[fieldName] = initialValues[fieldName];
        }
      });
      setPreviewUrls(previews);
    }
  }, [initialValues, layout.fileFields]);

  // Cleanup effect for blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const handleValueChange = (name: string, value: string | File) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const file = e.target.files?.[0];

    if (file) {
      // Store the actual File object
      handleValueChange(name, file);

      // Create and store a temporary URL for preview
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => {
        // Revoke the old blob URL if it exists
        if (prev[name] && prev[name].startsWith("blob:")) {
            URL.revokeObjectURL(prev[name]);
        }
        return { ...prev, [name]: newPreviewUrl };
      });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    for (const key in values) {
      const value = values[key];
      if (value !== undefined && value !== null) {
        // FormData can handle string and File directly
        formData.append(key, value);
      }
    }

    try {
      await onSubmit(formData);
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      console.error("Submission failed:", error);
      // Optionally, set an error state to show in the UI
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (fieldName: string) => {
    const field = fieldsByName[fieldName];
    if (!field) return null;
    
    // File input with preview
    if (field.type === 'file') {
      return (
        <div key={field.name} className={cn("space-y-2", field.className)}>
          <Label>{field.label}</Label>
          <label
            htmlFor={field.name}
            className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
          >
            {previewUrls[field.name] ? (
              <Image
                src={previewUrls[field.name]}
                alt={`${field.label} Preview`}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Click to browse</span>
                </p>
                <p className="text-xs text-gray-500">Supports JPG, PNG, etc.</p>
              </div>
            )}
            <Input
              id={field.name}
              name={field.name}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              required={field.required}
            />
          </label>
        </div>
      );
    }

    // Select (Dropdown) input
    if (field.type === 'select') {
      return (
         <div key={field.name} className={cn("space-y-2", field.className)}>
            <Label htmlFor={field.name}>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Select 
                onValueChange={(value) => handleValueChange(field.name, value)} 
                value={values[field.name] as string ?? ""}
                required={field.required}
            >
              <SelectTrigger className="w-full mt-1 bg-gray-800 border-gray-700">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-700">
                {field.options?.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
         </div>
      )
    }

    // Default to text-based inputs
    return (
        <div key={field.name} className={cn("space-y-2", field.className)}>
            <Label htmlFor={field.name}>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input
                id={field.name}
                name={field.name}
                type={field.type ?? 'text'}
                value={values[field.name] as string ?? ""}
                onChange={(e) => handleValueChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="mt-1 bg-gray-800 border-gray-700"
            />
        </div>
    );
  };

  const isProcessing = submitting || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-[#1C1C1C] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            {/* Left Column: File Fields */}
            <div className="md:col-span-1 space-y-4">
              {layout.fileFields.map(fieldName => renderField(fieldName))}
            </div>

            {/* Right Column: Data Fields */}
            <div className="md:col-span-2 space-y-4">
              {layout.dataFields.map(fieldName => renderField(fieldName))}
            </div>
          </div>

          <DialogFooter className="mt-8 pt-6 border-t border-gray-700">
            <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="text-white border-gray-600 hover:bg-gray-700"
            >
            {cancelLabel} {/* <-- CHANGE THIS FROM "Cancel" */}
            </Button>
            <Button type="submit" disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
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