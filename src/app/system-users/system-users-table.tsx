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
} from 'lucide-react';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export default function SystemUsersTable(): React.ReactElement {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  //this is call users
  const fetchUsers = useCallback(async () => {
    setState('loading');
    try {
      const { data } = await axios.get<SystemUser[]>('http://localhost:8080/api/users', {
        headers: { Accept: 'application/json' },
      });
      setUsers(Array.isArray(data) ? data : []);
      setState('success');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingUser(null);
    }
  }, [editDialogOpen]);

  //this is for active and inactive badge
  const statusConfig = {
    active: {
      text: 'ACTIVE',
      classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
      icon: <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />,
    },
    inactive: {
      text: 'INACTIVE',
      classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
      icon: <XCircle className="h-3.5 w-3.5 fill-yellow-400 text-yellow-700" />,
    },
    deleted: {
      text: 'DELETED',
      classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400',
      icon: <XCircle className="h-3.5 w-3.5 fill-red-400 text-red-700" />,
    },
  } as const;

  type UserStatusBadgeProps = {
    status: number | null;
  };

  const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
      let currentStatus;
      if (status === 1) {
        currentStatus = statusConfig.active;
      } else if (status === 2) {
        currentStatus = statusConfig.inactive;
      } else if (status === 3) {
        currentStatus = statusConfig.deleted;
      } else {
        currentStatus = statusConfig.inactive;
      }
  
    return (
      <Badge
        className={cn(
          'inline-flex items-center gap-1 px-3 py-1 text-xm font-semibold transition-colors duration-200',
          currentStatus.classes
        )}
      >
        {currentStatus.icon}
        <span>{currentStatus.text}</span>
      </Badge>
    );
  };

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
    { name: 'role', label: 'Role', type: 'select', required: true, options: ROLE_OPTIONS },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '2' }
    ] },
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
    await axios.post('http://localhost:8080/api/auth/signup', createData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    await fetchUsers();
  };

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
          const deleteData = {
            status: 3,
          };
        await axios.patch(`http://localhost:8080/api/users/delete/${userId}`, deleteData, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
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
      
      await axios.put(`http://localhost:8080/api/users/${editingUser.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      
      await fetchUsers();
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm">Here a list of users!</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or email..."
            className="mr-3 w-64 rounded-md border border-gray-700 px-3 py-2 text-smplaceholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <select
            value={status}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all' || val === 'active' || val === 'inactive') {
                setStatus(val);
              }
            }}
            className="rounded-md border border-gray-700 px-3 py-2 text-smfocus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-900">
                {opt.label}
              </option>
            ))}
          </select>
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
            {state === 'success' && pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
            {state !== 'loading' && pageRows.map((user, idx) => (
              <TableRow key={user.id}>
                <TableCell className='font-bold text-md'>{start + idx + 1}</TableCell>
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
                <TableCell className="text-right ">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Ellipsis className='cursor-pointer w-5 h-5' />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        variant="destructive" 
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className='font-bold'>
          {filtered.length === 0
            ? '0 of 0 row(s) selected.'
            : `${pageRows.length} of ${filtered.length} row(s) shown.`}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className='font-bold'>Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="rounded-md border border-gray-700 bg-transparent px-2 py-1focus:outline-none"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n} className="bg-gray-900">{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className='font-bold'>
              Page {currentPage} of {pageCount}
            </span>
            <div className="ml-2 inline-flex rounded-md space-x-3">
              <button
                className="border cursor-pointer border-gray-700 rounded-sm px-2 py-1"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className='w-4 h-4' />
              </button>
              <button
                className="border cursor-pointer border-gray-700 rounded-sm px-2 py-1"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <button
                className="border cursor-pointer border-gray-700 rounded-sm px-2 py-1"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
              >
                <ChevronRight className='w-4 h-4' />
              </button>
              <button
                className="border cursor-pointer border-gray-700 rounded-sm px-2 py-1"
                onClick={() => setPage(pageCount)}
                disabled={currentPage === pageCount}
              >
                <ChevronsRight className='w-4 h-4' />
              </button>
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
