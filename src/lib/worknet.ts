/**
 * 워크넷(고용24) 채용정보 API 클라이언트
 *
 * API 키 발급:
 * 1. https://www.work24.go.kr 접속 → 고객센터 → OPEN-API → 서비스 소개 및 신청
 * 2. 채용정보 항목에서 [신청] 버튼 클릭 (로그인 필요, 즉시 승인)
 * 3. 발급된 authKey → .env.local 에 WORKNET_API_KEY=xxxx 추가
 *
 * 공식 문서: https://www.work24.go.kr (고객센터 > OPEN-API > 서비스 소개 및 신청)
 * 엔드포인트: https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do
 * 반환 형식: XML
 */

const BASE = 'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do'

export type WorknetJob = {
  wantedAuthNo: string      // 채용공고 번호
  company: string           // 회사명
  wantedTitle: string       // 공고 제목
  salTpNm: string           // 급여 형태
  sal: string               // 급여
  minPay: string            // 최저 급여
  maxPay: string            // 최고 급여
  region: string            // 근무 지역
  holidayTpNm: string       // 근무 형태
  minEdubgIttTpNm: string   // 최소 학력
  career: string            // 경력
  wantedEndDate: string     // 마감일 (YYYY-MM-DD or '채용시')
  starDate: string          // 등록일
  wantedInfoUrl: string     // 상세 URL
  occupation: string        // 직종
  jobsCodeNm: string        // 직무 코드명
  empTpNm: string           // 고용형태 (정규직, 계약직, 인턴 …)
}

export type WorknetFetchParams = {
  startPage?: number
  display?: number          // max 100
  keyword?: string
  occupation?: string       // 직종코드
  region?: string           // 지역코드
  empTp?: string            // 고용형태 코드 (다중검색 가능, 쉼표 구분)
  career?: string           // 경력 (신입:0, 경력:1, 신입/경력:2)
  salTp?: string            // 임금형태 (D:일급, H:시급, M:월급, Y:연봉)
}

/** XML 태그 값 추출 헬퍼 */
function getTagValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return match ? match[1].trim() : ''
}

/** XML 블록 배열 추출 헬퍼 */
function getTagBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'g')
  return xml.match(regex) ?? []
}

export async function fetchWorknet(params: WorknetFetchParams): Promise<WorknetJob[]> {
  const apiKey = process.env.WORKNET_API_KEY
  if (!apiKey) throw new Error('WORKNET_API_KEY not set')

  const qs = new URLSearchParams({
    authKey: apiKey,
    callTp: 'L',
    returnType: 'XML',
    startPage: String(params.startPage ?? 1),
    display: String(params.display ?? 100),
    ...(params.keyword    && { keyword: params.keyword }),
    ...(params.occupation && { occupation: params.occupation }),
    ...(params.region     && { region: params.region }),
    ...(params.empTp      && { empTp: params.empTp }),
    ...(params.career     && { career: params.career }),
    ...(params.salTp      && { salTp: params.salTp }),
  })

  const res = await fetch(`${BASE}?${qs}`, {
    headers: { Accept: 'application/xml, text/xml' },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`워크넷 API 호출 실패: ${res.status}`)

  const xml = await res.text()

  // 에러 체크
  const returnCode = getTagValue(xml, 'returnCode')
  if (returnCode && returnCode !== '0000') {
    const returnMessage = getTagValue(xml, 'returnMessage')
    throw new Error(`워크넷 에러 ${returnCode}: ${returnMessage}`)
  }

  // <wanted> 블록 파싱
  const blocks = getTagBlocks(xml, 'wanted')
  return blocks.map((block): WorknetJob => ({
    wantedAuthNo:      getTagValue(block, 'wantedAuthNo'),
    company:           getTagValue(block, 'company'),
    wantedTitle:       getTagValue(block, 'wantedTitle'),
    salTpNm:           getTagValue(block, 'salTpNm'),
    sal:               getTagValue(block, 'sal'),
    minPay:            getTagValue(block, 'minPay'),
    maxPay:            getTagValue(block, 'maxPay'),
    region:            getTagValue(block, 'region'),
    holidayTpNm:       getTagValue(block, 'holidayTpNm'),
    minEdubgIttTpNm:   getTagValue(block, 'minEdubgIttTpNm'),
    career:            getTagValue(block, 'career'),
    wantedEndDate:     getTagValue(block, 'wantedEndDate'),
    starDate:          getTagValue(block, 'starDate'),
    wantedInfoUrl:     getTagValue(block, 'wantedInfoUrl'),
    occupation:        getTagValue(block, 'occupation'),
    jobsCodeNm:        getTagValue(block, 'jobsCodeNm'),
    empTpNm:           getTagValue(block, 'empTpNm'),
  }))
}

// 워크넷 응답 → DB row 변환
export function mapWorknetToJob(w: WorknetJob) {
  const isIntern = /인턴|실습/i.test(w.empTpNm)
  const deadline = w.wantedEndDate === '채용시' || !w.wantedEndDate
    ? null
    : new Date(w.wantedEndDate).toISOString()

  return {
    source:           'worknet' as const,
    source_id:        w.wantedAuthNo,
    content_type:     isIntern ? 'intern' as const : 'job' as const,
    url:              w.wantedInfoUrl,
    company_name:     w.company,
    title:            w.wantedTitle,
    category_raw:     w.jobsCodeNm || w.occupation || null,
    experience_level: w.career || null,
    employment_type:  w.empTpNm || null,
    location:         w.region || null,
    salary:           w.sal || null,
    posted_at:        w.starDate ? new Date(w.starDate).toISOString() : null,
    deadline,
  }
}

// 기획/마케팅/PM 관련 키워드
export const WORKNET_KEYWORDS = [
  '서비스기획', '프로덕트매니저', 'PM', '마케터',
  '퍼포먼스마케팅', '브랜드마케팅', '사업기획', '운영기획',
]

// 인턴십 전용 키워드
export const WORKNET_INTERN_KEYWORDS = [
  '기획 인턴', 'PM 인턴', '마케팅 인턴', '서비스기획 인턴',
]
