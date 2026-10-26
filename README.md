# 서울시립대 AI반도체 융합전공 학석사 연계과정사업단 홈페이지

Astro 정적 사이트(시안). 업체 데모(admin-demo.click)의 공개 페이지 기능을 옮겼다. 로그인·신청·관리자 기능은 서버가 필요해 아직 없다.

## 내용 고치기 (관리자 대신)

| 바꿀 것 | 파일 |
|---|---|
| 사업단 이름, 주소, 메뉴, 팝업존, 교육 단계, 신청 절차, 시안 표시(`draft`) | `src/data/site.json` |
| 교육 프로그램 (`id`, 단계, 기간, 모집 기간, 장소, 교과목) | `src/data/programs.json` |
| 공지·소식 (`board`: `notice` 또는 `news`, `pinned`로 상단 고정) | `src/data/notices.json` |
| 공지 첨부파일 | `public/files/`에 파일을 넣고 공지의 `attachments`에 `{ "name", "file", "size" }` 추가 |

- 모집 상태(모집 예정/중/마감)는 `recruit` 날짜로 브라우저에서 자동 계산된다.
- 날짜는 `YYYY-MM-DD`.

## 빌드와 확인

```bash
export PATH=~/.local/node/bin:$PATH
pnpm install
pnpm build && pnpm validate
~/venvs/work/bin/python -m http.server 8765 -d dist   # http://127.0.0.1:8765
```

## 데모에서 아직 옮기지 않은 기능

학교 이메일 회원가입·로그인, 사업단 참여 신청·승인, 프로그램 신청·신청 내역·교과목 이력(`/my`), 관리자 화면(`/admin`), 공지 글쓰기, 첨부 PDF 미리보기. 서버(호스팅) 결정 후 진행.
