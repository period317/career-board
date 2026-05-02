# Career Board 셋업 가이드

기획·마케팅·PM 직군 채용공고 큐레이션 보드.

## 0. 스택

- Next.js 16 (App Router) + Tailwind v4 + TypeScript
- Supabase (Postgres)
- Vercel (호스팅 + Cron)
- 사람인 Open API (공고 자동 수집)

## 1. 사람인 API 신청 (1~3일 소요)

가장 먼저 해야 할 작업. 승인이 1~3일 걸리므로 다른 작업 전에 신청해두기.

1. https://oapi.saramin.co.kr 접속
2. 회원가입 후 로그인
3. **이용신청** 메뉴 → 신청서 작성
   - 사용 목적: "기획·마케팅 직군 채용공고 큐레이션 서비스 운영 (멘토링용)"
   - 예상 호출 수: 일 100~500회
4. 승인 대기 (영업일 기준 1~3일)
5. 승인 후 **access_key** 발급 → `.env.local` 의 `SARAMIN_ACCESS_KEY` 에 입력

> 일 최대 500회 제한. 직군당 키워드 5~10개씩 조회하면 충분.

## 2. Supabase 셋업

1. https://supabase.com 에서 프로젝트 생성 (무료 플랜)
2. Project Settings → API 에서 다음 3가지 복사:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)
3. SQL Editor 에서 `supabase_schema.sql` 내용 실행

## 3. 로컬 실행

```bash
cd "C:/Users/user/Downloads/claude code/career-board"
npm install

# 환경변수 셋업
cp .env.example .env.local
# .env.local 편집해서 키 입력

npm run dev
# http://localhost:3002 접속
```

> Supabase 키가 없어도 mock 데이터로 UI 확인 가능 (5개 샘플 공고)

## 4. 사람인 데이터 수집 테스트

API 키 발급 후:

```bash
npm run fetch:jobs
```

→ 콘솔에 직군별 수집 결과 출력. DB에 저장은 안 함 (확인용).

실제 DB 저장은 `/api/cron/fetch-jobs` 엔드포인트 또는 Vercel Cron 으로.

## 5. Vercel 배포

```bash
# Vercel CLI
npm i -g vercel
vercel
```

또는 Vercel 대시보드에서 GitHub 연결.

배포 후 환경변수 등록:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SARAMIN_ACCESS_KEY`
- `ADMIN_PASSWORD`
- `CRON_SECRET` (긴 랜덤 문자열)

`vercel.json` 의 cron 설정에 따라 매일 18:00 UTC (한국 03:00 새벽) 자동 수집.

## 6. 페이지 구조

| URL | 설명 |
|---|---|
| `/` | 공고 리스트 (직군 필터) |
| `/?cat=planning` | 기획 직군만 |
| `/jobs/[id]` | 공고 상세 |
| `/admin` | 멘토 어드민 (비밀번호 보호) |

## 7. 다음 단계 (v0.2 +)

- [ ] 워크넷 API 추가 연동 (공기업 보완)
- [ ] 멘티 프로필 입력 폼 → 매칭 페이지
- [ ] 추천 메모 markdown 렌더링
- [ ] OG 이미지 자동 생성
