import { WhatsAppIcon } from '@/components/customer/SocialIcons';

// Sits just above the chat assistant button in the bottom-right corner.
export function WhatsAppFloat({ number }: { number: string }) {
  if (!number) return null;
  const text = encodeURIComponent("Hi Hamperly! I'd like help choosing a hamper.");
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="hp-pulse fixed right-4 md:right-6 bottom-[164px] md:bottom-24 z-40 w-14 h-14 rounded-full bg-[#1e9e55] text-white grid place-items-center shadow-xl hover:bg-[#178a49] transition-colors"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}
