import { getSiteContent, defaultHeaderContent, defaultFooterContent } from "@/services/content.service";
import HeaderForm from "@/components/admin/content/HeaderForm";
import FooterForm from "@/components/admin/content/FooterForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: 'Content Management | Hamperly Admin',
};

export default async function ContentAdminPage() {
  const headerContent = await getSiteContent("header", defaultHeaderContent);
  const footerContent = await getSiteContent("footer", defaultFooterContent);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
      </div>

      <Tabs defaultValue="header" className="w-full max-w-4xl">
        <TabsList className="mb-4">
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>
        <TabsContent value="header" className="mt-0">
          <HeaderForm initialContent={headerContent} />
        </TabsContent>
        <TabsContent value="footer" className="mt-0">
          <FooterForm initialContent={footerContent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
