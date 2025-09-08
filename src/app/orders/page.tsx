import ProtectedRoute from '@/components/auth/protected-route';
import OrderTable from './orders-table';

export default function Orders() {
  return (
    <ProtectedRoute requiredPermissions={['order:read']}>
      <div className="space-y-6">
        <OrderTable/>
      </div>
    </ProtectedRoute>
  );
}
