/**
 * 링커리어 스크래퍼
 * HTML 페이지의 __NEXT_DATA__ JSON을 파싱해서 인턴/공채 공고 수집
 *
 * 대상: https://linkareer.com/list/intern (인턴십)
 */

const BASE_URL = 'https://linkareer.com'

type LinkareerActivity = {
  id: string
  title: string
  organizationName: string
  jobTypes: string[]
  recruitCloseAt: number | null  // timestamp in ms
  activityTypeID: number
  type: number
}

type NextData = {
  props: {
    pageProps: {
      __APOLLO_STATE__: Record<string, LinkareerActivity & { __typename: string }>
    }
  }
}

export async function fetchLinkareerInterns(page = 1): Promise<LinkareerActivity[]> {
  const url = `${BASE_URL}/list/intern?filterBy_activityTypeID=5&filterBy_jobTypes=INTERN&filterBy_status=OPEN&orderBy_direction=DESC&orderBy_field=RECENT&page=${page}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`링커리어 fetch 실패: ${res.status}`)

  const html = await res.text()

  // __NEXT_DATA__ JSON 추출
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) throw new Error('링커리어 __NEXT_DATA__ 파싱 실패')

  const nextData = JSON.parse(match[1]) as NextData
  const apolloState = nextData.props.pageProps.__APOLLO_STATE__

  // Activity 객체만 필터링
  const activities = Object.values(apolloState)
    .filter((v) => v.__typename === 'Activity' && Array.isArray(v.jobTypes))

  return activities as unknown as LinkareerActivity[]
}

/** 링커리어 → DB row 변환 */
export function mapLinkareerToJob(a: LinkareerActivity) {
  const deadline = a.recruitCloseAt
    ? new Date(a.recruitCloseAt).toISOString()
    : null

  return {
    source:             'linkareer' as const,
    source_id:          String(a.id),
    content_type:       'intern' as const,
    url:                `${BASE_URL}/activity/${a.id}`,
    company_name:       a.organizationName,
    title:              a.title,
    category_raw:       null,
    experience_level:   '신입/인턴',
    experience_category: 'newbie' as const,
    employment_type:    '인턴',
    location:           null,
    salary:             null,
    posted_at:          null,
    deadline,
  }
}
