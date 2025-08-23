'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import NextImage from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FileFormDialog, FieldConfig } from '@/components/ui/file-form-dialog';
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
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

// --- NEW BANNER TYPE ---
type Banner = {
  id: number;
  title: string;
  bannerImage?: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

// Helper function to check for a valid, absolute URL
const isUrlValid = (url: string | null | undefined): url is string => {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

// --- STATUS CONFIG (Generic and Reusable) ---
const statusConfig = {
  1: { // Active
    text: 'ACTIVE',
    classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
    icon: <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />,
  },
  2: { // Inactive
    text: 'INACTIVE',
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
    icon: <XCircle className="h-3.5 w-3.5 fill-yellow-400 text-yellow-700" />,
  },
  3: { // Deleted
    text: 'DELETE',
    classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400',
    icon: <Trash2 className="h-3.5 w-3.5 fill-red-400 text-red-700" />,
  },
} as const;

interface BannerStatusAction {
  status: number;
  label: string;
  confirmMessage: string;
  color: string;
}

const statusActions: BannerStatusAction[] = [
    {
        status: 3,
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this banner?',
        color: 'text-red-500 focus:text-red-500 focus:bg-red-500/10',
    },
];

type Status = keyof typeof statusConfig;

type StatusBadgeProps = {
  status: number | null;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const currentStatus = status && statusConfig[status as Status] ? statusConfig[status as Status] : statusConfig[2];
  return (
    <Badge className={cn('inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold', currentStatus.classes)}>
      {currentStatus.icon}
      <span>{currentStatus.text}</span>
    </Badge>
  );
};


export default function BannerTable(): React.ReactElement {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // --- STATE UPDATED FOR BANNERS ---
  const [banners, setBanners] = useState<Banner[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (previewImage) {
      setImageSize({ width: 0, height: 0 });
    }
  }, [previewImage]);

  const [confirmationState, setConfirmationState] = useState<{
    bannerId: number;
    action: BannerStatusAction;
  } | null>(null);

  // --- API CALLS UPDATED FOR BANNERS ---
  const fetchBanners = useCallback(async () => {
    setState('loading');
    try {
      const { data } = await axios.get<Banner[]>(`${BACKEND_URL}/api/banners`, {
        headers: { Accept: 'application/json' },
      });
      setBanners(Array.isArray(data) ? data : []);
      setState('success');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingBanner(null);
    }
  }, [editDialogOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = banners;

    if (q) {
      // Filter by title
      list = list.filter((banner) => banner.title.toLowerCase().includes(q));
    }

    if (status !== 'all') {
      const numericStatus = status === 'active' ? 1 : 2;
      list = list.filter((banner) => banner.status === numericStatus);
    }

    return list;
  }, [banners, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [query, status, rowsPerPage]);

  // --- FORM FIELDS UPDATED FOR BANNERS ---
  const fields: FieldConfig[] = [
    { name: 'title', label: 'Title', required: true, placeholder: 'e.g., Summer Promotion' },
    { name: 'image', label: 'Banner Image', type: 'file', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '2' }
    ], defaultValue: '1' },
  ];

  const editFields: FieldConfig[] = fields.map(field => ({ ...field, required: false }));

  const handleCreate = async (formData: FormData) => {
    try {
      await axios.post(`${BACKEND_URL}/api/banners`, formData);
      await fetchBanners();
      setDialogOpen(false);
      toast.success("Banner Created", { description: "The new banner has been successfully added." });
    } catch (error) {
      console.error('Error creating banner:', error);
      toast.error("Creation Failed", { description: "Could not create the banner. Please try again." });
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setEditDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmationState) {
      await updateBannerStatus(confirmationState.bannerId, confirmationState.action);
      setConfirmationState(null);
    }
  };

  const updateBannerStatus = async (bannerId: number, action: BannerStatusAction) => {
    setIsLoading(true);
    try {
      await axios.patch(`${BACKEND_URL}/api/banners/${bannerId}`, { status: action.status });
      await fetchBanners();
      toast.success("Banner Deleted", { description: "The banner has been successfully deleted." });
    } catch (error: any) {
      console.error(`Error updating banner status to ${action.label}:`, error);
      toast.error("Delete Failed", { description: "The banner could not be deleted. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingBanner) return;
    try {
      await axios.put(`${BACKEND_URL}/api/banners/${editingBanner.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchBanners();
      setEditDialogOpen(false);
      toast.success("Banner Updated", { description: "The banner has been successfully updated." });
      setEditingBanner(null);
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error("Update Failed", { description: "The banner could not be updated. Please try again." });
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="mt-1 text-sm">Here is a list of your Banners!</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title..."
            className="mr-3 w-64 rounded-md border border-gray-700 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-md border border-gray-700 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label}</option>
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
              <TableHead className="text-base w-[150px]">Image</TableHead>
              <TableHead className="text-base">Title</TableHead>
              <TableHead className="text-base">Status</TableHead>
              <TableHead className="text-base">Created At</TableHead>
              <TableHead className="text-base">Updated At</TableHead>
              <TableHead className="text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && <TableRow><TableCell colSpan={7} className="py-10 text-center">Loading banners...</TableCell></TableRow>}
            {state === 'error' && <TableRow><TableCell colSpan={7} className="py-10 text-center text-red-500">Failed to load banners.</TableCell></TableRow>}
            {state === 'success' && pageRows.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center">No results found.</TableCell></TableRow>}
            
            {state === 'success' && pageRows.map((banner, idx) => {
              const absolutebannerImage = banner.bannerImage && banner.bannerImage.startsWith('/')
                ? `${BACKEND_URL}${banner.bannerImage}`
                : banner.bannerImage;

              return (
                <TableRow key={banner.id}>
                  <TableCell className='font-bold text-md'>{start + idx + 1}</TableCell>
                  <TableCell>
                    <div className="relative group w-[120px] h-[60px]">
                      {isUrlValid(absolutebannerImage) ? (
                        <>
                          <NextImage
                            src={absolutebannerImage}
                            alt={banner.title}
                            fill
                            className="rounded-md object-cover z-10" // <-- ADD z-10 HERE
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={currentPage === 1 && idx === 0}
                          />
                          <div
                            className="absolute inset-0 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md z-20" // <-- ADD z-20 HERE
                            onClick={() => setPreviewImage(absolutebannerImage)}
                          >
                            <Eye className="text-white h-6 w-6" />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-md text-gray-400 bg-gray-400/20 border-2 border-dashed">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-md font-medium">{banner.title}</span></TableCell>
                  <TableCell><StatusBadge status={banner.status} /></TableCell>
                  <TableCell className='text-sm text-gray-400'>{formatDate(banner.createdAt)}</TableCell>
                  <TableCell className='text-sm text-gray-400'>{formatDate(banner.updatedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer"><Ellipsis className='h-5 w-5' /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className='text-blue-500 focus:text-blue-500 focus:bg-blue-500/10' onClick={() => handleEdit(banner)}>Edit</DropdownMenuItem>
                        {statusActions.map((action) => (
                            <DropdownMenuItem key={action.status} className={action.color} onClick={() => setConfirmationState({ bannerId: banner.id, action })} disabled={isLoading || banner.status === action.status}>
                                {action.label}
                            </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )}
            )}
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
            className="rounded-md border border-gray-700 bg-transparent px-2 py-1 focus:outline-none"
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

      <FileFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create Banner"
        description="Create a new promotional banner"
        fields={fields}
        layout={{ fileFields: ['image'], dataFields: ['title', 'status'] }}
        submitLabel="Create"
        onSubmit={handleCreate}
      />

      <FileFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Banner"
        description="Update banner information"
        fields={editFields}
        layout={{ fileFields: ['image'], dataFields: ['title', 'status'] }}
        submitLabel="Update"
        initialValues={editingBanner ? {
          title: editingBanner.title,
          status: String(editingBanner.status),
          image: editingBanner.bannerImage && editingBanner.bannerImage.startsWith('/')
              ? `${BACKEND_URL}${editingBanner.bannerImage}`
              : editingBanner.bannerImage ?? '',
        } : undefined}
        onSubmit={handleUpdate}
      />

      <ConfirmationDialog
          isOpen={!!confirmationState}
          onClose={() => setConfirmationState(null)}
          onConfirm={handleConfirmAction}
          title={`Confirm Action: ${confirmationState?.action.label || ''}`}
          description={confirmationState?.action.confirmMessage || ''}
      />
      
      {previewImage && (
            <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 bg-opacity-75 transition-opacity"
            onClick={() => setPreviewImage(null)}
            >
            <div className="relative w-[500px] h-[250px] bg-transparent flex items-center justify-center rounded-md" onClick={(e) => e.stopPropagation()}>
            <NextImage
                src={previewImage}
                alt="Image Preview"
                fill
                className="object-contain rounded-md"
                sizes="90vw"
                onLoad={(e) => setImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
            />
            {(() => {
            if (!imageSize.width || !imageSize.height) {
                return null;
            }

            const CONTAINER_WIDTH = 500;
            const CONTAINER_HEIGHT = 250;

            const scale = Math.min(
                CONTAINER_WIDTH / imageSize.width,
                CONTAINER_HEIGHT / imageSize.height
            );

            const renderedWidth = imageSize.width * scale;
            const renderedHeight = imageSize.height * scale;

            const imageArea = renderedWidth * renderedHeight;
            const containerArea = CONTAINER_WIDTH * CONTAINER_HEIGHT; // Use correct area
            const imageToContainerRatio = imageArea / containerArea;

            let buttonSizeClass = 'h-8 w-8';
            let iconSizeClass = 'h-6 w-6';
            if (imageToContainerRatio < 0.3) {
                buttonSizeClass = 'h-6 w-6';
                iconSizeClass = 'h-8 w-8';
            } else if (imageToContainerRatio > 0.7) {
                buttonSizeClass = 'h-10 w-10';
                iconSizeClass = 'h-8 w-8';
            }
            
            const topOffset = (CONTAINER_HEIGHT - renderedHeight) / 2;
            const rightOffset = (CONTAINER_WIDTH - renderedWidth) / 2;

            return (
                <Button
                variant="ghost"
                className={`absolute p-0 cursor-pointer rounded-full bg-gray-800 hover:bg-gray-700 border ${buttonSizeClass}`}
                style={{ top: topOffset - 16, right: rightOffset - 16 }}
                onClick={() => setPreviewImage(null)}
                >
                <XCircle className={`${iconSizeClass} text-white`} />
                </Button>
            );
            })()}
        </div>
          </div>
        )}
    </div>
  );
}