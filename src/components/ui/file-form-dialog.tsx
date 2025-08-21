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
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner"; // Ensure toast is imported

// ... (FieldConfig and FileFormDialogProps types remain the same)
export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "select" | "file";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  className?: string;
};

export type FileFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  layout: {
    fileFields: string[];
    dataFields: string[];
  };
  initialValues?: Record<string, string>;
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
  const [values, setValues] = useState<Record<string, string | File>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fieldsByName = useMemo(() =>
    fields.reduce((acc, field) => {
      acc[field.name] = field;
      return acc;
    }, {} as Record<string, FieldConfig>), [fields]);

  const resetForm = () => {
    setValues({});
    setPreviewUrls({});
    setFileErrors({});
  };

  // --- ⭐️ MAJOR CHANGE HERE: Improved Initialization Logic ---
  useEffect(() => {
    if (open) {
      // Case 1: Editing an existing item
      if (initialValues) {
        setValues(initialValues);
        const previews: Record<string, string> = {};
        layout.fileFields.forEach(fieldName => {
          if (initialValues[fieldName]) {
            previews[fieldName] = initialValues[fieldName];
          }
        });
        setPreviewUrls(previews);
      } 
      // Case 2: Creating a new item
      else {
        // Initialize all form fields with an empty string.
        // This ensures every field, including 'image', exists in the `values` state object.
        const initialFormState = fields.reduce((acc, field) => {
          acc[field.name] = '';
          return acc;
        }, {} as Record<string, string | File>);
        setValues(initialFormState);
      }
    } 
    // Case 3: Dialog is closing
    else {
      resetForm();
    }
    // Add `fields` to the dependency array as it's used for initialization
  }, [open, initialValues, layout.fileFields, fields]);


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
      if (!file.type.startsWith("image/")) {
        setFileErrors(prev => ({ ...prev, [name]: "Invalid file type. Please select an image." }));
        e.target.value = ""; 
        return;
      }

      setFileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      
      handleValueChange(name, file);

      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => {
        if (prev[name] && prev[name].startsWith("blob:")) {
            URL.revokeObjectURL(prev[name]);
        }
        return { ...prev, [name]: newPreviewUrl };
      });
    }
  };

  const handleRemoveFile = (fieldName: string) => {
    // Set the value to an empty string to signify it's been removed
    setValues(prev => ({...prev, [fieldName]: ""}));
    
    setFileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
    });
    setPreviewUrls(prev => {
        const newPreviews = { ...prev };
        const urlToRevoke = newPreviews[fieldName];
        if (urlToRevoke && urlToRevoke.startsWith("blob:")) {
            URL.revokeObjectURL(urlToRevoke);
        }
        delete newPreviews[fieldName];
        return newPreviews;
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- Validation Logic (Now works reliably) ---
    for (const field of fields) {
      if (field.required) {
        const value = values[field.name];
        // The check `!value` will now correctly catch an empty string '' for the image field
        if (!value) {
          toast.error("Missing Information", {
            description: `The "${field.label}" field is required. Please provide a value.`,
          });
          return; // Stop submission
        }
      }
    }
    
    setSubmitting(true);
    const formData = new FormData();
    for (const key in values) {
      const value = values[key];
      if (value instanceof File || (typeof value === 'string' && value !== '')) {
        formData.append(key, value);
      }
    }

    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ... (The entire `renderField` function and the JSX return statement remain exactly the same)
  const renderField = (fieldName: string) => {
    const field = fieldsByName[fieldName];
    if (!field) return null;
    
    if (field.type === 'file') {
      return (
        <div key={field.name} className={cn("space-y-2", field.className)}>
          <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
          <label
            htmlFor={field.name}
            className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer transition-colors"
          >
            {previewUrls[field.name] ? (
              <>
                <Image
                    src={previewUrls[field.name]}
                    alt={`${field.label} Preview`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveFile(field.name);
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to browse</span></p>
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
              value=""
            />
          </label>
          {fileErrors[field.name] && (
            <p className="text-sm text-red-500">{fileErrors[field.name]}</p>
          )}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
         <div key={field.name} className={cn("space-y-2", field.className)}>
            <Label htmlFor={field.name}>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Select 
                onValueChange={(value) => handleValueChange(field.name, value)} 
                value={values[field.name] as string ?? ""}
                required={field.required}
            >
              <SelectTrigger className="w-full mt-1 border-gray-700"><SelectValue placeholder={field.placeholder} /></SelectTrigger>
              <SelectContent className="border-gray-700">
                {field.options?.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
              </SelectContent>
            </Select>
         </div>
      )
    }

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
                className="mt-1 border-gray-700"
            />
        </div>
    );
  };
  
  const isProcessing = submitting || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            <div className="md:col-span-1 space-y-4">{layout.fileFields.map(fieldName => renderField(fieldName))}</div>
            <div className="md:col-span-2 space-y-4">{layout.dataFields.map(fieldName => renderField(fieldName))}</div>
          </div>
          <DialogFooter className="mt-8 pt-6 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <Button type="submit" className="cursor-pointer " disabled={isProcessing}>
              {isProcessing ? (
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