import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

// Smoke test for the jsdom + @testing-library backbone (S033/S034). Delete or
// fold into a real component test once web coverage lands.
function Hello({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>
}

describe('testing backbone', () => {
  it('renders a component into jsdom and matches with jest-dom', () => {
    render(<Hello name="dojo" />)
    expect(screen.getByRole('heading')).toHaveTextContent('Hello, dojo')
  })
})
