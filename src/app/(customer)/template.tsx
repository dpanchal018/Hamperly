import { ViewTransition } from 'react';

// Templates remount on every navigation, so each customer page fades and lifts in
// (and the previous one fades out) while the layout (menu, bag, footer) stays put.
export default function CustomerTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="hp-page" exit="hp-page" default="none">
      {children}
    </ViewTransition>
  );
}
