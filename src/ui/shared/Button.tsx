// OWNER: UI/UX
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { playSfx } from '@/audio/sfx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'teal' | 'paper' | 'danger' | 'ghost';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  /** Occupa tutta la larghezza e allinea icona/etichetta a sinistra (voci di menu). */
  block?: boolean;
  /** Niente suono di selezione. */
  silent?: boolean;
}

/** Pulsante "fumetto": bordo spesso, ombra piatta sfalsata, target >= 44px. */
export function Button({
  variant = 'paper',
  icon,
  block = false,
  silent = false,
  onClick,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={`${styles.btn} ${styles[variant]} ${block ? styles.block : ''}`}
      onClick={(e) => {
        if (!silent) playSfx('menuSelect');
        onClick?.(e);
      }}
    >
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
    </button>
  );
}
