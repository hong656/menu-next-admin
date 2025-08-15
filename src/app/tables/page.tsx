import ProtectedRoute from '@/components/auth/protected-route';
import TablesTable from './tables-table';

export default function Tables() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <TablesTable />
      </div>
    </ProtectedRoute>
  );
}
