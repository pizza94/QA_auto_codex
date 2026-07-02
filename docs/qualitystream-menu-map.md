# QualityStream 메뉴 매핑

이 문서는 실제 `quality_woori/main#dashboard` 화면의 좌측 메뉴와 로컬 TC Excel 파일의 기능 시트를 비교한 결과를 정리한다.

참고 TC 파일:

- `QualityStream-v4.3.0.0 새기능 테스트 0903_최종.xlsx`
- `[QA-VN]_QualityStream 4.1 Full Test_TestCase 번역.xlsx`
- `QualityStream3.2_전수테스트_ v3 (4).xlsx`

## 실제 메뉴와 TC 기능 매핑

| 순번 | 실제 상위 메뉴 | 대표 하위 메뉴 | 대응 TC 시트 또는 기능 |
| --- | --- | --- | --- |
| 1 | 검증기준관리 | 데이터품질지표(DQI)관리, 데이터품질핵심정보(CTQ)관리 | Verification Standard / 검증기준관리 |
| 2 | 검증대상관리 | 메타데이터매핑관리, 메타데이터수집관리, 검증대상관리 | Verification Targets / 검증대상관리 |
| 3 | 구조품질 | 테이블(모델) 정의서, 테이블 모델 정합성, 컬럼 모델 정합성 | 구조품질 관련 TC |
| 4 | 프로파일링설정 | 테이블 | Profiling Setting (Table) / 프로파일링설정 |
| 5 | 프로파일링 | 컬럼분석, 날짜분석, 패턴분석, 코드분석, 중복분석, 관계분석 | Profile / 프로파일링 |
| 6 | 품질진단관리 | BR관리, BR신청결과현황 | Business Rules / 품질진단관리 |
| 7 | 작업관리 | 점검작업관리, 점검작업수행관리, 프로파일링수행결과, BR수행결과 | Job Management / 작업관리 |
| 8 | 작업결과 | 업무별검증결과, 테이블별검증결과, 컬럼별검증결과, 오류데이터현황 | Job Results / 작업결과 |
| 9 | 개선관리 | 원인분석관리, 개선활동관리, 개선활동진척현황 | Improvements / 개선관리 |
| 10 | 품질현황 | 통계관리, 통합품질현황, DQI별품질현황, CTQ별품질현황 | Quality Status / 품질현황 |
| 11 | 승인관리 | BR승인관리, 개선활동승인관리 | Manage Approvals / 승인관리 |
| 12 | 설정 | 기본설정, 프로필 설정, 메타스트림설정 | Settings / 설정 |

## 자동화 기준

1. 로그인 후 Data Portal 메인에서 `품질관리` 카드를 클릭한다.
2. URL이 `/quality_woori/main#dashboard`로 이동했는지 확인한다.
3. 브라우저 제목이 `QualityStream 4.3`인지 확인한다.
4. 좌측 상위 메뉴 12개가 실제 화면에 순서대로 표시되는지 확인한다.
5. 각 TC 기능 영역을 대표하는 주요 하위 메뉴 링크가 존재하는지 확인한다.

이 기준은 `tests/qualitystream.spec.ts`의 `TC-002` 자동화 테스트에 반영한다.