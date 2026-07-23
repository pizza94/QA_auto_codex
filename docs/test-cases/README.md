# TC 및 테스트 결과 관리

이 폴더는 자동화 테스트 케이스와 실행 결과를 Excel에서 관리하기 위한 파일을 보관한다.

## 파일

- `qa-test-cases.csv`: Excel에서 바로 열 수 있는 TC/결과 관리 파일

## 관리 원칙

1. TC 작성, 수정, 실행 전 `docs/test-plan.md`, `docs/qualitystream-menu-map.md`, `docs/test-cases/qa-test-cases.csv`, `docs/work-log.md`를 먼저 읽고 기준을 맞춘다.
2. 신규 자동화 TC를 추가할 때 이 CSV에 TC ID, 메뉴, 검증항목, 자동화 파일, 실행 명령을 추가한다.
3. 실제 테스트를 수행한 뒤 `최근실행일`, `결과`, `비고`를 갱신한다.
4. 완료 전 `docs/work-log.md` 날짜와 `docs/test-plan.md` 실행 이력까지 갱신됐는지 확인한다.
5. `PASS`, `FAIL`, `WARN`, `SKIP` 중 하나로 결과를 기록한다.
6. 파일 다운로드나 팝업 등 조건부 검증은 `비고`에 제약사항을 남긴다.
7. 실제 비밀번호, 세션 쿠키, 토큰, 개인 민감정보는 기록하지 않는다.

## Excel 사용 방법

1. GitHub에서 `qa-test-cases.csv`를 내려받는다.
2. Excel에서 파일을 연다.
3. 한글이 깨질 경우 Excel의 데이터 가져오기 기능에서 UTF-8 인코딩으로 연다.
4. 업데이트 후 GitHub에 다시 반영한다.

추후 로컬 파일 생성 환경이 안정화되면 동일 데이터를 기반으로 `.xlsx` 파일도 함께 관리할 수 있다.

