import ProtectedRoute from '@/components/auth/protected-route';
import MenuTypesTable from './menu-type-table';

export default function MenuItems() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <MenuTypesTable />
      </div>
    </ProtectedRoute>
  );
}
