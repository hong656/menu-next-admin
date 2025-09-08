import ProtectedRoute from '@/components/auth/protected-route';
import MenuItemTable from './menu-items-table';

export default function MenuItems() {
  return (
    <ProtectedRoute requiredPermissions={['menu:read']}>
      <div className="space-y-6">
        <MenuItemTable />
      </div>
    </ProtectedRoute>
  );
}
