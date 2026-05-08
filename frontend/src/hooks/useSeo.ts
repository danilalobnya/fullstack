import { useEffect } from 'react'

type SeoParams = {
  title: string
  description?: string
  robots?: string
  canonicalPath?: string
  ogType?: 'website' | 'article'
}

function ensureMeta(name: 'description' | 'robots' | 'og:title' | 'og:description' | 'og:type') {
  const selector = name.startsWith('og:') ? `meta[property="${name}"]` : `meta[name="${name}"]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    if (name.startsWith('og:')) el.setAttribute('property', name)
    else el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  return el
}

function ensureCanonical() {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  return link
}

export function useSeo({ title, description, robots, canonicalPath, ogType = 'website' }: SeoParams) {
  useEffect(() => {
    document.title = title
    const desc = description ?? 'Трекер приема лекарств: расписание, каталог, профиль и напоминания.'
    const rb = robots ?? 'noindex, nofollow'
    const path = canonicalPath ?? window.location.pathname
    const canonical = `${window.location.origin}${path}`

    ensureMeta('description').content = desc
    ensureMeta('robots').content = rb
    ensureMeta('og:title').content = title
    ensureMeta('og:description').content = desc
    ensureMeta('og:type').content = ogType
    ensureCanonical().href = canonical
  }, [title, description, robots, canonicalPath, ogType])
}
