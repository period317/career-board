'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = { id: number; slug: string; name: string }

type Job = {
  id: number
  source: string
  content_type: 'job' | 'intern' | 'bootcamp'
  url: string
  title: string
  company_name: string
  category_id: number | null
  category?: { id: number; name: string; slug: string } | null
  experience_level: string | null
  experience_category: 'newbie' | 'junior' | 'senior' | null
  employment_type: string | null
  location: string | null
  deadline: string | null
  is_featured: boolean
  is_hidden: boolean
  recommendation_note: string | null
  recommendation_tags: string[] | null
  selection_process: string | null
  created_at: string
}

type JobDraft = Omit<Job, 'id' | 'source' | 'category' | 'created_at'>

const EMPTY_DRAFT: JobDraft = {
  content_type: 'job',
  url: '',
  title: '',
  company_name: '',
  category_id: null,
  experience_level: '',
  experience_category: null,
  employment_type: '',
  location: '',
  deadline: '',
  is_featured: false,
  is_hidden: false,
  recommendation_note: '',
  recommendation_tags: null,
  selection_process: '',
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'job',      label: '채용 (정규직)' },
  { value: 'intern',   label: '인턴십' },
  { value: 'bootcamp', label: '부트캠프' },
]

const EXP_CATEGORY_OPTIONS = [
  { value: '',       label: '미지정' },
  { value: 'newbie', label: '신입/인턴' },
  { value: 'junior', label: '주니어 (1~5년)' },
  { value: 'senior', label: '시니어 (6년+)' },
]

const SOURCE_LABEL: Record<string, string> = {
  wanted:    '원티드',
  linkareer: '링커리어',
  saramin:   '사람인',
  worknet:   '워크넷',
  manual:    '직접등록',
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function deadlineToInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function inputToDeadline(val: string): string | null {
  if (!val) return null
  return new Date(val).toISOString()
}

// ─── Reusable field components ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-[#6B7280] font-medium mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0052CC]'
const selectCls = 'w-full px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#0052CC] bg-white'

// ─── Job Form (shared between Add & Edit) ────────────────────────────────────

function JobForm({
  draft,
  categories,
  onChange,
  onSubmit,
  submitLabel,
  loading,
}: {
  draft: JobDraft
  categories: Category[]
  onChange: (patch: Partial<JobDraft>) => void
  onSubmit: () => void
  submitLabel: string
  loading: boolean
}) {
  return (
    <div className="space-y-4">
      {/* Basic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="공고 제목 *">
          <input
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={inputCls}
            placeholder="서비스 기획자 모집"
          />
        </Field>
        <Field label="회사명 *">
          <input
            value={draft.company_name}
            onChange={(e) => onChange({ company_name: e.target.value })}
            className={inputCls}
            placeholder="(주)회사이름"
          />
        </Field>
      </div>

      <Field label="공고 URL *">
        <input
          value={draft.url}
          onChange={(e) => onChange({ url: e.target.value })}
          className={inputCls}
          placeholder="https://www.wanted.co.kr/wd/12345"
        />
      </Field>

      {/* Type & Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="콘텐츠 유형">
          <select
            value={draft.content_type}
            onChange={(e) => onChange({ content_type: e.target.value as JobDraft['content_type'] })}
            className={selectCls}
          >
            {CONTENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="직군">
          <select
            value={draft.category_id ?? ''}
            onChange={(e) => onChange({ category_id: e.target.value ? Number(e.target.value) : null })}
            className={selectCls}
          >
            <option value="">미지정</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="경력 카테고리">
          <select
            value={draft.experience_category ?? ''}
            onChange={(e) => onChange({ experience_category: (e.target.value || null) as JobDraft['experience_category'] })}
            className={selectCls}
          >
            {EXP_CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Detail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="경력 표시 (예: 신입, 3~5년)">
          <input
            value={draft.experience_level ?? ''}
            onChange={(e) => onChange({ experience_level: e.target.value || null })}
            className={inputCls}
            placeholder="신입"
          />
        </Field>
        <Field label="고용형태">
          <input
            value={draft.employment_type ?? ''}
            onChange={(e) => onChange({ employment_type: e.target.value || null })}
            className={inputCls}
            placeholder="정규직"
          />
        </Field>
        <Field label="지역">
          <input
            value={draft.location ?? ''}
            onChange={(e) => onChange({ location: e.target.value || null })}
            className={inputCls}
            placeholder="서울 강남구"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="마감일">
          <input
            type="date"
            value={deadlineToInput(draft.deadline ?? null)}
            onChange={(e) => onChange({ deadline: inputToDeadline(e.target.value) })}
            className={inputCls}
          />
        </Field>
        <Field label="옵션">
          <div className="flex gap-4 items-center h-[38px]">
            <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
              <input
                type="checkbox"
                checked={draft.is_featured}
                onChange={(e) => onChange({ is_featured: e.target.checked })}
                className="w-4 h-4 accent-[#0052CC]"
              />
              추천 공고
            </label>
            <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
              <input
                type="checkbox"
                checked={draft.is_hidden}
                onChange={(e) => onChange({ is_hidden: e.target.checked })}
                className="w-4 h-4 accent-[#0052CC]"
              />
              숨기기
            </label>
          </div>
        </Field>
      </div>

      {/* Curator fields */}
      <div className="border-t border-[#F0F0EE] pt-4 space-y-3">
        <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wide">멘토 큐레이션 (선택)</p>
        <Field label="추천 메모">
          <textarea
            value={draft.recommendation_note ?? ''}
            onChange={(e) => onChange({ recommendation_note: e.target.value || null })}
            rows={2}
            className={inputCls}
            placeholder="이 공고를 추천하는 이유, 멘티에게 전할 메시지"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="추천 태그 (쉼표 구분)">
            <input
              value={(draft.recommendation_tags ?? []).join(', ')}
              onChange={(e) => onChange({
                recommendation_tags: e.target.value
                  ? e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                  : null,
              })}
              className={inputCls}
              placeholder="신입추천, 성장하는스타트업"
            />
          </Field>
          <Field label="전형 단계">
            <input
              value={draft.selection_process ?? ''}
              onChange={(e) => onChange({ selection_process: e.target.value || null })}
              className={inputCls}
              placeholder="서류 → 면접 → 최종"
            />
          </Field>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading || !draft.title || !draft.company_name || !draft.url}
        className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? '저장 중...' : submitLabel}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed]           = useState(false)
  const [pw, setPw]                   = useState('')
  const [jobs, setJobs]               = useState<Job[]>([])
  const [categories, setCategories]   = useState<Category[]>([])
  const [loading, setLoading]         = useState(false)
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [editDraft, setEditDraft]     = useState<JobDraft>(EMPTY_DRAFT)
  const [addOpen, setAddOpen]         = useState(false)
  const [addDraft, setAddDraft]       = useState<JobDraft>(EMPTY_DRAFT)
  const [addLoading, setAddLoading]   = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [search, setSearch]           = useState('')
  const [toast, setToast]             = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // ── Auth ──
  function tryAuth() {
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    }).then(async (r) => {
      if (r.ok) {
        setAuthed(true)
        loadAll()
      } else {
        alert('비밀번호가 틀렸습니다')
      }
    })
  }

  // ── Load ──
  const loadAll = useCallback(async () => {
    setLoading(true)
    const [jr, cr] = await Promise.all([
      fetch('/api/admin/jobs'),
      fetch('/api/admin/categories'),
    ])
    if (jr.ok) setJobs(await jr.json())
    if (cr.ok) setCategories(await cr.json())
    setLoading(false)
  }, [])

  // ── Edit ──
  function openEdit(job: Job) {
    setEditingId(job.id)
    setEditDraft({
      content_type:        job.content_type,
      url:                 job.url,
      title:               job.title,
      company_name:        job.company_name,
      category_id:         job.category_id,
      experience_level:    job.experience_level,
      experience_category: job.experience_category,
      employment_type:     job.employment_type,
      location:            job.location,
      deadline:            job.deadline,
      is_featured:         job.is_featured,
      is_hidden:           job.is_hidden,
      recommendation_note: job.recommendation_note,
      recommendation_tags: job.recommendation_tags,
      selection_process:   job.selection_process,
    })
  }

  async function saveEdit() {
    if (!editingId) return
    setEditLoading(true)
    const r = await fetch(`/api/admin/jobs/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft),
    })
    setEditLoading(false)
    if (r.ok) {
      showToast('저장됐어요')
      setEditingId(null)
      loadAll()
    } else {
      alert('저장 실패')
    }
  }

  // ── Delete ──
  async function deleteJob(id: number, title: string) {
    if (!confirm(`"${title}" 공고를 삭제할까요? 되돌릴 수 없어요.`)) return
    const r = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    if (r.ok) {
      showToast('삭제됐어요')
      setJobs((prev) => prev.filter((j) => j.id !== id))
    } else {
      alert('삭제 실패')
    }
  }

  // ── Quick toggle ──
  async function toggleField(id: number, field: 'is_featured' | 'is_hidden', current: boolean) {
    await fetch(`/api/admin/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    })
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, [field]: !current } : j))
    )
  }

  // ── Add new ──
  async function submitAdd() {
    setAddLoading(true)
    const r = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addDraft),
    })
    setAddLoading(false)
    if (r.ok) {
      showToast('공고가 추가됐어요')
      setAddDraft(EMPTY_DRAFT)
      setAddOpen(false)
      loadAll()
    } else {
      const err = await r.json()
      alert(err.error ?? '추가 실패')
    }
  }

  // ── Filter ──
  const filtered = jobs.filter((j) => {
    if (!search) return true
    const q = search.toLowerCase()
    return j.title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q)
  })

  // ── Login screen ──
  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-5 py-24">
        <h1 className="text-[22px] font-bold mb-2">어드민</h1>
        <p className="text-[13px] text-[#6B7280] mb-6">공고를 추가·수정·삭제할 수 있어요.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && tryAuth()}
          placeholder="관리자 비밀번호"
          className={inputCls + ' mb-3'}
          autoFocus
        />
        <button onClick={tryAuth} className="btn-primary w-full">로그인</button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111] text-white text-[13px] px-5 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold">어드민</h1>
          <p className="text-[13px] text-[#6B7280]">총 {jobs.length}건</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="btn-secondary text-[12px]">새로고침</button>
          <button
            onClick={() => { setAddOpen((v) => !v); setAddDraft(EMPTY_DRAFT) }}
            className="btn-primary text-[12px]"
          >
            {addOpen ? '닫기' : '+ 공고 추가'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {addOpen && (
        <div className="card p-5 mb-6 border-2 border-[#0052CC]/20">
          <h2 className="text-[16px] font-semibold mb-4">새 공고 추가</h2>
          <JobForm
            draft={addDraft}
            categories={categories}
            onChange={(patch) => setAddDraft((prev) => ({ ...prev, ...patch }))}
            onSubmit={submitAdd}
            submitLabel="추가하기"
            loading={addLoading}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputCls}
          placeholder="공고 제목 또는 회사명으로 검색"
        />
      </div>

      {/* Job list */}
      {loading && <p className="text-[13px] text-[#6B7280] py-4">불러오는 중...</p>}

      <div className="space-y-2">
        {filtered.map((job) => (
          <div key={job.id} className={`card p-4 ${job.is_hidden ? 'opacity-50' : ''}`}>
            {/* Card header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[11px] text-[#0052CC] font-medium">
                    {SOURCE_LABEL[job.source] ?? job.source}
                  </span>
                  <span className="text-[11px] text-[#9CA3AF]">
                    {job.category?.name ?? '직군미지정'}
                  </span>
                  {job.is_featured && (
                    <span className="text-[10px] bg-[#0052CC] text-white px-1.5 py-0.5 rounded">추천</span>
                  )}
                  {job.is_hidden && (
                    <span className="text-[10px] bg-[#6B7280] text-white px-1.5 py-0.5 rounded">숨김</span>
                  )}
                </div>
                <p className="text-[14px] font-semibold truncate">{job.title}</p>
                <p className="text-[12px] text-[#6B7280]">{job.company_name}</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                <button
                  onClick={() => toggleField(job.id, 'is_featured', job.is_featured)}
                  className={`text-[11px] px-2.5 py-1 rounded border ${
                    job.is_featured
                      ? 'bg-[#0052CC] text-white border-[#0052CC]'
                      : 'bg-white border-[#E5E7EB] text-[#374151]'
                  }`}
                >
                  {job.is_featured ? '★ 추천' : '☆ 추천'}
                </button>
                <button
                  onClick={() => toggleField(job.id, 'is_hidden', job.is_hidden)}
                  className="text-[11px] px-2.5 py-1 rounded border bg-white border-[#E5E7EB] text-[#374151]"
                >
                  {job.is_hidden ? '보이기' : '숨기기'}
                </button>
                <button
                  onClick={() => editingId === job.id ? setEditingId(null) : openEdit(job)}
                  className={`text-[11px] px-2.5 py-1 rounded border ${
                    editingId === job.id
                      ? 'bg-[#F3F4F6] border-[#E5E7EB]'
                      : 'bg-white border-[#E5E7EB] text-[#374151]'
                  }`}
                >
                  {editingId === job.id ? '닫기' : '편집'}
                </button>
                <button
                  onClick={() => deleteJob(job.id, job.title)}
                  className="text-[11px] px-2.5 py-1 rounded border bg-white border-[#FECACA] text-[#EF4444]"
                >
                  삭제
                </button>
              </div>
            </div>

            {/* Edit form */}
            {editingId === job.id && (
              <div className="mt-4 pt-4 border-t border-[#F0F0EE]">
                <JobForm
                  draft={editDraft}
                  categories={categories}
                  onChange={(patch) => setEditDraft((prev) => ({ ...prev, ...patch }))}
                  onSubmit={saveEdit}
                  submitLabel="저장하기"
                  loading={editLoading}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center text-[#6B7280] text-sm">
          {search ? '검색 결과가 없어요' : '공고가 없어요'}
        </div>
      )}
    </div>
  )
}
