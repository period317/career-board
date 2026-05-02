// 로컬에서 사람인 API 테스트용 스크립트
// 실행: npm run fetch:jobs

import 'dotenv/config'
import { fetchSaramin, mapSaraminToJob } from '../src/lib/saramin'
import { SARAMIN_KEYWORDS, CATEGORIES, inferCategory } from '../src/lib/categories'

async function main() {
  if (!process.env.SARAMIN_ACCESS_KEY) {
    console.error('❌ SARAMIN_ACCESS_KEY 환경변수가 없습니다. .env.local 확인')
    process.exit(1)
  }

  for (const cat of CATEGORIES) {
    console.log(`\n=== ${cat.name} ===`)
    for (const kw of SARAMIN_KEYWORDS[cat.slug]) {
      const jobs = await fetchSaramin({ keywords: kw, count: 5 })
      console.log(`[${kw}] ${jobs.length}건`)
      for (const j of jobs.slice(0, 3)) {
        const m = mapSaraminToJob(j)
        const slug = inferCategory(m.title, m.category_raw)
        console.log(`  - ${m.company_name} | ${m.title} | inferred: ${slug}`)
      }
    }
  }
}

main().catch(console.error)
