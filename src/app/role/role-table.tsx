'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FormDialog, FieldConfig } from '@/components/ui/form-dialog';
import {
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
  Ellipsis,
  BadgePlus,
  CheckCircle,
  XCircle,
  Trash2,
  Filter,
  Pencil,
  Trash,
} from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {useTranslations} from 'next-intl';
import { Can } from '@/components/auth/can';

// 1. Updated Type to match the new API response for a Role
type Role = {
  id: number;
  name: string;
  description: string;
  status: number; // 1 = active, 2 = inactive, 3 = deleted
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

// 2. Status configuration is still relevant for the new data structure
const statusConfig = {
  1: {
    text: 'ACTIVE',
    classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  2: {
    text: 'INACTIVE',
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  3: {
    text: 'DELETED',
    classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400',
    icon: <Trash2 className="h-3.5 w-3.5" />,
  },
} as const;

interface TableStatusAction {
  status: number;
  label: string;
  confirmMessage: string;
  color: string;
}

// Action for soft-deleting a role
const statusActions: TableStatusAction[] = [
  {
    status: 3, // This will set the status to "Deleted"
    label: 'Delete',
    confirmMessage: 'Are you sure you want to delete this role? It will be hidden from use.',
    color: 'text-red-500 focus:text-red-500 focus:bg-red-500/10',
  },
];

type Status = keyof typeof statusConfig;
type StatusBadgeProps = { status: number | null };

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const currentStatus = status && statusConfig[status as Status] ? statusConfig[status as Status] : statusConfig[2];
  return (
    <Badge className={cn('inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold', currentStatus.classes)}>
      {currentStatus.icon}
      <span>{currentStatus.text}</span>
    </Badge>
  );
};

// 3. Renamed component to RolesTable
export default function RolesTable(): React.ReactElement {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const t = useTranslations('Button');
  const thead = useTranslations('Sidebar');
  const tdialog = useTranslations('DialogHeader');
  
  // State renamed to reflect "Roles"
  const [pagedRoles, setPagedRoles] = useState<Role[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [filterOpen, setFilterOpen] = useState(false);

  const [confirmationState, setConfirmationState] = useState<{
    roleId: number;
    action: TableStatusAction;
  } | null>(null);

  const fetchRoles = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams();

    params.append('page', (page - 1).toString()); 
    params.append('size', rowsPerPage.toString());

    if (debouncedQuery) {
        params.append('search', debouncedQuery);
    }
    if (status !== 'all') {
        const numericStatus = status === 'active' ? 1 : 2;
        params.append('status', numericStatus.toString());
    }

    try {
      // Assuming the endpoint for roles is /api/roles
      const { data } = await axios.get(`${BACKEND_URL}/api/roles?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setPagedRoles(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setState('success');
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setPagedRoles([]);
      setState('error');
    }
  }, [BACKEND_URL, page, rowsPerPage, debouncedQuery, status]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (page !== 1) setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query, page]);
  
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [status, rowsPerPage]);

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingRole(null);
    }
  }, [editDialogOpen]);

  const roleFormFields: FieldConfig[] = [
    { name: 'name', label: 'Role Name', required: true, placeholder: 'e.g., Content Manager' },
    { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Can create, edit, and manage content.' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '2' }
    ], defaultValue: '1' },
  ];

  const handleCreate = async (values: Record<string, string>) => {
    setIsLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/roles`, {
        name: values.name,
        description: values.description,
        status: Number(values.status),
      });
      await fetchRoles();
      toast.success("Role Created Successfully");
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error("Role Creation Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setEditDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmationState) {
      await updateRoleStatus(confirmationState.roleId, confirmationState.action);
      setConfirmationState(null);
    }
  };

  const updateRoleStatus = async (roleId: number, action: TableStatusAction) => {
    setIsLoading(true);
    try {
      await axios.patch(`${BACKEND_URL}/api/roles/${roleId}`, {
        status: action.status,
      });
      await fetchRoles();
      toast.success("Role Deleted");
    } catch (error) {
      console.error(`Error deleting role:`, error);
      toast.error("Deletion Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (values: Record<string, string>) => {
    if (!editingRole) return;
    setIsLoading(true);
    try {
      await axios.put(`${BACKEND_URL}/api/roles/${editingRole.id}`, {
        name: values.name,
        description: values.description,
        status: Number(values.status),
      });
      await fetchRoles();
      setEditDialogOpen(false);
      toast.success("Role Updated Successfully");
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Update Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      setTempStatus(status);
    }
    setFilterOpen(open);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {/* Changed Title */}
          <h1 className="text-2xl font-bold">{thead('role')}</h1>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className='flex'>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by role name..."
            className="mr-3 w-60"
          />
          <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="border-gray-300">
                <Filter className="h-4 w-4" />
                {t('filter')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
               {/* Filter UI remains the same, which is good */}
               <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={tempStatus}
                    onValueChange={(value) => {
                      if (value === 'all' || value === 'active' || value === 'inactive') {
                        setTempStatus(value);
                      }
                    }}
                  >
                    <SelectTrigger id="status-filter" className="border-gray-300 w-50">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setFilterOpen(false)} className='border cursor-pointer h-8'>{t('cancel')}</Button>
                <Button onClick={() => { setStatus(tempStatus); setFilterOpen(false); }} className='border cursor-pointer h-8'>{t('apply')}</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Can requiredPermissions={['role:create']}>
          <Button onClick={() => setDialogOpen(true)}>
            <BadgePlus /> {t('new')}
          </Button>
        </Can>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {/* 9. Updated Table Headers */}
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="text-base">Name</TableHead>
              <TableHead className="text-base">Description</TableHead>
              <TableHead className="text-base">Status</TableHead>
              <TableHead className="text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && <TableRow><TableCell colSpan={5} className="py-10 text-center">Loading roles...</TableCell></TableRow>}
            {state === 'error' && <TableRow><TableCell colSpan={5} className="py-10 text-center text-red-500">Failed to load roles.</TableCell></TableRow>}
            {state === 'success' && pagedRoles.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center">No roles found.</TableCell></TableRow>}
            
            {/* 10. Updated Table Body to render role data */}
            {state === 'success' && pagedRoles.map((role, idx) => (
              <TableRow key={role.id}>
                <TableCell className='font-bold text-md'>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                <TableCell><span className="font-medium text-md">{role.name}</span></TableCell>
                <TableCell><span className="text-md">{role.description}</span></TableCell>
                <TableCell><StatusBadge status={role.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                        <Ellipsis className='h-5 w-5' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Can requiredPermissions={['role:update']}>
                        <DropdownMenuItem className='text-blue-500 focus:text-blue-500 focus:bg-blue-500/10' onClick={() => handleEdit(role)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      </Can>                      
                      <Can requiredPermissions={['role:delete']}>
                        {statusActions.map((action) => (
                          <DropdownMenuItem
                            key={action.status}
                            className={action.color}
                            onClick={() => setConfirmationState({ roleId: role.id, action })}
                            disabled={isLoading}
                          >
                            <Trash className="mr-2 h-4 w-4" /> {action.label}
                          </DropdownMenuItem>
                        ))}
                      </Can>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ConfirmationDialog
          isOpen={!!confirmationState}
          onClose={() => setConfirmationState(null)}
          onConfirm={handleConfirmAction}
          title={`Confirm: ${confirmationState?.action.label || ''}`}
          description={confirmationState?.action.confirmMessage || ''}
        />
      </div>

      {/* Pagination UI remains the same and works with the new state */}
      <div className="flex items-center justify-between text-sm">
        <div className='font-bold text-muted-foreground'>
          {totalItems === 0 ? '0 items found.' : `Showing ${((page - 1) * rowsPerPage) + 1} to ${Math.min(page * rowsPerPage, totalItems)} of ${totalItems} items.`}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className='font-bold'>Rows per page</span>
            <Select value={String(rowsPerPage)} onValueChange={(val) => setRowsPerPage(Number(val))}>
              <SelectTrigger className="!h-7 w-[70px]"><SelectValue placeholder={rowsPerPage} /></SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className='font-bold'>Page {page} of {totalPages}</span>
            <div className="ml-2 inline-flex rounded-md space-x-2">
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}><ChevronRight className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}><ChevronsRight className='w-4 h-4' /></Button>
            </div>
          </div>
        </div>
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={tdialog('create_role')}
        fields={roleFormFields}
        isLoading={isLoading}
        onSubmit={handleCreate}
      />

      <FormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title={tdialog('update_role')}
        fields={roleFormFields}
        isLoading={isLoading}
        initialValues={editingRole ? {
          name: editingRole.name,
          description: editingRole.description,
          status: editingRole.status != null ? String(editingRole.status) : '1',
        } : undefined}
        onSubmit={handleUpdate}
      />
    </div>
  );
}