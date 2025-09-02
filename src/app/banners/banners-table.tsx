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
  CheckCircle,
  XCircle,
  Trash2,
  Image as ImageIcon,
  Eye,
  Filter,
  Trash,
  Pencil,
} from 'lucide-react';
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
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

const isUrlValid = (url: string | null | undefined): url is string => {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

const statusConfig = {
  1: { // Active
    text: 'ACTIVE',
    classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  2: { // Inactive
    text: 'INACTIVE',
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
    icon: <XCircle className="h-3.5 w-3.5" />,
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

  const t = useTranslations('Button');
  const thead = useTranslations('Sidebar');
  const tdialog = useTranslations('DialogHeader');
  const [pagedBanners, setPagedBanners] = useState<Banner[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [state, setState] = useState<FetchState>('idle');
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const handleClosePreview = useCallback(() => {
    setIsPreviewVisible(false);
    const timer = setTimeout(() => {
      setPreviewImage(null);
    }, 300); // Corresponds to the transition duration
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (previewImage) {
      setImageSize({ width: 0, height: 0 });
      // For fade-in effect
      const timer = setTimeout(() => setIsPreviewVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [previewImage]);

  const [confirmationState, setConfirmationState] = useState<{
    bannerId: number;
    action: BannerStatusAction;
  } | null>(null);

  // --- API CALLS UPDATED FOR BANNERS ---
  const fetchBanners = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams();

    // API uses 0-based page index, UI uses 1-based
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
      const { data } = await axios.get(`${BACKEND_URL}/api/banners?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      // Update state with pagination data from the API response
      setPagedBanners(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setState('success');
    } catch (err) {
      console.error(err);
      setPagedBanners([]); // Clear data on error
      setState('error');
    }
  }, [BACKEND_URL, page, rowsPerPage, debouncedQuery, status]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);
 
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (page !== 1) setPage(1); // Reset to page 1 when query changes
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [status, rowsPerPage]);

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingBanner(null);
    }
  }, [editDialogOpen]);

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
  
  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      setTempStatus(status);
    }
    setFilterOpen(open);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{thead('banner')}</h1>
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
                {t('filter')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-3">
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
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setFilterOpen(false)} className='border cursor-pointer h-8'>{t('cancel')}</Button>
                <Button onClick={() => {
                  setStatus(tempStatus);
                  setFilterOpen(false);
                }}
                className='border cursor-pointer h-8'>{t('apply')}</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="outline" className="cursor-pointer hover:bg-gray-700 hover:text-white border-black bg-gray-900 text-white" onClick={() => setDialogOpen(true)}>
          <BadgePlus /> {t('new')}
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
              <TableHead className="text-base">Date</TableHead>
              <TableHead className="text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && <TableRow><TableCell colSpan={7} className="py-10 text-center">Loading banners...</TableCell></TableRow>}
            {state === 'error' && <TableRow><TableCell colSpan={7} className="py-10 text-center text-red-500">Failed to load banners.</TableCell></TableRow>}
            {state === 'success' && pagedBanners.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center">No results found.</TableCell></TableRow>}
            
            {state === 'success' && pagedBanners.map((banner, idx) => {
              const absoluteBannerImage = banner.bannerImage && banner.bannerImage.startsWith('/')
                ? `${BACKEND_URL}${banner.bannerImage}`
                : banner.bannerImage;

              return (
                <TableRow key={banner.id}>
                  <TableCell className='font-bold text-md'>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <div className="relative group w-[120px] h-[60px]">
                      {isUrlValid(absoluteBannerImage) ? (
                        <>
                          <NextImage
                            src={absoluteBannerImage}
                            alt={banner.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={page === 1 && idx === 0}
                          />
                          <div
                            className="absolute inset-0 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md z-20" // <-- ADD z-20 HERE
                            onClick={() => setPreviewImage(absoluteBannerImage)}
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
                  <TableCell className='text-sm'>
                    {new Date(banner.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer"><Ellipsis className='h-5 w-5' /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className='text-blue-500 focus:text-blue-500 focus:bg-blue-500/10' onClick={() => handleEdit(banner)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        {statusActions.map((action) => (
                            <DropdownMenuItem key={action.status} className={action.color} onClick={() => setConfirmationState({ bannerId: banner.id, action })} disabled={isLoading || banner.status === action.status}>
                              <Trash className="mr-2 h-4 w-4" />  {action.label}
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
              <SelectTrigger className="!h-7 w-[70px]">
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
              <div className="ml-2 inline-flex rounded-md space-x-2">
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}><ChevronRight className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}><ChevronsRight className='w-4 h-4' /></Button>
              </div>
          </div>
        </div>
      </div>

      <FileFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={tdialog('create_banner')}
        fields={fields}
        layout={{ fileFields: ['image'], dataFields: ['title', 'status'] }}
        submitLabel="Create"
        onSubmit={handleCreate}
      />

      <FileFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title={tdialog('update_banner')}
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
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 transition-opacity duration-300",
            isPreviewVisible ? "opacity-100" : "opacity-0"
          )}
          onClick={handleClosePreview}
        >
          <div
            className={cn(
              "relative w-[500px] h-[250px] bg-transparent flex items-center justify-center rounded-md transition-all duration-300",
              isPreviewVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
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
                onClick={handleClosePreview}
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