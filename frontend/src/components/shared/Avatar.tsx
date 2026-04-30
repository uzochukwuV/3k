import { getAvatarColor, getInitials } from '../../utils/format'

interface AvatarProps {
  email: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

export default function Avatar({ email, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(email)
  const colorClass = getAvatarColor(email)

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} ${className}
        rounded-full flex items-center justify-center
        font-semibold text-white select-none flex-shrink-0`}
    >
      {initials}
    </div>
  )
}
