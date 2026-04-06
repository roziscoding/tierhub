export interface TemplateTier {
  label: string
  color: string
}

export interface TemplateItem {
  src: string
}

export interface Template {
  id?: number
  title: string
  description: string
  tiers: TemplateTier[]
  items: TemplateItem[]
  createdAt: number
}

const DB_NAME = 'tierhub'
const DB_VERSION = 3
const STORE_NAME = 'templates'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function clearAll(): Promise<void> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function listTemplates(): Promise<Template[]> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getTemplate(id: number): Promise<Template | undefined> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveTemplate(template: Template): Promise<number> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add(template)
    req.onsuccess = () => resolve(req.result as number)
    req.onerror = () => reject(req.error)
  })
}
