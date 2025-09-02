'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Table = {
  id: number;
  number: number;
  status: number;
  qr_token: string;
};

const statusConfig = {
  1: {
    text: 'ACTIVE',
    classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
    icon: <CheckCircle className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />,
  },
  2: {
    text: 'INACTIVE',
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
    icon: <XCircle className="h-3.5 w-3.5 fill-yellow-400 text-yellow-700" />,
  },
  3: {
    text: 'DELETE',
    classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400',
    icon: <Trash2 className="h-3.5 w-3.5 fill-red-400 text-red-700" />,
  },
} as const;

const TableStatusBadge = ({ status }: TableStatusBadgeProps) => {
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

type Status = keyof typeof statusConfig;

type TableStatusBadgeProps = {
  status: number | null;
};

export default function TableDetail() {
  const { id } = useParams();
  const [tableData, setTableData] = useState<Table | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qrRef = useRef<HTMLCanvasElement>(null); // Ref for QRCodeCanvas

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tables/detail/${id}`, {
          headers: {
            Accept: 'application/json',
          },
        });
        setTableData(response.data.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching table data:', error);
        setError('Failed to load table data');
      }
    };

    if (id) {
      fetchTableData();
    }
  }, [id]);

  const handleDownloadQr = () => {
    if (!qrRef.current || !tableData) return;

    const canvas = qrRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `table-${tableData.number}-qr.png`;
    link.click();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Card className="w-full max-w-md bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600 text-center font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Table #{tableData.number}
          </CardTitle>
          <div className='mt-4 text-md font-bold text-center space-x-3'>
            <span>Status:</span>
            <TableStatusBadge status={tableData.status}/>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-5">
          <QRCodeCanvas
            value={`http://localhost:3000/screen?t=${tableData.qr_token}`}
            size={220}
            className="border-4 border-white shadow-md"
            ref={qrRef}
          />
          <Button
            onClick={handleDownloadQr}
            className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white"
          >
            Download QR Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}