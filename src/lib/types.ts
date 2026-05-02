export type JobCategory = {
  id: number
  name: string
  slug: string
  saramin_codes: string[] | null
  sort_order: number
}

export type Job = {
  id: number
  source: 'saramin' | 'worknet' | 'manual'
  source_id: string
  url: string

  company_name: string
  title: string

  category_id: number | null
  category_raw: string | null
  experience_level: string | null
  experience_min: number | null
  experience_max: number | null
  employment_type: string | null
  location: string | null
  salary: string | null

  jd_text: string | null
  requirements: string | null
  preferred: string | null

  company_industry: string | null
  company_size: string | null
  company_info: string | null

  posted_at: string | null
  deadline: string | null

  selection_process: string | null
  recommendation_note: string | null
  recommendation_tags: string[] | null
  is_featured: boolean
  is_hidden: boolean

  created_at: string
  updated_at: string

  // join
  category?: JobCategory | null
}
