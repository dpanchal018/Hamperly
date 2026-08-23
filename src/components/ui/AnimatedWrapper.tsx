'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -15 }
};

const pageTransition = { type: "tween", ease: "easeInOut", duration: 0.3 } as any;

export function PageTransition({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverCard({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInScroll({ children, className = '', delay = 0 }: { children: ReactNode, className?: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerScrollContainer({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.15
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
