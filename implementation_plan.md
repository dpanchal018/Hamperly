# Goal Description
Implement a CSV bulk import feature for the Hampers page in the Admin Portal. This will allow administrators to quickly upload and add multiple hampers at once without manually entering each one through the UI.

## Proposed Changes

### Database and Actions
#### [MODIFY] src/actions/hamper.actions.ts
- Add a new server action `bulkCreateHampers(hampers: Partial<PreMadeHamper>[])`.
- This action will take an array of hamper objects, insert them into the `hampers` table using Supabase's `.insert()` which supports arrays for bulk insertion, and revalidate the `/admin/hampers` path.

### Components
#### [NEW] src/components/admin/HamperImportButton.tsx
- Create a client component containing a hidden file `<input type="file" accept=".csv" />` and a visible button (e.g., "Import CSV").
- On file selection, it will read the file contents using the `FileReader` API.
- It will parse the CSV data (supporting columns: `name`, `description`, `stock_quantity`, `selling_price`, `actual_cost`).
- It will map the parsed rows into `Partial<PreMadeHamper>[]` objects and call the `bulkCreateHampers` server action.
- Uses `react-hot-toast` to provide loading, success, and error feedback to the admin.

#### [MODIFY] src/app/admin/hampers/page.tsx
- Import and render `<HamperImportButton />` next to the existing "Add Hamper" button.

## Verification Plan
### Automated Tests
- N/A

### Manual Verification
- Go to the Hampers Admin page.
- Create a sample `test.csv` file with headers: `name,description,stock_quantity,selling_price,actual_cost` and a few rows of dummy data.
- Click the "Import CSV" button, select the file, and verify that the success toast appears.
- Verify that the table updates immediately with the newly imported hampers.
