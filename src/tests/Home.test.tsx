import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home Page', () => {
  it('renders the welcome message and navigation links', () => {
    render(<Home />)

    // Check for the main heading
    const heading = screen.getByRole('heading', {
      name: /modern hr platform for smarter hiring/i,
    })
    expect(heading).toBeInTheDocument()

    // Check for the sign-in link
    const signInLink = screen.getByRole('link', { name: /sign in/i })
    expect(signInLink).toBeInTheDocument()
    expect(signInLink).toHaveAttribute('href', '/signin')

    // Check for the sign-up link
    const signUpLink = screen.getByRole('link', { name: /get started/i })
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink).toHaveAttribute('href', '/signup')
  })
})