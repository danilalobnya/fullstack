import { describe, expect, it } from 'vitest'

import { externalLookupQuery, stripRxnormDoseForLookup } from '../../utils/externalDrugQuery'

describe('externalDrugQuery utils', () => {
  it('strips dose tail for rxnav lookup', () => {
    expect(stripRxnormDoseForLookup('ibuprofen 400 MG Oral Tablet')).toBe('ibuprofen')
  })

  it('keeps plain names unchanged', () => {
    expect(stripRxnormDoseForLookup('aspirin')).toBe('aspirin')
  })

  it('extracts brand from long package names', () => {
    const value = externalLookupQuery(
      '{100 (...)} Pack [Excedrin PM Triple Action Caplets and Excedrin Extra Strength]'
    )
    expect(value).toContain('Excedrin')
    expect(value.length).toBeGreaterThanOrEqual(2)
  })
})
