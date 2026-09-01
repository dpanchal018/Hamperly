import { getAdminCustomizations } from '@/actions/customization.actions';
import { CustomizationsManager } from '@/components/admin/CustomizationsManager';
import { requireAdmin } from '@/services/auth.service';

export const dynamic = 'force-dynamic';

export default async function AdminCustomizationsPage() {
  await requireAdmin();
  const categories = await getAdminCustomizations();

  return (
    <div className="max-w-7xl mx-auto py-4">
      <CustomizationsManager initialCategories={categories} />
    </div>
  );
}
