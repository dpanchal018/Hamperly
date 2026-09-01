import { createClient } from '@/lib/supabase/server';
import { SiteContent, HeaderContent, FooterContent } from '@/types/database.types';

export async function getSiteContent<T>(sectionId: string, defaultContent: T): Promise<T> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_content')
      .select('content')
      .eq('section_id', sectionId)
      .single();

    if (error) {
      console.warn(`Could not fetch ${sectionId} content, using defaults. Error:`, error.message);
      return defaultContent;
    }

    if (data && data.content) {
      return { ...defaultContent, ...data.content } as T;
    }

    return defaultContent;
  } catch (err) {
    console.error(`Exception fetching ${sectionId} content:`, err);
    return defaultContent;
  }
}

export const defaultHeaderContent: HeaderContent = {
  logoText: 'Hamperly',
  navLinks: [
    { name: 'Shop', href: '/products' },
    { name: 'Hampers', href: '/hampers' },
    { name: 'Exhibitions', href: '/exhibitions' }
  ]
};

export const defaultFooterContent: FooterContent = {
  logoText: 'Hamperly',
  description: 'Curating beautiful, personalized gifts for every special moment. Handcrafted with love and delivered with care.',
  socialLinks: [
    { platform: 'IG', url: '#' },
    { platform: 'FB', url: '#' },
    { platform: 'X', url: '#' }
  ],
  columns: [
    {
      title: 'Shop',
      links: [
        { name: 'Build a Hamper', href: '/build' },
        { name: 'Pre-made Hampers', href: '/hampers' },
        { name: 'Exhibitions', href: '/exhibitions' }
      ]
    },
    {
      title: 'Information',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Terms of Service', href: '/terms' }
      ]
    }
  ]
};
