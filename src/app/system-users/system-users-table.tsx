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
import {useTranslations} from 'next-intl';

// --- UPDATED TYPES ---
type Role = {
  id: number;
  name: string;
  description: string;
};

type SystemUser = {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  roles: string[]; // FIX #1: Expect an array of strings, which matches the backend API response
  status: number | null;
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

// --- UNCHANGED CONSTANTS & HELPERS ---
const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

const statusConfig = {
  1: { text: 'ACTIVE', classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  2: { text: 'INACTIVE', classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400', icon: <XCircle className="h-3.5 w-3.5" /> },
  3: { text: 'Delete', classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400', icon: <Trash2 className="h-3.5 w-3.5 fill-red-400 text-red-700" /> },
} as const;

interface TableStatusAction { status: number; label: string; confirmMessage: string; color: string; }
const statusActions: TableStatusAction[] = [
  { status: 3, label: statusConfig[3].text, confirmMessage: 'Are you sure you want to mark this user as deleted?', color: 'text-red-500 focus:text-red-500 focus:bg-red-500/10' },
];

type Status = keyof typeof statusConfig;
type UserStatusBadgeProps = { status: number | null; };
const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
  const currentStatus = status && statusConfig[status as Status] ? statusConfig[status as Status] : statusConfig[2];
  return <Badge className={cn('inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold transition-colors duration-200', currentStatus.classes)}> {currentStatus.icon} <span>{currentStatus.text}</span> </Badge>;
};

export default function SystemUsersTable(): React.ReactElement {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const t = useTranslations('Button');
  const thead = useTranslations('Sidebar');
  const tdialog = useTranslations('DialogHeader');
  const [pagedUsers, setPagedUsers] = useState<SystemUser[]>([]);
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
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{ userId: number; action: TableStatusAction; } | null>(null);

  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [filterRole, setFilterRole] = useState('all');
  const [tempFilterRole, setTempFilterRole] = useState('all');

  useEffect(() => {
    const fetchAllRoles = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/roles`);
        setAvailableRoles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch roles", error);
        toast.error("Could not load roles for filters/forms.");
      }
    };
    fetchAllRoles();
  }, [BACKEND_URL]);

  const fetchUsers = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams();
    params.append('page', (page - 1).toString()); 
    params.append('size', rowsPerPage.toString());
    if (debouncedQuery) params.append('search', debouncedQuery);
    if (status !== 'all') {
      const numericStatus = status === 'active' ? 1 : 2;
      params.append('status', numericStatus.toString());
    }
    if (filterRole !== 'all') {
      params.append('roleId', filterRole);
    }

    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/users?${params.toString()}`, { headers: { Accept: 'application/json' } });
      setPagedUsers(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setState('success');
    } catch (err) {
      console.error(err);
      setPagedUsers([]);
      setState('error');
    }
  }, [BACKEND_URL, page, rowsPerPage, debouncedQuery, status, filterRole]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { const handler = setTimeout(() => { setDebouncedQuery(query); if (page !== 1) setPage(1); }, 500); return () => clearTimeout(handler); }, [query, page]);
  useEffect(() => { if (page !== 1) setPage(1); }, [status, rowsPerPage, filterRole]);
  useEffect(() => { if (!editDialogOpen) { setEditingUser(null); } }, [editDialogOpen]);

  const fields = useMemo((): FieldConfig[] => ([
    { name: 'username', label: 'Username', required: true, placeholder: 'example' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'example@example.com' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
    { name: 'roles', label: 'Role', type: 'select', required: true, options: availableRoles.map(r => ({ label: r.name, value: r.name })), defaultValue: 'USER' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ label: 'Active', value: '1' }, { label: 'Inactive', value: '2' }], defaultValue: '1' },
  ]), [availableRoles]);

  const editFields = useMemo((): FieldConfig[] => ([
    { name: 'username', label: 'Username', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'New Password', type: 'password', placeholder: 'Leave blank to keep current' },
    { name: 'roles', label: 'Role', type: 'select', required: true, options: availableRoles.map(r => ({ label: r.name, value: r.name })) },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ label: 'Active', value: '1' }, { label: 'Inactive', value: '2' }] },
  ]), [availableRoles]);

  const handleCreate = async (values: Record<string, string>) => {
    const createData = {
      username: values.username, email: values.email, password: values.password,
      roles: [values.roles], 
      status: Number(values.status),
    };
    try {
      await axios.post(`${BACKEND_URL}/api/auth/signup`, createData);
      await fetchUsers();
      toast.success("User Created");
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error("User Creation Failed");
    }
  };

  const handleUpdate = async (values: Record<string, string>) => {
    if (!editingUser) return;
    const updateData = {
      username: values.username, email: values.email,
      roles: [values.roles], 
      password: values.password || undefined,
      status: Number(values.status),
    };
    try {
      await axios.put(`${BACKEND_URL}/api/users/${editingUser.id}`, updateData);
      await fetchUsers();
      setEditDialogOpen(false);
      toast.success("User Updated");
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error("User Update Failed");
    }
  };
  
  const handleEdit = (user: SystemUser) => { setEditingUser(user); setEditDialogOpen(true); };
  const handleConfirmAction = async () => { if (confirmationState) { await updateTableStatus(confirmationState.userId, confirmationState.action); setConfirmationState(null); } };
  const updateTableStatus = async (userId: number, action: TableStatusAction) => {
    setIsLoading(true);
    try {
      await axios.patch(`${BACKEND_URL}/api/users/delete/${userId}`, { status: action.status });
      await fetchUsers();
      toast.success("User Deleted");
    } catch (error: any) {
      console.error(`Error deleting user:`, error);
      toast.error("User Deleting Failed");
    } finally {
      setIsLoading(false);
    }
  };
  const handleFilterOpenChange = (open: boolean) => { if (open) { setTempStatus(status); setTempFilterRole(filterRole); } setFilterOpen(open); };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{thead('system_users')}</h1>

      <div className="flex items-center justify-between gap-3">
        <div className='flex'>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by name or email..." className="mr-3 w-60" />
          <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50"><Filter className="h-4 w-4" />{t('filter')}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="grid gap-4">
                <div className="space-y-2"><Label htmlFor="status-filter">Status</Label><Select value={tempStatus} onValueChange={(v) => setTempStatus(v as any)}><SelectTrigger id="status-filter"><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="role-filter">Role</Label><Select value={tempFilterRole} onValueChange={setTempFilterRole}><SelectTrigger id="role-filter"><SelectValue placeholder="All Roles" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem>{availableRoles.map(role => <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="flex justify-end gap-2 mt-4"><Button variant="ghost" onClick={() => setFilterOpen(false)}>{t('cancel')}</Button><Button onClick={() => { setStatus(tempStatus); setFilterRole(tempFilterRole); setFilterOpen(false); }}>{t('apply')}</Button></div>
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={() => setDialogOpen(true)}><BadgePlus /> {t('new')}</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead className="w-16">#</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {state === 'loading' && <TableRow><TableCell colSpan={6} className="py-10 text-center">Loading users...</TableCell></TableRow>}
            {state === 'error' && <TableRow><TableCell colSpan={6} className="py-10 text-center text-red-500">Failed to load users.</TableCell></TableRow>}
            {state === 'success' && pagedUsers.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center">No results found.</TableCell></TableRow>}
            {state === 'success' && pagedUsers.map((user, idx) => (
              <TableRow key={user.id}>
                <TableCell className='font-bold'>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                <TableCell>{user.fullName || user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                {/* FIX #2: Map over the array of strings and use the string as the key */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map(roleName => (
                      <Badge key={roleName} variant="secondary">{roleName}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell><UserStatusBadge status={user.status} /></TableCell>
                {/* FIX #3: Added 'key' prop to the DropdownMenuItem inside the map to resolve the warning */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <Ellipsis className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-blue-500 focus:text-blue-500 focus:bg-blue-500/10"
                        onClick={() => handleEdit(user)}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      {statusActions.map((action) => (
                        <DropdownMenuItem
                          key={action.status}
                          className={action.color}
                          onClick={() => setConfirmationState({ userId: user.id, action })}
                          disabled={isLoading}
                        >
                          <Trash className="mr-2 h-4 w-4" /> {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* FIX #4: Correctly formatted pagination controls */}
      <div className="flex items-center justify-between text-sm">
        <div className="font-bold text-muted-foreground">
          {totalItems === 0
            ? '0 items found.'
            : `Showing ${((page - 1) * rowsPerPage) + 1} to ${Math.min(page * rowsPerPage, totalItems)} of ${totalItems} items.`}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold">Rows per page</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(val) => setRowsPerPage(Number(val))}
            >
              <SelectTrigger className="w-[70px] !h-7">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">
              Page {page} of {totalPages}
            </span>
            <div className="ml-2 inline-flex rounded-md space-x-2">
              <Button variant="outline" size="icon" className="h-7" onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline" size="icon" className="h-7"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline" size="icon" className="h-7"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={tdialog('create_user')} fields={fields} onSubmit={handleCreate} />
      <FormDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        title={tdialog('update_user')} 
        fields={editFields} 
        initialValues={editingUser ? {
          username: editingUser.username,
          email: editingUser.email,
          roles: editingUser.roles[0] || '', 
          status: editingUser.status != null ? String(editingUser.status) : '1',
        } : undefined}
        onSubmit={handleUpdate}
      />
      <ConfirmationDialog isOpen={!!confirmationState} onClose={() => setConfirmationState(null)} onConfirm={handleConfirmAction} title={`Confirm Action: ${confirmationState?.action.label || ''}`} description={confirmationState?.action.confirmMessage || ''} />
      <Toaster richColors />
    </div>
  );
}