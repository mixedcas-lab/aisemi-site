export const dot = (iso: string) => iso.replaceAll('-', '.');
export const range = ([a, b]: string[]) => (a === b ? dot(a) : `${dot(a)} – ${dot(b)}`);

// 빌드 시점 기준 모집 상태. 브라우저에서 site.js가 오늘 날짜로 다시 계산한다.
export function recruitState([a, b]: string[], now = new Date()) {
  const t = now.toISOString().slice(0, 10);
  return t < a ? 'soon' : t > b ? 'closed' : 'open';
}
export const recruitLabel = { soon: '모집 예정', open: '모집 중', closed: '모집 마감' } as const;
export const credits = (p: { courses: { credits: number }[] }) => p.courses.reduce((s, c) => s + c.credits, 0);
