import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSeo } from '../../hooks/useSeo'

function DemoSeo() {
  useSeo({
    title: 'SEO Test Title',
    description: 'SEO test description',
    robots: 'index, follow',
    canonicalPath: '/demo',
    ogType: 'article',
  })
  return <div>demo</div>
}

describe('useSeo hook', () => {
  it('updates head tags for route', () => {
    render(<DemoSeo />)

    expect(document.title).toBe('SEO Test Title')
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'SEO test description'
    )
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index, follow'
    )
    expect(document.head.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe(
      'article'
    )
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toContain('/demo')
  })
})
