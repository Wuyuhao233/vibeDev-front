import { Avatar, AvatarImage, AvatarFallback } from './Avatar'

interface AvatarCompatProps {
  src?: string
  name?: string
  size?: number | string
  className?: string
}

function AvatarCompat({ src, name, size, className }: AvatarCompatProps) {
  const shadcnSize = typeof size === 'string' ? (size as "default" | "sm" | "lg") :
    size && size >= 64 ? 'lg' : size && size <= 32 ? 'sm' : 'default'
  return (
    <Avatar size={shadcnSize} className={className}>
      {src && <AvatarImage src={src} alt={name || ''} />}
      <AvatarFallback>{name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
    </Avatar>
  )
}

export { AvatarCompat as Avatar }
