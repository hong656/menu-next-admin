import ProtectedRoute from '@/components/auth/protected-route';
import BannerTable from './banners-table';

export default function BannersPage() {
  return (
    <ProtectedRoute requiredPermissions={['banner:read']}>
      <div className="space-y-6">
        <BannerTable />
      </div>
    </ProtectedRoute>
  );
}

