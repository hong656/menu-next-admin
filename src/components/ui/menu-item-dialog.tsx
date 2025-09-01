'use client';

import React, { useState, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { MenuItem, MenuType } from '@/app/menu-items/menu-items-table';

type LanguageCode = "kh" | "en";

type Translation = {
  name: string;
  description: string;
};

const languageNameMap: Record<LanguageCode, string> = {
  kh: "Khmer",
  en: "English",
};

// --- Component Props ---
type MenuItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
  onSubmit: (formData: FormData) => Promise<void> | void;
  menuTypes: MenuType[];
  initialData?: MenuItem | null; // Pass the item being edited here
};

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export function MenuItemDialog({ open, onOpenChange, isLoading, onSubmit, menuTypes, initialData }: MenuItemDialogProps) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>("kh");
  
  // States for form fields
  const [priceCents, setPriceCents] = useState("");
  const [status, setStatus] = useState("1");
  const [menuTypeId, setMenuTypeId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [translations, setTranslations] = useState<Record<LanguageCode, Translation>>({
    kh: { name: "", description: "" },
    en: { name: "", description: "" },
  });
  
  const [submitting, setSubmitting] = useState(false);

  // This effect populates the form when editing an item
  useEffect(() => {
    if (initialData && open) {
      // Populate shared fields
      setPriceCents(String(initialData.priceCents));
      setStatus(String(initialData.status));
      setMenuTypeId(String(initialData.menuType.id));
      
      // Populate translations
      const newTranslations: Record<LanguageCode, Translation> = {
        kh: { name: "", description: "" },
        en: { name: "", description: "" },
      };
      initialData.translations.forEach(t => {
        if (t.languageCode in newTranslations) {
          newTranslations[t.languageCode as LanguageCode] = { name: t.name, description: t.description };
        }
      });
      setTranslations(newTranslations);

      // Set image preview from existing URL
      if (initialData.imageUrl) {
        const fullUrl = initialData.imageUrl.startsWith('/') ? `${BACKEND_URL}${initialData.imageUrl}` : initialData.imageUrl;
        setImagePreview(fullUrl);
      }

    } else {
      // Reset form when opening for "create" or when closing
      setPriceCents("");
      setStatus("1");
      setMenuTypeId("");
      setImageFile(null);
      setImagePreview(null);
      setTranslations({
        kh: { name: "", description: "" },
        en: { name: "", description: "" },
      });
      setCurrentLang("kh");
    }
  }, [initialData, open]);

  const handleTranslationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTranslations(prev => ({
      ...prev,
      [currentLang]: { ...prev[currentLang], [name]: value },
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveFile = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!translations.en.name || !menuTypeId || !priceCents) {
      toast.error("Missing required fields", { description: "English Name, Type, and Price are required." });
      return;
    }
    if (!initialData && !imageFile) { // Require image on create
        toast.error("Image required", { description: "Please upload an image for the new menu item." });
        return;
    }

    setSubmitting(true);
    
    // Assemble the JSON part
    const menuItemData = {
      priceCents: parseInt(priceCents, 10),
      status: parseInt(status, 10),
      menuTypeId: parseInt(menuTypeId, 10),
      translations: Object.entries(translations)
        .map(([lang, data]) => ({ languageCode: lang, ...data }))
        .filter(t => t.name.trim() !== ""), // Only send translations with a name
    };

    // Create FormData
    const formData = new FormData();
    formData.append("menuItem", JSON.stringify(menuItemData));
    if (imageFile) {
      formData.append("image", imageFile);
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

  const isProcessing = submitting || isLoading;
  const dialogTitle = initialData ? "Edit Menu Item" : "Create Menu Item";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl">{dialogTitle}</DialogTitle>
          <div className="flex items-center space-x-2 pt-2">
            {(["kh", "en"] as LanguageCode[]).map((lang) => (
              <Button key={lang} type="button" variant={currentLang === lang ? "default" : "outline"} onClick={() => setCurrentLang(lang)}>
                {languageNameMap[lang]}
              </Button>
            ))}
          </div>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            <div className="md:col-span-1 space-y-4">
              <div className="space-y-2">
                <Label>Image <span className="text-red-500">*</span></Label>
                <label htmlFor="image-upload" className="!w-64 !h-64 relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer">
                  {imagePreview ? (
                    <>
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        fill
                        sizes="!w-64 !h-64"
                        className="rounded-lg object-cover"
                        />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full z-10" onClick={handleRemoveFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-center"><UploadCloud className="w-10 h-10 mx-auto mb-3 text-gray-400" /><p className="text-sm text-gray-400">Click to browse</p></div>
                  )}
                  <Input id="image-upload" name="image" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            {/* Right Column: Data */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name in {languageNameMap[currentLang]} <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" value={translations[currentLang].name} onChange={handleTranslationChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description in {languageNameMap[currentLang]}</Label>
                <Input id="description" name="description" value={translations[currentLang].description} onChange={handleTranslationChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceCents">Price (in cents) <span className="text-red-500">*</span></Label>
                <Input id="priceCents" name="priceCents" type="number" value={priceCents} onChange={e => setPriceCents(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="menuTypeId">Type <span className="text-red-500">*</span></Label>
                    <Select onValueChange={setMenuTypeId} value={menuTypeId} required>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select a type" /></SelectTrigger>
                        <SelectContent>
                            {menuTypes.map(type => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
            </div>
          </div>
          <DialogFooter className="mt-8 pt-6 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : (initialData ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}