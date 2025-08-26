'use client'; 

import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';

import ProtectedRoute from '@/components/auth/protected-route';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from 'next/image';

interface WebSetting {
  settingKey: string;
  settingValue: string;
}

interface SettingsMap {
  [key: string]: string;
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
  }, [logoFile, settings[SETTING_KEYS.LOGO_URL]]);


  const handleInputChange = (key: string, value: string) => {
    setSettings(prevSettings => ({ ...prevSettings, [key]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setLogoFile(event.target.files[0]);
    }
  };

  const handleEraseLogo = () => {
    setLogoFile(null);
    handleInputChange(SETTING_KEYS.LOGO_URL, '');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        await axios.post(`${API_BASE_URL}/api/web-settings`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const textSettings = { ...settings };
      delete textSettings[SETTING_KEYS.LOGO_URL];
      
      const payload = { settings: textSettings };
      await axios.put(`${API_BASE_URL}/api/web-settings`, payload);
      
      toast.success("Successfully Updated", {
        description: `Settings have been saved.`,
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
    <ProtectedRoute>
      <div className="p-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Web Configuration</h1>
              <p className="text-gray-500">Manage general settings for your application.</p>
            </div>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="space-y-8">
            <Card className="border-gray-700">
                <CardHeader>
                    <CardTitle>Branding & Theme</CardTitle>
                    <CardDescription>Customize the look and feel of your application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="app-name">Application Name</Label>
                      <Input
                          id="app-name"
                          value={settings[SETTING_KEYS.NAME] || ''}
                          onChange={(e) => handleInputChange(SETTING_KEYS.NAME, e.target.value)}
                          className="border-gray-700"
                          disabled={isSaving}
                      />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Application Logo</Label>
                        <div className='flex justify-center'>
                          {logoPreview && (
                            <div className="relative mb-4 h-40 w-40 rounded-md border border-gray-500 p-1">
                              <Image
                                  src={logoPreview}
                                  alt="Logo Preview"
                                  fill
                                  className="object-contain"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Input
                                id="logo-file"
                                type="file"
                                accept="image/png, image/jpeg, image/svg+xml"
                                ref={logoInputRef}
                                onChange={handleFileSelect}
                                className="cursor-pointer pt-[3px] border-gray-700 flex-grow file:mr-2 file:px-4 file:rounded-md file:border-0 file-text-sm file:font-semibold file:bg-gray-800/50 file:text-primary"
                                disabled={isSaving}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleEraseLogo}
                                disabled={isSaving || !settings[SETTING_KEYS.LOGO_URL]}
                                className='!bg-red-500 text-white cursor-pointer'
                            >
                                Erase
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500">Select a new logo file or erase the existing one.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="main-theme">Main Theme Color</Label>
                      <Input
                          id="main-theme"
                          value={settings[SETTING_KEYS.MAIN_THEME] || ''}
                          onChange={(e) => handleInputChange(SETTING_KEYS.MAIN_THEME, e.target.value)}
                          placeholder="e.g., dark or #1a202c"
                          className="border-gray-700"
                          disabled={isSaving}
                      />
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}