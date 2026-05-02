'use client'

import { useEffect, useState } from 'react'

type Job = {
  id: number
  title: string
  company_name: string
  category_raw: string | null
  is_featured: boolean
  is_hidden: boolean
  recommendation_note: string | null
  recommendation_tags: string[] | null
  selection_process: string | null
  deadline: string | null
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)

  // 단순 비밀번호 보호 (클라이언트 측)
  function tryAuth() {
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
      .then((r) => r.ok)
      .then((ok) => {
        if (ok) {
          setAuthed(true)
          loadJobs()
        } else {
          alert('비밀번호가 틀렸습니다')
        }
      })
  }

  async function loadJobs() {
    setLoading(true)
    const r = await fetch('/api/admin/jobs')
    if (r.ok) setJobs(await r.json())
    setLoading(false)
  }

  async function updateJob(id: number, patch: Partial<Job>) {
    await fetch(`/api/admin/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    loadJobs()
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-5 py-20">
        <h1 className="text-[20px] font-bold mb-5">멘토 어드민</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && tryAuth()}
          placeholder="관리자 비밀번호"
          className="w-full p-3 border border-[#E5E5E3] rounded-lg mb-3"
        />
        <button onClick={tryAuth} className="btn-primary w-full">
          로그인
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold">멘토 어드민</h1>
        <button onClick={loadJobs} className="btn-secondary text-[12px]">
          새로고침
        </button>
      </div>

      {loading && <p className="text-[13px] text-[#6B6B6B]">불러오는 중...</p>}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-[15px] font-semibold">{job.title}</h3>
                <p className="text-[12px] text-[#6B6B6B]">
                  {job.company_name} · {job.category_raw}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => updateJob(job.id, { is_featured: !job.is_featured })}
                  className={`text-[11px] px-3 py-1.5 rounded-md border ${
                    job.is_featured ? 'bg-black text-white border-black' : 'bg-white border-[#E5E5E3]'
                  }`}
                >
                  {job.is_featured ? '★ 추천중' : '☆ 추천'}
                </button>
                <button
                  onClick={() => updateJob(job.id, { is_hidden: !job.is_hidden })}
                  className="text-[11px] px-3 py-1.5 rounded-md border bg-white border-[#E5E5E3]"
                >
                  {job.is_hidden ? '숨김 해제' : '숨기기'}
                </button>
                <button
                  onClick={() => setEditing(editing === job.id ? null : job.id)}
                  className="text-[11px] px-3 py-1.5 rounded-md border bg-white border-[#E5E5E3]"
                >
                  {editing === job.id ? '닫기' : '편집'}
                </button>
              </div>
            </div>

            {editing === job.id && (
              <EditForm job={job} onSave={(patch) => updateJob(job.id, patch)} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EditForm({
  job,
  onSave,
}: {
  job: Job
  onSave: (patch: Partial<Job>) => void
}) {
  const [note, setNote] = useState(job.recommendation_note ?? '')
  const [tags, setTags] = useState((job.recommendation_tags ?? []).join(', '))
  const [process, setProcess] = useState(job.selection_process ?? '')

  return (
    <div className="space-y-3 pt-3 border-t border-[#F0F0EE]">
      <div>
        <label className="text-[11px] text-[#6B6B6B] block mb-1">추천 메모</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full p-2 text-[13px] border border-[#E5E5E3] rounded-md"
          placeholder="이 공고를 추천하는 이유, 멘티에게 전할 메시지"
        />
      </div>
      <div>
        <label className="text-[11px] text-[#6B6B6B] block mb-1">
          추천 태그 (쉼표 구분)
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full p-2 text-[13px] border border-[#E5E5E3] rounded-md"
          placeholder="신입추천, 유망스타트업, 대기업"
        />
      </div>
      <div>
        <label className="text-[11px] text-[#6B6B6B] block mb-1">전형 단계</label>
        <textarea
          value={process}
          onChange={(e) => setProcess(e.target.value)}
          rows={2}
          className="w-full p-2 text-[13px] border border-[#E5E5E3] rounded-md"
          placeholder="서류 → 인적성 → 1차 면접 → 임원면접"
        />
      </div>
      <button
        onClick={() =>
          onSave({
            recommendation_note: note || null,
            recommendation_tags: tags
              ? tags.split(',').map((t) => t.trim()).filter(Boolean)
              : null,
            selection_process: process || null,
          })
        }
        className="btn-primary text-[12px]"
      >
        저장
      </button>
    </div>
  )
}
