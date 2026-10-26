export function relativeRoot(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length ? '../'.repeat(segments.length) : './';
}
