export type ClassValue = string | number | null | undefined | false;

/**
 * Concatena classes verdadeiras. Intencionalmente simples: sem deduplicação de
 * utilitários conflitantes (ex.: `p-2` + `p-4`), o que é aceitável no tamanho atual
 * do projeto. Caso isso vire problema, avaliar `clsx` + `tailwind-merge`.
 */
export function cn(...values: ClassValue[]): string {
  return values
    .filter((value): value is string => typeof value === 'string' && value !== '')
    .join(' ');
}
