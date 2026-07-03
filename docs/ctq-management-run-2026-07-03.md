# CTQ 관리 자동화 실행 결과

실행일: 2026-07-03
대상 메뉴: `검증기준관리 > 데이터품질핵심정보(CTQ)관리`
대상 URL: `/quality_woori/main#ctq`

## 테스트 데이터

- CTQ명: `AUTO_CTQ_20260703074150`
- CTQ 설명: `AUTO CTQ 설명 20260703074150`

## 검증 결과

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| CTQ 메뉴 진입 | 통과 | `QualityStream 4.3`, `#ctqRegion` 확인 |
| CTQ 신규 생성 진입 | 통과 | `#newCtqButton` 클릭 후 하단 상세영역 활성화 |
| 필수값 빨간 별표 | 통과 | `CTQ명`, `CTQ 설명` 라벨 `::after` content `*`, color `rgb(217, 45, 32)` 확인 |
| 필수값 미입력 저장 차단 | 통과 | `필수 입력입니다.` 메시지 표시 |
| CTQ 저장 | 통과 | `저장에 성공하였습니다.` 알림 표시 |
| 목록 조회 및 상세정보 검증 | 통과 | 목록 선택 후 하단 CTQ컬럼기본정보 값 일치 |
| CTQ컬럼매핑 정보 탭 이동 | 통과 | `#ctqMappingInfoGrid` 표시 |
| 컬럼등록 | 통과 | 컬럼등록 팝업 검색 후 컬럼 등록, `등록이 완료되었습니다.` 알림 표시 |
| 컬럼건수 반영 | 통과 | 등록 후 목록 컬럼건수 60, 매핑 그리드 60건 표시 |
| 리포트 다운로드 | 통과 | `CtqMappingColumnList.xlsx`, 8296 bytes, XLSX ZIP signature `504b0304` 확인 |
| 컬럼삭제 | 통과 | `선택한 항목을 삭제하시겠습니까?` 확인 후 `삭제되었습니다.` 알림 표시 |
| 컬럼삭제 후 재조회 | 통과 | 컬럼건수 0, 매핑행 0건 표시 |
| CTQ 삭제 | 통과 | 삭제 확인 후 `삭제되었습니다.` 알림 표시 |
| CTQ 삭제 후 재조회 | 통과 | 테스트 CTQ 미노출 확인 |

## 주요 셀렉터

| 대상 | 셀렉터 |
| --- | --- |
| CTQ 영역 | `#ctqRegion` |
| 신규 | `#newCtqButton` |
| 삭제 | `#deleteCtqButton` |
| 검색 입력 | `.search-panel-wrapper input[name="ctqName"]` |
| 검색 버튼 | `.search-panel-search-btn` |
| CTQ 목록 그리드 | `#ctqManageGrid` |
| 하단 탭 영역 | `#ctqTabs` |
| CTQ컬럼기본정보 탭 | `a[href="#ctqInfo"]` |
| CTQ컬럼매핑 정보 탭 | `a[href="#ctqMappingInfo"]` |
| 저장 | `#saveCtqButton` |
| CTQ명 | `#ctqInfo #ctqName` |
| CTQ 설명 | `#ctqInfo #ctqDesc` |
| 컬럼등록 | `#showCtqColumnButton` |
| 컬럼등록 팝업 그리드 | `#ctqColumnsGrid` |
| 매핑 그리드 | `#ctqMappingInfoGrid` |
| 컬럼삭제 | `#ctqMappingInfoDeleteButton` |
| 매핑 리포트 | `#ctqMappingExcel` |

## 자동화 반영

- 테스트 파일: `tests/ctq-management.spec.ts`
- 실행 명령: `npm run test:ctq`

## 참고사항

1. 컬럼등록 팝업에서 기본 검색 후 컬럼을 선택하고 확인하면 매핑 등록이 수행된다.
2. 실제 수동 자동화 실행에서는 컬럼등록 후 60건이 매핑되었다.
3. 리포트는 버튼 클릭 후 다운로드 형식 팝업에서 `확인`을 눌러야 파일이 다운로드된다.
4. MCP 실행 컨텍스트 제한으로 XLSX 내부 문자열 압축 해제 검증은 하지 못했고, 파일명/크기/XLSX 시그니처를 확인했다.
5. 테스트 데이터는 최종적으로 삭제했고, 재조회에서 미노출을 확인했다.
