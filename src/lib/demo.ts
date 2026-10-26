// 로그인 시안용 예시 데이터 도우미
import demo from '../data/demo.json';
import programs from '../data/programs.json';
export const studentById = Object.fromEntries(demo.students.map((s) => [s.id, s]));
export const programById = Object.fromEntries(programs.map((p) => [p.id, p]));
export const countBy = <T,>(items: T[], key: (x: T) => string) => items.reduce((m, x) => ((m[key(x)] = (m[key(x)] || 0) + 1), m), {} as Record<string, number>);
