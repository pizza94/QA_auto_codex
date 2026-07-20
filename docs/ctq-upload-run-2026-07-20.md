# CTQ 적재 자동화 실행 결과

실행일: 2026-07-20
대상 메뉴: `검증기준관리 > 데이터품질핵심정보(CTQ)관리`
대상 URL: `/quality_woori/main#ctq`

## 테스트 흐름

1. `CTQ적재 양식` 버튼으로 `CtqInfo.xlsx`를 다운로드한다.
2. CTQ 적재 양식 구조에 맞춰 테스트 값을 입력한 엑셀 파일을 실행 중 동적으로 생성한다.
3. `CTQ적재` 버튼을 눌러 업로드 팝업을 연다.
4. 테스트 엑셀 파일을 업로드한다.
5. 업로드 성공 건수와 CTQ 목록 등록 여부를 확인한다.
6. 테스트 CTQ는 삭제하지 않고 등록 상태로 남긴다.

## 테스트 데이터

검증대상관리 메뉴의 `반영여부=Y` 대상과 하단 컬럼정보에서 확인 가능한 값을 기준으로 구성했다.

| 항목 | 값 |
| --- | --- |
| CTQ명 | `AUTO_CTQ_UPLOAD_{PROJECT}_{YYYYMMDDHHMMSS}` |
| CTQ 설명 | `AUTO CTQ upload test {project}` |
| 시스템 | `TEST` |
| 업무구분 | `TEST1` |
| 데이터베이스명 | `ORA19C` |
| 소유자 | `META_A` |
| 테이블ID | `TB_BYDVN_CD_ACCUM` |
| 컬럼명 | `DMN_ID` |
| 컬럼ID | `DMN_ID` |
| 컬럼순서 | `2` |
| 데이터타입 | `VARCHAR2(200)` |
| PK/FK/NN | `N/N/N` |

## 검증 결과

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| CTQ 적재양식 다운로드 | 통과 | `CtqInfo.xlsx`, XLSX ZIP signature `504b0304` 확인 |
| CTQ 적재 팝업 표시 | 통과 | `input[type="file"][name="uploadFile"]` 확인 |
| 테스트 엑셀 업로드 | 통과 | 업로드 성공 `1`건 확인 |
| CTQ 목록 등록 확인 | 통과 | `AUTO_CTQ_UPLOAD_{PROJECT}_{YYYYMMDDHHMMSS}` 조회 확인 |
| 테스트 데이터 유지 | 통과 | 테스트 종료 후 CTQ를 삭제하지 않음 |

## 자동화 반영

- 테스트 파일: `tests/ctq-management.spec.ts`
- 업로드 엑셀: 테스트 실행 중 동적 생성
- 실행 명령: `npm run test:ctq -- -g "downloads CTQ upload template" --workers=1`

## 실행 결과

- Chromium 단독 실행: 통과
- Chromium/Firefox/WebKit 단일 worker 실행: 3 passed
- 테스트 데이터 유지 기준으로 Chromium 단독 재실행: 통과
- 기본 병렬 실행에서는 동일 계정 동시 로그인 영향으로 Chromium이 로그인 화면에 머무는 현상이 있어, CTQ 적재 검증은 CI와 같은 단일 worker 조건에서 확인했다.
