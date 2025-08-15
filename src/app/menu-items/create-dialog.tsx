// src/components/users/CreateUserDialog.tsx

'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadCloud } from 'lucide-react';
import Image from 'next/image';

// This is a self-contained component with its own trigger
export function CreateDialog() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: '',
    status: true,
    password: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create New User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-[#1C1C1C] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New User</DialogTitle>
          <DialogDescription>
            Fields marked with <span className="text-red-500">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
            {/* Left Column: Avatar Upload */}
            <div className="md:col-span-1">
              <Label htmlFor="avatar" className="text-sm font-medium">Avatar</Label>
              <div className="mt-2">
                <label
                  htmlFor="avatar-upload"
                  className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Avatar Preview"
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                      <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to browse</span> or drag & drop
                      </p>
                      <p className="text-xs text-gray-500">Supports JPG, PNG, WEBP, etc.</p>
                    </div>
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>

            {/* Right Column: User Details */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="mt-1 bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  className="mt-1 bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  className="mt-1 bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                <Select onValueChange={handleSelectChange} value={formData.role}>
                  <SelectTrigger className="w-full mt-1 bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold">Set Password</h3>
            <div className="mt-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <DialogFooter className="mt-8">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="text-white border-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}