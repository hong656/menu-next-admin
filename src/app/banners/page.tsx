import ProtectedRoute from '@/components/auth/protected-route';
import BannerTable from './banners-table';

export default function Tables() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <BannerTable />
      </div>
    </ProtectedRoute>
  );
}
