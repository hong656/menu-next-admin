'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/auth/protected-route';

// Define a type for the user profile data for type safety
interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: number;
  status: number;
}

// Helper function to map role ID to a human-readable name
const getRoleName = (roleId: number): string => {
  const roles: { [key: number]: string } = {
    1: 'User',
    2: 'Editor',
    3: 'Admin', // Based on your example data
  };
  return roles[roleId] || 'Unknown Role';
};

// Helper function to map status ID to a human-readable name and style
const getStatusInfo = (statusId: number): { name: string; className: string } => {
  const statuses: { [key: number]: { name: string; className: string } } = {
    0: { name: 'Inactive', className: 'text-red-500' },
    1: { name: 'Active', className: 'text-green-500' }, // Based on your example
  };
  return statuses[statusId] || { name: 'Unknown', className: 'text-gray-500' };
};

export default function ProfilePage() {
  // State for profile data, loading, and error handling
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to fetch data from the API
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/profile');
        setProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Empty dependency array means this effect runs once on mount

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const statusInfo = getStatusInfo(profile.status);

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-2xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile.username}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={profile.username} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile.fullName || 'Not Provided'}
                  readOnly
                  className="italic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={getRoleName(profile.role)} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={statusInfo.name}
                  readOnly
                  className={statusInfo.className} // Apply color based on status
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input id="userId" value={profile.id} readOnly />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button disabled>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </ProtectedRoute>
  );
}