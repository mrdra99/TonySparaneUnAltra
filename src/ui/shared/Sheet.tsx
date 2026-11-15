// OWNER: UI/UX
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { playSfx } from '@/audio/sfx';
import styles from './Sheet.module.css';

interface SheetProps {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  /** Barra azioni in fondo (sempre visibile, fuori dallo scroll). */
  footer?: ReactNode;
  /** 'wide' per i registri con griglia. */
  size?: 'narrow' | 'normal' | 'wide';
  /** Sfondo scuro pieno (pause, registri) oppure lascia intravedere la scena (menu). */
  scrim?: boolean;
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/** Pannello modale "foglio di carta": titolo inclinato, bordo spesso, scroll interno, focus gestito. */
export function Sheet({
  title,
  onClose,
  children,
  footer,
  size = 'normal',
  scrim = true,
}: SheetProps) {
  const titleId = useId();
  const rootRef = useRef<HTMLElement>(null);

  // Focus iniziale sul pannello (lo screen reader legge il titolo) e ripristino alla chiusura.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    rootRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  const trapTab = (e: KeyboardEvent<HTMLElement>): void => {
    if (e.key !== 'Tab' || !rootRef.current) return;
    const items = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === rootRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={`${styles.backdrop} ${scrim ? styles.scrim : ''}`}>
      <section
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${styles.sheet} ${styles[size]}`}
        onKeyDown={trapTab}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              className={styles.close}
              aria-label="Chiudi"
              onClick={() => {
                playSfx('menuSelect');
                onClose();
              }}
            >
              <X size={22} strokeWidth={3} aria-hidden="true" />
            </button>
          )}
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </section>
    </div>
  );
}
