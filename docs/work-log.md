# 작업 이력

이 문서는 QA 자동화 작업의 날짜별 이력을 남기기 위한 기록 파일이다.

## 기록 원칙

1. 테스트 수행, 자동화 코드 추가, 문서 업데이트, GitHub 반영 내역을 날짜별로 기록한다.
2. 실제 계정 비밀번호, 세션 쿠키, 토큰, 내부 민감 정보는 기록하지 않는다.
3. 커밋 SHA, 주요 파일, 실행 결과, 확인 필요 사항을 함께 남긴다.
4. 테스트가 끝난 뒤 GitHub에 반영할 때 이 파일도 함께 업데이트한다.

## 2026-07-02

### Playwright 자동화 프로젝트 기본 구성

작업 내용:

- Playwright 기반 QA 자동화 프로젝트 구조를 구성했다.
- GitHub Actions 워크플로를 추가했다.
- smoke 테스트를 구성했다.
- 계정 정보가 없을 때 내부망 테스트는 스킵되도록 기본 구조를 잡았다.

주요 파일:

- `package.json`
- `playwright.config.ts`
- `.github/workflows/*`
- `tests/smoke.spec.ts`

검증 결과:

- GitHub Actions에서 smoke 테스트 통과.

### TC-001 로그인 자동화 추가

작업 내용:

- IRUDA 로그인 자동화 테스트를 추가했다.
- 환경변수 기반 로그인 구조를 구성했다.
- 로그인 성공 기준으로 Data Portal 메인 화면의 `Welcome to Data Portal` 표시를 검증했다.

주요 파일:

- `tests/login.spec.ts`
- `tests/support/auth.ts`
- `docs/test-plan.md`

검증 결과:

- 로컬 Chromium 실행 기준 로그인 테스트 통과.
- GitHub Actions에서는 계정 정보 미설정으로 로그인 테스트 스킵.

### TC-002 QualityStream 메뉴 진입 및 구조 확인 추가

작업 내용:

- Data Portal에서 `품질관리` 카드 클릭 후 QualityStream 진입을 검증했다.
- QualityStream 상위 메뉴 12개 표시를 검증했다.
- 주요 하위 메뉴 링크 존재 여부를 검증했다.
- 실제 메뉴 구조와 TC 대응 문서를 정리했다.

주요 파일:

- `tests/qualitystream.spec.ts`
- `docs/qualitystream-menu-map.md`
- `docs/test-plan.md`

검증 결과:

- 실제 QualityStream 메뉴 구조 수집 완료.
- 로컬 Chromium 실행 기준 QualityStream 메뉴 테스트 통과.

## 2026-07-03

### TC-003 데이터품질지표(DQI)관리 자동화 검증 및 GitHub 반영

작업 내용:

- `검증기준관리 > 데이터품질지표(DQI)관리` 메뉴를 실제 화면에서 자동화로 검증했다.
- 필수값 라벨 우측 빨간 별표 표시를 확인했다.
- 필수값 미입력 저장 차단과 `필수 입력입니다.` 메시지를 확인했다.
- 상단 `신규` 버튼으로 DQI 대분류를 생성했다.
- 생성한 대분류 트리 노드 우클릭 후 컨텍스트 메뉴의 `신규`로 DQI 소분류를 생성했다.
- 소분류 수정 후 재조회 시 수정값이 유지되는지 확인했다.
- Search 완전일치/부분일치 조회를 확인했다.
- BR상세정보 버튼 클릭 시 연관 BR 미선택 상태 안내 메시지를 확인했다.
- 연관BR 리포트 버튼 클릭 시 출력할 검색 결과 없음 안내 메시지를 확인했다.
- 생성한 소분류와 대분류를 삭제하고 재조회에서 미노출을 확인했다.

테스트 데이터:

- 대분류: `AUTO_DQI_BIG_20260703020936`
- 소분류 최초값: `AUTO_DQI_SUB_20260703020936`
- 소분류 수정값: `AUTO_DQI_SUB_20260703020936_EDIT`
- 목표수준: `95 -> 96`

주요 파일:

- `tests/dqi-management.spec.ts`
- `docs/dqi-management-run-2026-07-03.md`
- `docs/test-plan.md`
- `package.json`

주요 셀렉터:

- DQI 영역: `#dqiRegion`
- 신규: `#newNodeButton`
- 저장: `#dqiSaveButton`
- 트리 검색: `#dqiTree #tableTreeSearch`
- 모두열기/모두닫기: `#allOpenButton`
- 대분류명: `[name="dqiName"]`
- 소분류명: `[name="subDqiName"]`
- 대분류 설명: `[name="dqiDesc"]`
- 소분류 설명: `[name="subDqiDesc"]`
- 목표수준: `[name="desiredQuality"]`
- BR상세정보: `#brDetailInfo`
- 연관BR 리포트: `#brReport`
- 트리 우클릭 메뉴: `.vakata-context`

검증 결과:

- DQI 메뉴 진입: 통과.
- 필수값 빨간 별표: 통과. `::after` content `*`, color `rgb(217, 45, 32)` 확인.
- 필수값 미입력 저장 차단: 통과.
- 대분류 생성: 통과.
- 소분류 생성: 통과.
- 소분류 수정 및 재조회: 통과.
- Search 완전일치/부분일치: 통과.
- 삭제 및 재조회: 통과.

확인 필요:

- Search 미존재값 입력 시 빈 결과가 아니라 전체 트리가 다시 보이는 동작이 확인됐다. 요구사항상 정상인지 확인 필요.
- 상단 더보기 영역의 DQI 리포트는 수동 MCP 실행 중 다운로드 이벤트가 확인되지 않았다. 현재 자동화에는 연관BR 리포트의 빈 결과 안내 검증을 반영했다.

GitHub 반영:

- `ae0c896` - DQI 자동화 테스트와 실행 결과 문서 추가.
- `7acf75b` - DQI 트리 모두열기/모두닫기 토글 처리 안정화.

### 날짜별 작업 이력 문서 추가

작업 내용:

- 나중에 어느 날짜에 어떤 QA 자동화 작업을 했는지 추적할 수 있도록 작업 이력 문서를 추가했다.
- 기존 2026-07-02 작업과 2026-07-03 DQI 작업을 날짜별로 정리했다.

주요 파일:

- `docs/work-log.md`
