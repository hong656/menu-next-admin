'use client';

import React, { useState, useEffect, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MenuType } from '@/app/menu-types/menu-type-table';
import { cn } from "@/lib/utils";

type LanguageCode = "kh" | "en" | "ch";

type Translation = {
  name: string;
};

const languageNameMap: Record<LanguageCode, string> = {
  kh: "Khmer",
  en: "English",
  ch: "Chinese",
};

// This is the structure the backend expects in the request body
export type MenuTypeRequestData = {
    status: number;
    description?: string;
    className?: string;
    translations: {
        languageCode: string;
        name: string;
    }[];
};

// --- Component Props ---
type MenuTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MenuTypeRequestData) => Promise<void> | void;
  initialData?: MenuType | null;
  className?: string;
  description?: string;
};


export function MenuTypeDialog({ open, onOpenChange, onSubmit, initialData, className, description }: MenuTypeDialogProps) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>("kh");
  
  // States for form fields
  const [status, setStatus] = useState("1"); // Default to Active
  const [translations, setTranslations] = useState<Record<LanguageCode, Translation>>({
    kh: { name: "" },
    en: { name: "" },
    ch: { name: "" },
  });
  
  const [submitting, setSubmitting] = useState(false);

  // This effect populates the form when editing an item
  useEffect(() => {
    if (initialData && open) {
      setStatus(String(initialData.status));
      
      const newTranslations: Record<LanguageCode, Translation> = { kh: { name: "" }, en: { name: "" }, ch: { name: "" } };
      initialData.translations.forEach(t => {
        if (t.languageCode in newTranslations) {
          newTranslations[t.languageCode as LanguageCode] = { name: t.name };
        }
      });
      setTranslations(newTranslations);
    } else {
      // Reset form when opening for "create" or when closing
      setStatus("1");
      setTranslations({ kh: { name: "" }, en: { name: "" }, ch: { name: "" } });
      setCurrentLang("kh");
    }
  }, [initialData, open]);

  const handleTranslationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setTranslations(prev => ({
      ...prev,
      [currentLang]: { name: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!translations.en.name) {
      toast.error("English name is required.");
      return;
    }

    setSubmitting(true);
    
    // Assemble the JSON object in the exact format the backend expects
    const menuTypeData: MenuTypeRequestData = {
      status: parseInt(status, 10),
      translations: Object.entries(translations)
        .map(([lang, data]) => ({ languageCode: lang, name: data.name }))
        .filter(t => t.name.trim() !== ""), // Only send translations that have a name
    };

    try {
      await onSubmit(menuTypeData); // Pass the prepared data to the parent
      onOpenChange(false);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle = initialData ? "Edit Menu Type" : "Create Menu Type";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
      className={cn("sm:max-w-md", className)}
      aria-describedby={description ? undefined : ""}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">{dialogTitle}</DialogTitle>
           <div className="flex items-center space-x-2 pt-2">
            {(["kh", "en", "ch"] as LanguageCode[]).map((lang) => (
              <Button key={lang} type="button" variant={currentLang === lang ? "default" : "outline"} onClick={() => setCurrentLang(lang)}>
                {languageNameMap[lang]}
              </Button>
            ))}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name in {languageNameMap[currentLang]} <span className="text-red-500">*</span></Label>
                <Input placeholder="Enter name" id="name" name="name" value={translations[currentLang].name} onChange={handleTranslationChange} required />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                  <Select onValueChange={setStatus} value={status} required>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="1">Active</SelectItem>
                          <SelectItem value="2">Inactive</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : (initialData ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}