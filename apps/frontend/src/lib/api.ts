const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface TemplateTier {
  label: string
  color: string
}

export interface TemplateItem {
  src: string
}

export interface Template {
  id: string
  title: string
  description: string
  tiers: TemplateTier[]
  items: TemplateItem[]
  createdAt: string
}

export type TemplateSummary = Omit<Template, 'items'>

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
  }
  catch {
    throw new ApiError(0, 'Network error — check your connection')
  }

  if (res.status === 204)
    return undefined as T

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error)
        message = body.error
    }
    catch {}
    throw new ApiError(res.status, message)
  }

  try {
    return await res.json()
  }
  catch {
    throw new ApiError(res.status, 'Invalid response from server')
  }
}

export function listTemplates(): Promise<TemplateSummary[]> {
  return request('/templates')
}

export function getTemplate(id: string): Promise<Template | null> {
  return request<Template>(`/templates/${id}`).catch((err) => {
    if (err instanceof ApiError && err.status === 404)
      return null
    throw err
  })
}

export async function saveTemplate(data: {
  title: string
  description: string
  tiers: TemplateTier[]
  items: TemplateItem[]
}): Promise<Template> {
  return request('/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteTemplate(id: string): Promise<void> {
  return request(`/templates/${id}`, { method: 'DELETE' })
}
