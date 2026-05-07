import { type ReactNode } from 'react'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from './Empty'

interface EmptyProps {
  title?: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

function EmptyCompat({ title, description, action, icon, className }: EmptyProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        {icon}
        {title && <EmptyTitle>{title}</EmptyTitle>}
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action}
    </Empty>
  )
}

export { EmptyCompat as Empty }
