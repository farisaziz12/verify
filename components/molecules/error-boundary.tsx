'use client'

import { Component, type ReactNode } from 'react'
import { Card } from '@/components/atoms/card'

interface ErrorBoundaryProps {
  children: ReactNode
  label: string
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Keeps a thrown render inside one section of the page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <Card className="text-fg-subtle text-ui px-4 py-5">
        {this.props.label} could not be shown. The rest of this page is unaffected.
      </Card>
    )
  }
}
