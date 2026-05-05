// 직군 카테고리 — 기획·마케팅·PM 중심 (개발/디자인/재무/회계 제외)

export const CATEGORIES = [
  { slug: 'planning',  name: '기획',     desc: '서비스기획, 전략기획' },
  { slug: 'pm-po',     name: 'PM/PO',    desc: '프로덕트 매니저/오너' },
  { slug: 'marketing', name: '마케팅',   desc: '퍼포먼스, 브랜드, 콘텐츠, 그로스' },
  { slug: 'biz-dev',   name: '사업기획', desc: '사업개발, BD' },
  { slug: 'ops',       name: '운영기획', desc: '서비스운영, 사업운영' },
] as const

export type CategorySlug = typeof CATEGORIES[number]['slug']

// 경력 레벨 카테고리
export const EXPERIENCE_LEVELS = [
  { slug: 'all',     name: '전체' },
  { slug: 'newbie',  name: '신입/인턴' },
  { slug: 'junior',  name: '주니어 (1~5년)' },
  { slug: 'senior',  name: '시니어 (6~12년)' },
] as const

export type ExperienceLevelSlug = typeof EXPERIENCE_LEVELS[number]['slug']

// 사람인 키워드 매칭 (API 호출 시 사용)
export const SARAMIN_KEYWORDS: Record<CategorySlug, string[]> = {
  'planning':  ['서비스기획', '전략기획', '기획자'],
  'pm-po':     ['프로덕트 매니저', 'PM', 'PO', '프로덕트 오너', 'product manager'],
  'marketing': ['퍼포먼스 마케팅', '브랜드 마케팅', '콘텐츠 마케팅', '그로스 마케팅', '디지털 마케팅', '마케터'],
  'biz-dev':   ['사업기획', '사업개발', 'BD', '비즈니스 개발'],
  'ops':       ['서비스운영', '사업운영', '운영기획'],
}

// 제목/카테고리 텍스트로 카테고리 추론
export function inferCategory(title: string, categoryRaw?: string | null): CategorySlug | null {
  const text = `${title} ${categoryRaw ?? ''}`.toLowerCase()

  // 우선순위: PM/PO → 사업기획 → 마케팅 → 기획 → 운영
  if (/(^|\s|[(\[/])(pm|po)(\s|[)\]/,]|$)/i.test(text)) return 'pm-po'
  if (/product\s*(manager|owner)|프로덕트\s*(매니저|오너)/i.test(text)) return 'pm-po'
  if (/사업\s*기획|사업\s*개발|biz[\s-]?dev|\bbd\b/i.test(text)) return 'biz-dev'
  if (/마케팅|마케터|marketing|그로스|퍼포먼스|브랜딩|브랜드\s*매니저/i.test(text)) return 'marketing'
  if (/서비스\s*운영|사업\s*운영|운영\s*기획/i.test(text)) return 'ops'
  if (/기획/i.test(text)) return 'planning'  // "기획" 포함이면 모두 매칭

  return null
}

// 경력 레벨 추론 (경력 텍스트로부터)
export function inferExperienceCategory(experienceLevel: string | null): 'newbie' | 'junior' | 'senior' | null {
  if (!experienceLevel) return null

  const text = experienceLevel.toLowerCase()

  // 신입/인턴
  if (/신입|인턴|무경력|경력무관|신입 이상/i.test(text)) return 'newbie'

  // 시니어 (6년 이상)
  if (/6년\s*이상|7년\s*이상|8년\s*이상|6~|7~|8~|9~|10~|11~|12년|13년|14년|15년|고경력|senior/i.test(text)) return 'senior'

  // 주니어 (1~5년)
  if (/1년|2년|3년|4년|5년|1~|2~|3~|4~|5~|주니어|1~5년|경력 [1-5]년/i.test(text)) return 'junior'

  return null
}
