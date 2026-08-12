'use client'

import { Component, type ReactNode } from 'react'
import { Card } from '@/components/atoms/card'

interface ErrorBoundaryProps {
  children: ReactNode
  /** What this section is, in the sentence "… could not be shown." */
  label: string
  /** Replaces the default card, for seams whose shape a card would break — a table row. */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Keeps a thrown render inside one section of the page.
 *
 * A class because `getDerivedStateFromError` has no hook equivalent. Catches render errors
 * only — a rejected query is the query layer's to report, not this.
 */
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
