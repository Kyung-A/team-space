# 팀스페이스 (Team Space)

팀 단위로 공연·연습 일정을 관리하고, 팀원의 가능 스케줄을 실시간으로 조율하는 크로스플랫폼 앱(iOS / Android / Web).

## ⛔ 절대 규칙 (위반 금지)

1. **의논되지 않은 의존성을 설치하지 않는다.** 단, 이미 의논된 라이브러리의 **절대적 필수 의존성**(그게 없으면 동작 불가한 것)은 설치해도 된다.
2. **오버엔지니어링하지 않는다.** 지금 필요한 것만 만든다.
3. **마음대로 추측해서 확장성을 미리 설계하지 않는다.** "나중에 필요할 것 같아서"는 금지.
4. **무조건 기획서를 기반으로 판단한다.** 기획서에 없는 기능·필드·플로우를 임의로 추가하지 않는다.
5. **플로우가 끊기거나 맞지 않으면 무조건 먼저 의논한다.** 추측으로 메우고 코드를 작성하지 않는다.
6. **기능·페이지를 추가하는 그 순간에**, 그때 필요한 의존성과 로직을 추가한다. 미리 스캐폴드를 깔아두지 않는다.

> 이 규칙들은 기술 스택·구조·구현 방식 결정보다 우선한다. 충돌 시 항상 이 규칙을 따른다.

## 핵심 가치

- **운영진**: 카톡/엑셀로 취합하던 스케줄을 자동화. 시각적으로 한눈에.
- **멤버**: 본인이 가능한 일정을 직접 등록/수정. 연습 1시간 전 알림으로 지각 방지.
- **데이터 무결성**: 일정·참여멤버·연습세션이 다층 계층이므로, 모든 변경은 트랜잭션 + 검증으로 처리.

## 기술 스택

| 영역 | 선택 | 버전 | 비고 |
|---|---|---|---|
| 프레임워크 | **Expo** (React Native) | SDK 56 | iOS / Android / Web 단일 코드베이스 |
| 런타임 | React + React Native | 19 / 0.85 | |
| 언어 | TypeScript | 6.x | |
| 라우팅 | **expo-router** | 56 | 파일 기반. `src/app/`이 라우트 루트 |
| 웹 | react-native-web | 0.21 | `expo export --platform web` |
| UI | **gluestack-ui v3** | 3.0.x | NativeWind 기반 컴포넌트 |
| 스타일 | **NativeWind + Tailwind** | 4.2 / 3.4 | `className`으로 스타일링 |
| 폼 | **React Hook Form** | 7.x | 동적 필드는 `useFieldArray` |
| 서버 상태 | **TanStack Query** | 5.x | `staleTime: 30s`, 포커스 refetch 비활성 |
| 클라이언트 상태 | **Zustand** | 5.x | 현재 팀/사용자/권한 |
| 백엔드 | **Supabase** | js 2.x | PostgreSQL + RLS + Realtime + Edge Functions |
| 세션 저장 | AsyncStorage | | 네이티브 영구 세션 (웹은 기본 스토리지) |
| 푸시 | **Expo Notifications** | SDK 56 | 발송은 Supabase Edge Function |
| 빌드/배포 | EAS Build (앱) / Vercel·정적 (웹) | | |

> **gluestack-ui는 NativeWind(Tailwind) 위에서만 동작**합니다. 둘은 분리 불가한 한 세트입니다.

## 폴더 구조 (현재 — 최소 상태)

```
src/
├── app/              expo-router 라우트 전용
│   ├── _layout.tsx   루트 레이아웃 (global.css import + Stack)
│   └── index.tsx     시작 화면 (/)
└── global.css        NativeWind 엔트리 (@tailwind 지시문)
```

지금은 이게 전부입니다. **폴더는 미리 만들지 않고, 기능/페이지를 추가하는 순간에 생성**합니다 (절대 규칙 6).

### 중요: `src/app/`은 라우트 전용

expo-router는 `src/app/` 아래 **모든 `.tsx`를 라우트로 인식**합니다. Provider·컴포넌트·유틸을 여기 두면 URL 라우트로 노출되므로, 라우트가 아닌 코드는 `src/app/` 밖에 둘 것.

### Path Alias

`@/*` → `src/*` (`tsconfig.json`에 매핑). 상대경로 `../../`는 지양.

### 코드가 늘어날 때 따를 컨벤션 (강제 아님, 필요 시 적용)

- 라우트가 아닌 공통 코드(클라이언트, 훅, 유틸)는 `src/app/` 밖에 둔다.
- 도메인 로직이 커지면 도메인 단위로 묶는다. 단, **빈 폴더를 미리 깔지 않는다.**
- Provider가 필요해지면(예: TanStack Query, gluestack 오버레이) 그때 추가하고 `_layout.tsx`에서 조립한다.

## 개발 명령어

```bash
npm start                       # Expo Dev 서버 (QR / 시뮬레이터 선택)
npm run ios                     # iOS 시뮬레이터
npm run android                 # Android 에뮬레이터
npm run web                     # 웹 (localhost)
npx tsc --noEmit                # 타입체크
npx expo export --platform web  # 웹 정적 번들 (검증/배포)
npm run lint                    # expo lint
```

## 환경 변수

`.env.example`을 복사해 `.env` 생성. Expo는 `EXPO_PUBLIC_` 프리픽스 변수만 클라이언트에 노출합니다. (Supabase 연동을 실제로 붙일 때 env 읽기/검증 코드를 추가합니다.)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## 도메인 모델 (기획서 기반)

> 아래 도메인 모델·인증·푸시·UI 항목은 **기획서에서 도출한 설계 방향이며 아직 구현 전**입니다. 해당 기능을 구현하는 시점에 이 방향을 출발점으로 삼되, 기획서와 어긋나거나 플로우가 막히면 **절대 규칙 5에 따라 먼저 의논**합니다. 미리 테이블·코드를 만들어 두지 않습니다.

```
teams (id, name, member_invite_code, admin_invite_code)
└─ users (id, team_id, name, role, status, device_id, push_token)
   - role:   admin | member
   - status: pending | approved | withdrawn   ← 탈퇴 멤버는 soft delete (히스토리 보존)

schedules (id, team_id, name, event_date, location, practice_start, practice_end)
├─ schedule_participants (schedule_id, user_id)
├─ availability_slots (id, schedule_id, user_id, start_at, end_at, is_full_day)
│     ※ 새벽 시간대(예: 23:00~02:00)는 TIMESTAMPTZ 단일 row로 표현
└─ practice_sessions (id, schedule_id, date, start_time, end_time, location)
   └─ practice_session_participants (session_id, user_id, note)
```

### 핵심 무결성 규칙

- 일정 수정 시 연습 기간 축소 → 범위 밖 `availability_slots` cascade 삭제
- 참여 멤버 제외 → 해당 멤버의 `availability_slots`·`practice_session_participants` cascade 삭제
- 탈퇴 멤버는 `status='withdrawn'`만 변경. 데이터는 보존 (히스토리)
- 모든 테이블은 `team_id`로 RLS 격리 (멀티팀 확장성)

## 인증 모델

기획서의 "[팀코드 + 이름]만, 개인정보 없음" + "확장 시 새 팀도 수용" 요구.

흐름:
1. 클라이언트가 `[팀코드 + 이름 + device_id]` 전송
2. 서버(Edge Function)가 `users`에 `status='pending'`으로 insert + 세션 발급
3. 세션 토큰을 AsyncStorage(네이티브) / 스토리지(웹)에 영구 저장
4. Supabase 호출 시 토큰으로 RLS 적용
5. 운영진 승인 → `status='approved'`, 푸시 발송
6. 운영진 탈퇴 처리 → `status='withdrawn'` → 클라이언트는 시작화면으로

`device_id`는 디바이스 식별용으로 생성 후 영구 저장.

## 푸시 알림

| 트리거 | 대상 |
|---|---|
| 일정 등록/수정/삭제 | 참여 멤버 |
| 멤버가 연습 가능 시간 수정 (등록 후) | 운영진 |
| 연습 세션 등록/수정 | 연습 참여 멤버 |
| **연습 시작 1시간 전** | 연습 참여 멤버 (핵심) |
| 합류 승인/거부 | 신청자 |

- 클라이언트: `expo-notifications`로 권한 요청 + 푸시 토큰 등록
- 서버: Supabase Edge Function `cron`이 다가오는 세션 조회 → Expo Push API로 발송
- 푸시 토큰은 `users.push_token`에 저장

## UI/UX 원칙

- **모바일 우선**. 웹은 max-width 컨테이너로 모바일 폭 유지.
- **터치 타깃 ≥ 44px**.
- 등록/수정은 **바텀시트(gluestack Actionsheet)** 로 통일.
- **빈 상태 / 로딩 / 에러**는 항상 별도 컴포넌트로 표현.
- 폼은 모두 React Hook Form. 검증 메시지는 직역 말고 행동 유도형 한국어.

## 코딩 컨벤션

- 컴포넌트는 named export. 단, `src/app/` 라우트 파일은 expo-router 규칙상 **default export**.
- props 타입은 같은 파일에 `interface Props`.
- 비동기 데이터는 반드시 TanStack Query 훅으로. `useEffect` + `fetch` 금지.
- 스타일은 NativeWind `className` 우선. 동적 계산만 `style`.
- 날짜는 ISO 문자열로 저장/전달. 시간은 가능한 `TIMESTAMPTZ`(UTC) 저장 후 표시 시 KST 변환.

## 배포

- **앱**: EAS Build → iOS(TestFlight 내부 테스트) / Android(Play 내부 테스트). 외부 비공개.
- **웹**: `npx expo export --platform web` → `dist/` 정적 호스팅(Vercel 등).
- 환경 변수는 EAS Secret / 호스팅 환경 변수로 주입.

## 알려진 제약

- **gluestack-ui ↔ NativeWind 결합**: gluestack 컴포넌트는 NativeWind 없이는 스타일이 안 먹음. 분리 시도 금지.
- **`src/app/` 라우트 오염**: 라우트 아닌 파일을 app 폴더에 두면 URL로 노출됨.
- **React 19 + RN 0.85 + Expo SDK 56**: 최신 조합. 라이브러리 추가 시 peer 호환 확인 필요.
- **npm 사용**: Expo/RN은 npm을 1급 가정. pnpm은 Metro symlink 이슈 가능 → npm 유지.
