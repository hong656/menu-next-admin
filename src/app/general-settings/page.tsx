'use client'; 

import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { HexColorPicker } from 'react-colorful'; // Import the color picker

import ProtectedRoute from '@/components/auth/protected-route';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import Image from 'next/image';

// ... (interfaces and constants remain the same)
interface WebSetting {
  settingKey: string;
  settingValue: string;
}

interface SettingsMap {
  [key:string]: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const SETTING_KEYS = {
  NAME: 'title',
  LOGO_URL: 'logo',
  MAIN_THEME: 'main_theme',
};

export default function GeneralSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // You can add validation for hex colors
  const color = settings[SETTING_KEYS.MAIN_THEME] || '';
  const setColor = (newColor: string) => {
    handleInputChange(SETTING_KEYS.MAIN_THEME, newColor);
  };

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<WebSetting[]>(`${API_BASE_URL}/api/web-settings`);
      const settingsMap = response.data.reduce((acc: SettingsMap, setting: WebSetting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {});
      setSettings(settingsMap);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to fetch settings.');
      } else {
        toast.error('An unknown error occurred during fetch.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (logoFile) {
      const objectUrl = URL.createObjectURL(logoFile);
      setLogoPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      const backendLogoPath = settings[SETTING_KEYS.LOGO_URL];
      if (backendLogoPath) {
        const correctedPath = backendLogoPath.replace('/uploads/images/', '/images/');
        const absoluteLogoUrl = correctedPath.startsWith('/')
          ? `${API_BASE_URL}${correctedPath}`
          : correctedPath;
        setLogoPreview(absoluteLogoUrl);
      } else {
        setLogoPreview('');
      }
    }
  }, [logoFile, settings, API_BASE_URL]);

  const handleInputChange = (key: string, value: string) => {
    setSettings(prevSettings => ({ ...prevSettings, [key]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLogoFile(file);
    }
  };

  const handleEraseLogo = () => {
    setLogoFile(null);
    setSettings(prevSettings => ({ ...prevSettings, [SETTING_KEYS.LOGO_URL]: '' }));
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const updatedSettings = { ...settings };

      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const uploadResponse = await axios.post<{ filePath: string }>(`${API_BASE_URL}/api/web-settings`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        updatedSettings[SETTING_KEYS.LOGO_URL] = uploadResponse.data.filePath;
      }
      
      const payload = { settings: updatedSettings };
      await axios.put(`${API_BASE_URL}/api/web-settings`, payload);
      
      toast.success("Settings Updated", {
        description: "Your changes have been saved successfully.",
      });

      setLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      
      await fetchSettings();

    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to save settings.');
      } else {
        toast.error('An unknown error occurred while saving.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <ProtectedRoute requiredPermissions={['general-setting:read']}>
      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-2xl space-y-8">
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Web Configuration</h1>
            <p className="text-gray-500">Manage general settings for your application.</p>
          </div>

          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle>Branding & Theme</CardTitle>
              <CardDescription>Customize the look and feel of your application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="app-name">Website Name</Label>
                <Input
                  id="app-name"
                  value={settings[SETTING_KEYS.NAME] || ''}
                  onChange={(e) => handleInputChange(SETTING_KEYS.NAME, e.target.value)}
                  className="border-gray-700"
                  disabled={isSaving}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Website Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-md border border-gray-500 p-1">
                      <Image
                        src={logoPreview}
                        alt="Logo Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-gray-500 text-xs text-gray-500">
                      (No logo)
                    </div>
                  )}
                  
                  <div className="flex-grow space-y-2">
                    <Input
                      id="logo-file"
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      ref={logoInputRef}
                      onChange={handleFileSelect}
                      className="cursor-pointer border-gray-700 pt-[3px] file:mr-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-800/40 file:text-primary"
                      disabled={isSaving}
                    />
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500 flex-grow">Recommended: 400x400px.</p>
                      <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleEraseLogo}
                          className='!bg-red-500 hover:!bg-red-700 cursor-pointer'
                          disabled={isSaving || !settings[SETTING_KEYS.LOGO_URL]}
                      >
                          Erase
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="main-theme">Main Theme Color</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-10 p-0 border-gray-700 cursor-pointer"
                        style={{ backgroundColor: color }}
                        disabled={isSaving}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none">
                      <HexColorPicker color={color} onChange={setColor} />
                    </PopoverContent>
                  </Popover>

                  <Input
                    id="main-theme"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g., #1a202c"
                    className="border-gray-700"
                    disabled={isSaving}
                  />
                </div>
              </div>
              {/* --- END MODIFIED SECTION --- */}

            </CardContent>
            <CardFooter className="flex justify-end border-t border-gray-700 pt-6">
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>
    </ProtectedRoute>
  );
}