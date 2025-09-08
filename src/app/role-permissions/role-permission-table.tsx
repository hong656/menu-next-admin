'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ChevronRight, Loader2, Save, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// --- DATA TYPES (No changes here) ---
type PermissionDetail = {
  id: number;
  name: string;
  slug: string;
};

type Permission = {
  id: number;
  name: string;
  permissionDetails: PermissionDetail[];
};

type PermissionGroup = {
  id: number;
  name: string;
  permissions: Permission[];
};

type Role = {
  id: number;
  name: string;
  description: string;
  permissionDetailIds: number[];
};

// --- THE MAIN PAGE COMPONENT (No changes here) ---
export default function AssignPermissionsTable() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await axios.get<{ items: Role[] }>(`${BACKEND_URL}/api/roles`);
      setRoles(data.items || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles.');
    }
  }, [BACKEND_URL]);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get<PermissionGroup[]>(`${BACKEND_URL}/api/roles/permissions`);
      setPermissionGroups(data || []);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      toast.error('Failed to load permissions.');
    } finally {
      setIsLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);
  
  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    if (!roleId) {
      setSelectedPermissionIds(new Set());
      return;
    }
    const selectedRole = roles.find((r) => r.id === Number(roleId));
    if (selectedRole) {
      setSelectedPermissionIds(new Set(selectedRole.permissionDetailIds));
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      toast.warning('Please select a role first.');
      return;
    }
    setIsSaving(true);
    try {
        await axios.put(`${BACKEND_URL}/api/roles/${selectedRoleId}/permissions`, {
            permissionDetailIds: Array.from(selectedPermissionIds),
        });
        toast.success('Permissions updated successfully!');
        fetchRoles();
    } catch (error) {
        console.error('Failed to save permissions:', error);
        toast.error('Failed to save permissions.');
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDetailCheck = (detailId: number, isChecked: boolean) => {
    const newSelection = new Set(selectedPermissionIds);
    if (isChecked) newSelection.add(detailId);
    else newSelection.delete(detailId);
    setSelectedPermissionIds(newSelection);
  };

  const handlePermissionCheck = (permission: Permission, isChecked: boolean) => {
    const newSelection = new Set(selectedPermissionIds);
    permission.permissionDetails.forEach((detail) => {
      if (isChecked) newSelection.add(detail.id);
      else newSelection.delete(detail.id);
    });
    setSelectedPermissionIds(newSelection);
  };
  
  const handleGroupCheck = (group: PermissionGroup, isChecked: boolean) => {
    const newSelection = new Set(selectedPermissionIds);
    group.permissions.forEach((permission) => {
      permission.permissionDetails.forEach((detail) => {
        if (isChecked) newSelection.add(detail.id);
        else newSelection.delete(detail.id);
      });
    });
    setSelectedPermissionIds(newSelection);
  };

  const filteredPermissionGroups = useMemo(() => {
    if (!searchTerm) return permissionGroups;
    const lowercasedFilter = searchTerm.toLowerCase();
    return permissionGroups.map(group => {
      const filteredPermissions = group.permissions.map(permission => {
        const filteredDetails = permission.permissionDetails.filter(detail =>
          detail.name.toLowerCase().includes(lowercasedFilter)
        );
        if (filteredDetails.length > 0) return { ...permission, permissionDetails: filteredDetails };
        if (permission.name.toLowerCase().includes(lowercasedFilter)) return permission;
        return null;
      }).filter(Boolean) as Permission[];
      if (filteredPermissions.length > 0) return { ...group, permissions: filteredPermissions };
      if (group.name.toLowerCase().includes(lowercasedFilter)) return group;
      return null;
    }).filter(Boolean) as PermissionGroup[];
  }, [permissionGroups, searchTerm]);

  return (
    <div className="p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold">Assign Permission To Role</h1>
        <Card>
            <CardHeader className='p-4 border-b'>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search menu name..."
                            className="pl-9 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-grow sm:flex-grow-0 sm:w-64">
                        <Select value={selectedRoleId} onValueChange={handleRoleChange}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="-- Select Role --" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={String(role.id)}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving || !selectedRoleId} className='ml-auto h-10'>
                        {isSaving ? (
                             <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Save</>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className='p-6'>
                {isLoading ? (
                    <div className="flex items-center justify-center h-60">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-2">
                       {filteredPermissionGroups.map((group) => (
                         <PermissionGroupNode
                           key={group.id}
                           group={group}
                           selectedIds={selectedPermissionIds}
                           onGroupCheck={handleGroupCheck}
                           onPermissionCheck={handlePermissionCheck}
                           onDetailCheck={handleDetailCheck}
                           isInitiallyOpen={!!searchTerm}
                         />
                       ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

// --- UPDATED NODE COMPONENTS TO FIX HYDRATION ERROR ---

interface PermissionGroupNodeProps {
    group: PermissionGroup;
    selectedIds: Set<number>;
    onGroupCheck: (group: PermissionGroup, isChecked: boolean) => void;
    onPermissionCheck: (permission: Permission, isChecked: boolean) => void;
    onDetailCheck: (detailId: number, isChecked: boolean) => void;
    isInitiallyOpen?: boolean;
}

function PermissionGroupNode({ group, selectedIds, onGroupCheck, onPermissionCheck, onDetailCheck, isInitiallyOpen = false }: PermissionGroupNodeProps) {
    const allDetailIdsInGroup = useMemo(() => group.permissions.flatMap(p => p.permissionDetails.map(d => d.id)), [group]);
    const selectedCountInGroup = useMemo(() => allDetailIdsInGroup.filter(id => selectedIds.has(id)).length, [allDetailIdsInGroup, selectedIds]);
    const groupCheckedState = selectedCountInGroup === 0 ? false : selectedCountInGroup === allDetailIdsInGroup.length ? true : 'indeterminate';

    return (
        <Collapsible defaultOpen={isInitiallyOpen} className="space-y-2">
            <div className="flex items-center space-x-3 p-2.5 rounded-md transition-colors hover:bg-muted/50">
                <Checkbox
                  className='w-6 h-6 cursor-pointer'
                  id={`group-${group.id}`}
                  checked={groupCheckedState}
                  onCheckedChange={(isChecked) => onGroupCheck(group, !!isChecked)}
                />
                <CollapsibleTrigger asChild>
                    <div className="flex flex-1 items-center text-left cursor-pointer">
                        <label htmlFor={`group-${group.id}`} className="font-semibold text-base flex-1 cursor-pointer">
                            {group.name}
                        </label>
                        <ChevronRight className='h-5 w-5 transition-transform duration-300 ease-in-out data-[state=open]:rotate-90' />
                    </div>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                <div className="pl-6 space-y-1 py-2">
                    {group.permissions.map((permission) => (
                        <PermissionNode
                            key={permission.id}
                            permission={permission}
                            selectedIds={selectedIds}
                            onPermissionCheck={onPermissionCheck}
                            onDetailCheck={onDetailCheck}
                            isInitiallyOpen={isInitiallyOpen}
                        />
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}


interface PermissionNodeProps {
    permission: Permission;
    selectedIds: Set<number>;
    onPermissionCheck: (permission: Permission, isChecked: boolean) => void;
    onDetailCheck: (detailId: number, isChecked: boolean) => void;
    isInitiallyOpen?: boolean;
}

function PermissionNode({ permission, selectedIds, onPermissionCheck, onDetailCheck, isInitiallyOpen = false }: PermissionNodeProps) {
    const allDetailIdsInPermission = useMemo(() => permission.permissionDetails.map(d => d.id), [permission]);
    const selectedCountInPermission = useMemo(() => allDetailIdsInPermission.filter(id => selectedIds.has(id)).length, [allDetailIdsInPermission, selectedIds]);
    const permissionCheckedState = selectedCountInPermission === 0 ? false : selectedCountInPermission === allDetailIdsInPermission.length ? true : 'indeterminate';

    return (
        <Collapsible defaultOpen={isInitiallyOpen} className="space-y-2">
            <div className="flex items-center space-x-3 p-2.5 rounded-md transition-colors hover:bg-muted/50">
                <Checkbox
                  className='w-5 h-5 cursor-pointer'
                  id={`permission-${permission.id}`}
                  checked={permissionCheckedState}
                  onCheckedChange={(isChecked) => onPermissionCheck(permission, !!isChecked)}
                />
                <CollapsibleTrigger asChild>
                    <div className="flex flex-1 items-center text-left cursor-pointer">
                        <label htmlFor={`permission-${permission.id}`} className="font-medium text-base flex-1 cursor-pointer">
                            {permission.name}
                        </label>
                        <ChevronRight className='h-5 w-5 transition-transform duration-300 ease-in-out data-[state=open]:rotate-90' />
                    </div>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                <div className="pl-10 space-y-3 pt-2 pb-1">
                    {permission.permissionDetails.map((detail) => (
                        <div key={detail.id} className="flex items-center space-x-3">
                            <Checkbox
                              className='w-4 h-4 cursor-pointer'
                              id={`detail-${detail.id}`}
                              checked={selectedIds.has(detail.id)}
                              onCheckedChange={(isChecked) => onDetailCheck(detail.id, !!isChecked)}
                            />
                            <label htmlFor={`detail-${detail.id}`} className="text-sm text-muted-foreground cursor-pointer">
                                {detail.name}
                            </label>
                        </div>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}