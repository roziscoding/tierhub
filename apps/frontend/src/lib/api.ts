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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  if (res.status === 204)
    return undefined as T
  return res.json()
}

export function listTemplates(): Promise<TemplateSummary[]> {
  return request('/templates')
}

export function getTemplate(id: string): Promise<Template | null> {
  return request<Template>(`/templates/${id}`).catch(() => null)
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
