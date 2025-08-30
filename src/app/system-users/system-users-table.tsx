'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
} from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
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

type SystemUser = {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: number | null;
  status: number | null; // 1 = active, 2 = inactive
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

const ROLE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Tester', value: '1' },
  { label: 'User', value: '2' },
  { label: 'Admin', value: '3' },
];

const ROLE_LABEL: Record<number, string> = {
  1: 'Tester',
  2: 'User',
  3: 'Admin',
};

function getRoleLabel(role: number | string | null | undefined): string {
  if (role === null || role === undefined || role === '') return 'N/A';
  const num = typeof role === 'string' ? Number(role) : role;
  return ROLE_LABEL[num as 1 | 2 | 3] ?? 'N/A';
}

  //this is for active and inactive badge
  const statusConfig = {
    1: { // Active
      text: 'ACTIVE',
      classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    2: { // Inactive
      text: 'INACTIVE',
      classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
    3: { // Deleted
      text: 'Delete',
      classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400',
      icon: <Trash2 className="h-3.5 w-3.5 fill-red-400 text-red-700" />,
    },
  } as const;

  interface TableStatusAction {
  status: number;
  label: string;
  confirmMessage: string;
  color: string;
  }

const statusActions: TableStatusAction[] = [
  {
    status: 3,
    label: statusConfig[3].text,
    confirmMessage: 'Are you sure you want to mark this order as complete?',
    color: 'text-red-500 focus:text-red-500 focus:bg-red-500/10',
  },
];

type Status = keyof typeof statusConfig;

type UserStatusBadgeProps = {
  status: number | null;
};

const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
  const currentStatus = status && statusConfig[status as Status] ? statusConfig[status as Status] : statusConfig[2];

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold transition-colors duration-200',
        currentStatus.classes
      )}
    >
      {currentStatus.icon}
      <span>{currentStatus.text}</span>
    </Badge>
  );
};

export default function SystemUsersTable(): React.ReactElement {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const [pagedUsers, setPagedUsers] = useState<SystemUser[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [page, setPage] = useState<number>(1); // UI is 1-based index
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [filterOpen, setFilterOpen] = useState(false);

  const [confirmationState, setConfirmationState] = useState<{
    userId: number;
    action: TableStatusAction;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
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
      const { data } = await axios.get(`${BACKEND_URL}/api/users?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setPagedUsers(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setState('success');
    } catch (err) {
      console.error(err);
      setPagedUsers([]);
      setState('error');
    }
  }, [BACKEND_URL, page, rowsPerPage, debouncedQuery, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (page !== 1) setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [status, rowsPerPage]);

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingUser(null);
    }
  }, [editDialogOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = users;
    if (q) {
      list = list.filter((u) => {
        const name = (u.fullName || u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    if (status !== 'all') {
      const shouldBeActive = status === 'active';
      list = list.filter((u) => (u.status ?? 2) === (shouldBeActive ? 1 : 2));
    }
    return list;
  }, [users, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [query, status, rowsPerPage]);

  // this is for create user
  const fields: FieldConfig[] = [
    { name: 'username', label: 'Username', required: true, placeholder: 'example' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'example@example.com' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
    { name: 'role', label: 'Role', type: 'select', required: true, options: ROLE_OPTIONS, defaultValue: '1' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '2' }
    ], defaultValue: '1' },
  ];

  // this is for edit user
  const editFields: FieldConfig[] = [
    { name: 'username', label: 'Username', required: true, placeholder: 'example' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'example@example.com' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { name: 'role', label: 'Role', type: 'select', required: true, options: ROLE_OPTIONS },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '2' }
    ] },
  ];

  const handleCreate = async (values: Record<string, string>) => {
    const createData = {
      username: values.username,
      email: values.email,
      password: values.password,
      role: Number(values.role),
      status: Number(values.status),
    };

    try {
      await axios.post('http://localhost:8080/api/auth/signup', createData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      await fetchUsers();
      toast.success("User Created", {
        description: `User has been successfully created.`,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error("User Creation Failed", {
        description: "Failed to create user. Please try again.",
      });
    }
  };

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmationState) {
      await updateTableStatus(confirmationState.userId, confirmationState.action);
      setConfirmationState(null);
    }
  };

  const updateTableStatus = async (userId: number, action: TableStatusAction) => {
    setIsLoading(true);
    try {
      await axios.patch(`http://localhost:8080/api/users/delete/${userId}`, {
        status: action.status,
      });
      await fetchUsers();
      toast.success("User Deleted", {
        description: `User has been successfully deleted.`,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || `Failed to update order to ${action.label}`;
      console.error(`Error updating order status to ${action.label}:`, error);
      toast.error("User Deleting Failed", {
        description: "Failed to delete user. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (values: Record<string, string>) => {
    if (!editingUser) return;
    
    try {
      const updateData = {
        username: values.username,
        email: values.email,
        role: Number(values.role),
        password: values.password,
        status: Number(values.status),
      };
      
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${editingUser.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      
      await fetchUsers();
      setEditDialogOpen(false);
      toast.success("User Updated", {
        description: `User has been successfully updated.`,
      });
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error("User Updated Fail", {
        description: `Failed to update user. Please try again.`,
      });
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
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm">Here a list of users!</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className='flex'>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title..."
            className="mr-3 w-60"
          />
          <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500/20 cursor-pointer"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
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
                    <SelectTrigger 
                      id="status-filter" 
                      className="border-gray-300 w-50"
                    >
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem 
                          key={opt.value} 
                          value={opt.value}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setFilterOpen(false)} className='border cursor-pointer h-8'>Cancel</Button>
                <Button onClick={() => {
                  setStatus(tempStatus);
                  setFilterOpen(false);
                }}
                className='border cursor-pointer h-8'>Apply</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="outline" className="cursor-pointer hover:bg-gray-700 hover:text-white border-black bg-gray-900 text-white" onClick={() => setDialogOpen(true)}>
          <BadgePlus /> New
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="text-base">Name</TableHead>
              <TableHead className="text-base">Email</TableHead>
              <TableHead className="text-base">Role</TableHead>
              <TableHead className="text-base">Status</TableHead>
              <TableHead className="text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            )}
            {state === 'error' && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  Failed to load users.
                </TableCell>
              </TableRow>
            )}
            {state === 'success' && pagedUsers.map((user, idx) => (
              <TableRow key={user.id}>
                <TableCell className='font-bold text-md'>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                <TableCell>
                  <span className="text-md">{user.fullName || user.username}</span>
                </TableCell>
                <TableCell>
                  <span className="text-md">{user.email}</span>
                </TableCell>
                <TableCell>{getRoleLabel(user.role)}</TableCell>
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                        <Ellipsis className='h-5 w-5' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className='text-blue-500 focus:text-blue-500 focus:bg-blue-500/10' onClick={() => handleEdit(user)}>Edit</DropdownMenuItem>
                      {statusActions.map((action) => (
                        <DropdownMenuItem
                          key={action.status}
                          className={action.color}
                          onClick={() => setConfirmationState({ userId: user.id, action })}
                          disabled={isLoading}
                        >
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ConfirmationDialog
          isOpen={!!confirmationState}
          onClose={() => setConfirmationState(null)} // Handles Cancel/Esc/Overlay click
          onConfirm={handleConfirmAction}            // Handles the Confirm click
          title={`Confirm Action: ${confirmationState?.action.label || ''}`}
          description={confirmationState?.action.confirmMessage || ''}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className='font-bold'>
          {totalItems === 0
            ? '0 items found.'
            : `Showing ${((page - 1) * rowsPerPage) + 1} to ${Math.min(page * rowsPerPage, totalItems)} of ${totalItems} items.`}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className='font-bold'>Rows per page</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(value) => {
                setRowsPerPage(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className='font-bold'>
              Page {page} of {totalPages}
            </span>
            <div className="ml-2 inline-flex rounded-md shadow-sm space-x-2">
                <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}><ChevronRight className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}><ChevronsRight className='w-4 h-4' /></Button>
            </div>
          </div>
        </div>
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create User"
        description="Create a new system user"
        fields={fields}
        submitLabel="Create"
        cancelLabel="Cancel"
        onSubmit={handleCreate}
      />

      <FormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit User"
        description="Update user information"
        fields={editFields}
        submitLabel="Update"
        cancelLabel="Cancel"
        initialValues={editingUser ? {
          username: editingUser.username,
          email: editingUser.email,
          role: editingUser.role != null ? String(editingUser.role) : '',
          status: editingUser.status != null ? String(editingUser.status) : '1',
        } : undefined}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
