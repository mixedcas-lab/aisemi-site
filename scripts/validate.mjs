// 빌드 결과 검사: 제목, 중복 id, 내부 링크·앵커, 데이터 형식
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
assert(fs.existsSync(dist), 'Run pnpm build before validation.');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const htmlFiles = walk(dist).filter((f) => f.endsWith('.html'));
const htmlByPath = new Map(htmlFiles.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const errors = [];
let references = 0;
const decode = (s) => s.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
for (const [file, html] of htmlByPath) {
  if (!html.includes('<title>')) errors.push(`Missing title: ${file}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  if (new Set(ids).size !== ids.length) errors.push(`Duplicate HTML id: ${file}`);
  if (path.basename(file) === '404.html') continue; // 어느 경로에서든 열리므로 루트 링크를 쓴다
  for (const m of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
    const value = decode(m[1]);
    if (!value || /^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(value)) continue;
    references++;
    const [url, fragment] = value.split('#');
    let resolved = url ? path.resolve(path.dirname(file), decodeURIComponent(url.split('?')[0])) : file;
    if (!resolved.startsWith(dist)) { errors.push(`Escaping link ${value} in ${file}`); continue; }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) resolved = path.join(resolved, 'index.html');
    if (!fs.existsSync(resolved)) { errors.push(`Missing target ${value} in ${path.relative(dist, file)}`); continue; }
    if (fragment && htmlByPath.has(resolved) && !htmlByPath.get(resolved).includes(`id="${fragment}"`)) errors.push(`Missing anchor ${value} in ${path.relative(dist, file)}`);
  }
}
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'src/data', name + '.json'), 'utf8'));
const iso = /^\d{4}-\d{2}-\d{2}$/;
const programs = read('programs'), notices = read('notices');
for (const [name, items] of [['programs', programs], ['notices', notices]]) assert(new Set(items.map((i) => i.id)).size === items.length, `Duplicate ${name} id`);
programs.forEach((p) => {
  assert(['초급', '중급', '고급', '공통'].includes(p.level), `Unknown level ${p.id}`);
  [...p.period, ...p.recruit].forEach((d) => assert(iso.test(d), `Bad date in ${p.id}`));
  assert(p.period[0] <= p.period[1] && p.recruit[0] <= p.recruit[1], `Date order in ${p.id}`);
});
notices.forEach((n) => {
  assert(iso.test(n.date) && n.title && n.body.length, `Invalid notice ${n.id}`);
  assert(['notice', 'news'].includes(n.board), `Unknown board ${n.id}`);
  n.attachments.forEach((f) => assert(fs.existsSync(path.join(root, 'public/files', f.file)), `Missing attachment ${f.file}`));
});
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${htmlFiles.length} pages, ${references} local references, ${programs.length} programs, ${notices.length} notices.`);
