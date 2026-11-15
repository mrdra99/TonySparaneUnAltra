// OWNER: UI/UX
// Ritratto di chi parla: foto (Tony, o NPC con `portrait`) oppure avatar illustrato in SVG
// generato dall'aspetto dell'NPC (colori, acconciatura, accessori) con le iniziali.
import { useState } from 'react';
import type { NpcAppearance } from '@/game/core/types';
import styles from './Portrait.module.css';

interface PortraitProps {
  name: string;
  src: string | null;
  appearance?: NpcAppearance;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}

const FALLBACK: NpcAppearance = {
  skin: '#d8a47f',
  shirt: '#1f8a8a',
  pants: '#16213e',
  hair: '#2a211c',
  hairStyle: 'short',
  height: 1.75,
};

function Hair({ style, color }: { style: NpcAppearance['hairStyle']; color: string }) {
  switch (style) {
    case 'bald':
      return null;
    case 'long':
      return (
        <>
          <path
            d="M26 46 Q24 20 50 18 Q76 20 74 46 L78 78 L66 78 L66 46 L34 46 L34 78 L22 78 Z"
            fill={color}
          />
          <path d="M30 40 Q50 14 70 40 Q50 28 30 40 Z" fill={color} />
        </>
      );
    case 'curly':
      return (
        <g fill={color}>
          {[
            [32, 32],
            [42, 24],
            [54, 22],
            [66, 28],
            [70, 40],
            [30, 42],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={9} />
          ))}
        </g>
      );
    case 'cap':
      return (
        <>
          <path d="M28 40 Q30 18 50 18 Q70 18 72 40 Z" fill={color} />
          <rect x="26" y="37" width="52" height="6" rx="3" fill={color} />
        </>
      );
    default:
      return <path d="M28 42 Q26 18 50 17 Q74 18 72 42 Q64 30 50 30 Q36 30 28 42 Z" fill={color} />;
  }
}

export function Portrait({ name, src, appearance }: PortraitProps) {
  const [broken, setBroken] = useState(false);
  const a = appearance ?? FALLBACK;
  const showPhoto = src && !broken;
  return (
    <div className={styles.frame}>
      {showPhoto ? (
        <img
          className={styles.photo}
          src={src}
          alt={name}
          draggable={false}
          onError={() => setBroken(true)}
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          className={styles.avatar}
          role="img"
          aria-label={`Ritratto di ${name}`}
        >
          <rect width="100" height="100" fill="#e6d9bc" />
          <circle cx="50" cy="104" r="42" fill={a.shirt} />
          <rect x="43" y="56" width="14" height="16" fill={a.skin} />
          {a.hairStyle === 'long' && <Hair style="long" color={a.hair} />}
          <ellipse cx="50" cy="42" rx="19" ry="22" fill={a.skin} />
          {a.hairStyle !== 'long' && <Hair style={a.hairStyle} color={a.hair} />}
          <circle cx="43" cy="44" r="2.2" fill="#16213e" />
          <circle cx="57" cy="44" r="2.2" fill="#16213e" />
          <path
            d="M44 55 Q50 59 56 55"
            stroke="#16213e"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {a.accessory === 'glasses' && (
            <g fill="none" stroke="#16213e" strokeWidth="2">
              <rect x="36" y="39" width="12" height="9" rx="3" />
              <rect x="52" y="39" width="12" height="9" rx="3" />
              <path d="M48 43 H52" />
            </g>
          )}
          {a.accessory === 'scarf' && (
            <rect x="36" y="68" width="28" height="9" rx="4" fill="#f08a24" />
          )}
        </svg>
      )}
      {!showPhoto && (
        <span className={styles.initials} aria-hidden="true">
          {initialsOf(name)}
        </span>
      )}
    </div>
  );
}
