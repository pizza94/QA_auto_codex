# QA Auto Codex

IRUDA와 QualityStream의 주요 기능을 검증하는 Playwright 기반 E2E QA 자동화 프로젝트입니다. 로그인, QualityStream 메뉴, 데이터품질지표(DQI), 데이터품질핵심정보(CTQ) 시나리오를 브라우저에서 실행하고 HTML 리포트와 실패 증적을 생성합니다.

## 테스트 범위

| 테스트 | 파일 | 검증 내용 |
| --- | --- | --- |
| 스모크 | `tests/smoke.spec.ts` | 브라우저 구동과 기본 UI 동작 |
| 로그인 | `tests/login.spec.ts` | 유효한 계정으로 IRUDA 로그인 |
| 메뉴 | `tests/qualitystream.spec.ts` | 품질관리 진입과 TC 매핑 메뉴 노출 |
| DQI | `tests/dqi-management.spec.ts` | 필수값, 분류 생성·검색·수정·삭제, 트리 동작 |
| CTQ | `tests/ctq-management.spec.ts` | 생성, 컬럼 매핑, 리포트 다운로드, 엑셀 업로드 |

> DQI와 CTQ 테스트는 테스트 데이터를 실제로 생성, 수정, 조회, 삭제합니다. 운영 환경이 아닌 테스트 환경에서 실행하고 대상 서버와 계정을 먼저 확인하세요.

## 사전 준비 및 설치

- Node.js와 npm
- IRUDA 서버에 접근 가능한 사내망 또는 VPN
- 테스트용 IRUDA 계정

프로젝트 루트에서 의존성과 브라우저를 설치합니다.

```powershell
npm install
npx playwright install
```

Linux에서 시스템 의존성도 필요하면 `npx playwright install --with-deps`를 실행합니다.

## 환경변수 설정

| 환경변수 | 설명 | 기본값 |
| --- | --- | --- |
| `PLAYWRIGHT_BASE_URL` | 테스트 대상 IRUDA 주소 | `http://10.194.5.53:8180` |
| `PLAYWRIGHT_USERNAME` | 로그인 ID | 없음 |
| `PLAYWRIGHT_PASSWORD` | 로그인 비밀번호 | 없음 |
| `BASE_URL` | 위 대상 주소보다 우선 적용할 주소 | 없음 |

PowerShell 예시:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://10.194.5.53:8180'
$env:PLAYWRIGHT_USERNAME = 'your-user-id'
$env:PLAYWRIGHT_PASSWORD = 'your-password'
```

macOS/Linux 예시:

```bash
export PLAYWRIGHT_BASE_URL=http://10.194.5.53:8180
export PLAYWRIGHT_USERNAME=your-user-id
export PLAYWRIGHT_PASSWORD=your-password
```

`.env.example`은 참고용이며 현재 프로젝트는 `.env` 파일을 자동으로 읽지 않습니다. 환경변수는 셸이나 실행 환경에서 직접 주입해야 합니다. 실제 비밀번호, 세션, 토큰은 저장소에 커밋하지 마세요.

## 테스트 실행

```powershell
# 전체 테스트: Chromium, Firefox, WebKit
npm test

# 로컬 Chromium 전체 테스트
npm test -- --project=chromium

# 기능별 Chromium 테스트
npm run test:login -- --project=chromium
npm run test:qualitystream -- --project=chromium
npm run test:dqi -- --project=chromium
npm run test:ctq -- --project=chromium

# 브라우저 화면 또는 Playwright UI로 실행
npm run test:headed -- --project=chromium
npm run test:ui
```

로그인 정보가 없으면 로그인과 QualityStream 관련 테스트는 건너뛰고, 외부 서버에 의존하지 않는 스모크 테스트만 실행됩니다.

## 결과 확인

HTML 리포트는 `playwright-report/`에 생성됩니다.

```powershell
npm run report
```

실패 시 `test-results/`에서 스크린샷과 비디오를 확인할 수 있습니다. CI 재시도 시에는 첫 재시도의 trace도 저장됩니다. 두 디렉터리는 실행 산출물이므로 Git에서 관리하지 않습니다.

## 테스트 데이터 주의사항

- DQI 테스트는 `AUTO_DQI_` 접두사의 자동화 데이터를 정리하고 시나리오 종료 시 생성 데이터를 삭제합니다.
- CTQ 테스트는 `QA_CTQ_004_` 접두사의 기존 자동화 데이터를 정리하고 신규 데이터를 생성합니다.
- CTQ 시나리오는 결과 확인을 위해 생성한 데이터를 남길 수 있습니다.
- 다른 사용자의 테스트와 접두사 또는 실행 시간이 충돌하지 않도록 주의하세요.

## 프로젝트 구조

```text
.
├─ .github/workflows/       # GitHub Actions
├─ docs/                    # 테스트 계획, 메뉴 매핑, 실행 기록
│  └─ test-cases/           # TC 및 결과 관리 CSV
├─ tests/                   # Playwright 테스트
│  └─ support/              # 로그인 등 공통 코드
├─ .env.example             # 환경변수 예시
├─ playwright.config.ts     # 브라우저, 리포터, 증적 설정
└─ package.json             # 실행 스크립트와 의존성
```

## TC 및 문서 관리

테스트를 추가하거나 수정하기 전에 다음 문서를 확인합니다.

1. `docs/test-plan.md`: 테스트 목적, 범위, 실행 이력
2. `docs/qualitystream-menu-map.md`: 메뉴와 TC 매핑
3. `docs/test-cases/qa-test-cases.csv`: TC 및 최근 실행 결과
4. `docs/work-log.md`: 작업 기록

신규 TC 추가 후에는 테스트 코드와 함께 TC CSV, 테스트 계획 실행 이력, 작업 기록도 갱신합니다. 자세한 규칙은 `docs/test-cases/README.md`를 참고하세요.

## GitHub Actions

`.github/workflows/playwright.yml`은 `main` 브랜치 push와 pull request에서 테스트를 실행합니다. 저장소에는 다음 값을 설정합니다.

- Actions variable: `PLAYWRIGHT_BASE_URL`
- Actions secret: `PLAYWRIGHT_USERNAME`
- Actions secret: `PLAYWRIGHT_PASSWORD`

기본 `10.x.x.x` 주소는 내부망이므로 일반 GitHub-hosted runner에서 접근할 수 없습니다. 로그인 기반 테스트까지 CI에서 실행하려면 사내망 또는 VPN에 연결된 self-hosted runner가 필요합니다. 계정 Secret이 없으면 로그인 기반 테스트는 건너뜁니다.

## 문제 해결

- 접속 실패: 사내망/VPN과 `PLAYWRIGHT_BASE_URL`을 확인합니다.
- 로그인 테스트가 건너뛰어짐: ID와 비밀번호 환경변수를 확인합니다.
- 브라우저 실행 파일 오류: `npx playwright install`을 다시 실행합니다.
- 상세 실패 확인: `npm run report`와 `test-results/` 증적을 확인합니다.
