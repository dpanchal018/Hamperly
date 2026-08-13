import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

test('Smoke test: Math works', () => {
  expect(1 + 1).toBe(2)
})

test('Smoke test: React rendering', () => {
  render(<div>Hello Hamperly</div>)
  expect(screen.getByText('Hello Hamperly')).toBeInTheDocument()
})
