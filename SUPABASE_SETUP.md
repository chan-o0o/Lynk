# Vercel에서 Supabase로 이메일 저장하기

사이트는 `/api/leads`로 이메일을 전송하고, Vercel 서버 함수가 Supabase의 `leads` 테이블에 저장합니다. Supabase 비밀키는 브라우저에 노출되지 않고 Vercel 환경변수에서만 사용됩니다.

## 1. 무료 프로젝트 만들기

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인합니다.
2. **New project**를 선택합니다.
3. 조직, 프로젝트 이름, 데이터베이스 비밀번호, Region을 선택하고 프로젝트를 만듭니다.
4. Free 플랜을 유지합니다. 무료 플랜에서는 카드 등록이 필요하지 않습니다.

## 2. 이메일 테이블 만들기

프로젝트의 **SQL Editor → New query**에서 아래 SQL 전체를 실행합니다.

```sql
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;
revoke all on table public.leads from anon, authenticated;
grant insert on table public.leads to service_role;
```

브라우저에서 Supabase를 직접 호출하지 않고 Vercel 서버만 쓰기 때문에, 공개 사용자에게는 테이블 권한을 부여하지 않습니다.

## 3. 서버 비밀키 확인하기

Project URL은 사이트 코드에 이미 설정되어 있습니다. Supabase 프로젝트의 **Settings → API Keys**에서 `sb_secret_`로 시작하는 새 Secret key를 생성하거나 복사합니다.

`sb_secret_` 키는 절대 `index.html`, GitHub, 채팅에 붙여 넣지 마세요. 이미 공개된 키는 삭제하고 새 키를 사용합니다.

## 4. Vercel 환경변수 등록하기

Vercel의 해당 프로젝트에서 **Settings → Environment Variables**로 이동해 다음 값을 등록합니다.

| 이름 | 값 |
| --- | --- |
| `SUPABASE_SECRET_KEY` | `sb_secret_`로 시작하는 Secret key |

**Production**에 적용하고 저장한 다음 Vercel에서 **Redeploy**합니다. Preview 배포에서도 테스트하려면 Preview에도 적용합니다.

## 5. 저장 확인하기

1. 배포된 사이트에서 체험을 완료합니다.
2. 이메일을 입력하고 개인정보 수집에 동의한 뒤 **이메일 남기기**를 누릅니다.
3. `이메일이 안전하게 등록되었습니다.`가 표시되는지 확인합니다.
4. Supabase의 **Table Editor → leads**에서 이메일과 저장 시각을 확인합니다.

오류가 표시되면 Vercel의 **Logs**에서 `Lead submission failed` 메시지를 확인합니다. 가장 흔한 원인은 환경변수 오타, 재배포 누락, 또는 SQL을 실행하지 않은 경우입니다.
