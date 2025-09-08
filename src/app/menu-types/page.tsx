import ProtectedRoute from '@/components/auth/protected-route';
import MenuTypesTable from './menu-type-table';

export default function MenuTypes() {
  return (
    <ProtectedRoute requiredPermissions={['menu-type:read']}>
      <div className="space-y-6">
        <MenuTypesTable />
      </div>
    </ProtectedRoute>
  );
}
