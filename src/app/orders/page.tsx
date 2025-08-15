import ProtectedRoute from '@/components/auth/protected-route';
import OrderTable from './orders-table';

export default function MenuItems() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <OrderTable/>
      </div>
    </ProtectedRoute>
  );
}
