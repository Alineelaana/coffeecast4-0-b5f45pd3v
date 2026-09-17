import React from 'react'
import type { UserRole, UserStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Shield, Award, Crown, Sparkles, Coffee, Clock } from 'lucide-react'
import { getFileUrl } from '@/lib/formatters'

interface UserBadgeProps {
  role?: UserRole | string | null
  size?: 'sm' | 'md'
}

export const UserRoleBadge: React.FC<UserBadgeProps> = ({ role, size = 'md' }) => {
  const normalized = (role || 'prata').toLowerCase()

  const config = {
    master: {
      label: 'Master',
      icon: ShieldCheck,
      classes: 'bg-dourado text-vinho border border-dourado-dark font-black',
    },
    adm: {
      label: 'ADM',
      icon: Shield,
      classes: 'bg-vinho-light text-white border border-dourado/60 font-bold',
    },
    gerencial: {
      label: 'Gerencial',
      icon: Award,
      classes: 'bg-[#4A154B] text-dourado-light border border-dourado/40 font-bold',
    },
    ouro: {
      label: 'Ouro',
      icon: Crown,
      classes: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
    },
    prata: {
      label: 'Prata',
      icon: Sparkles,
      classes: 'bg-slate-100 text-slate-800 border border-slate-300 font-semibold',
    },
  }[normalized] || {
    label: 'Membro',
    icon: Sparkles,
    classes: 'bg-gray-100 text-gray-800 border border-gray-300',
  }

  const Icon = config.icon

  return (
    <Badge
      className={`inline-flex items-center gap-1 rounded-full shadow-2xs ${
        size === 'sm' ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'
      } ${config.classes}`}
    >
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0'} />
      <span>{config.label}</span>
    </Badge>
  )
}

interface UserAvatarProps {
  name?: string
  avatar?: string
  userRecord?: any
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const UserChatAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  userRecord,
  size = 'md',
  className = '',
}) => {
  const getInitials = (n?: string) => {
    if (!n) return 'CC'
    const parts = n.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  }[size]

  let avatarUrl = ''
  if (avatar && userRecord) {
    avatarUrl = getFileUrl(userRecord, avatar)
  } else if (avatar && (avatar.startsWith('http') || avatar.startsWith('/'))) {
    avatarUrl = avatar
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-vinho via-[#3d1332] to-[#240b1e] border-2 border-dourado/60 text-dourado font-serif font-black flex items-center justify-center shrink-0 overflow-hidden shadow-xs select-none ${sizeClasses} ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  )
}

interface UserStatusIndicatorProps {
  status?: UserStatus | string
  pauseReason?: string
  showText?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  status = 'offline',
  pauseReason,
  showText = false,
  className = '',
  size = 'md',
}) => {
  const normalized = (status || 'offline').toLowerCase()

  const config = {
    online: {
      label: 'Online',
      dotColor: 'bg-emerald-500 ring-emerald-200',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      textColor: 'text-emerald-700',
    },
    em_pausa: {
      label: pauseReason ? `Em pausa — ${pauseReason}` : 'Em pausa',
      dotColor: 'bg-amber-500 ring-amber-200 animate-pulse',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      textColor: 'text-amber-800',
    },
    offline: {
      label: 'Offline',
      dotColor: 'bg-slate-400 ring-slate-200',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-300',
      textColor: 'text-slate-500',
    },
  }[normalized] || {
    label: 'Offline',
    dotColor: 'bg-slate-400 ring-slate-200',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-300',
    textColor: 'text-slate-500',
  }

  const dotSizes = {
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
  }[size]

  if (showText) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.badgeColor} ${className}`}
        title={config.label}
      >
        <span className={`rounded-full shrink-0 ${dotSizes} ${config.dotColor}`} />
        <span className="truncate max-w-[150px]">{config.label}</span>
      </span>
    )
  }

  return (
    <span
      className={`rounded-full shrink-0 ${dotSizes} ${config.dotColor} ${className}`}
      title={config.label}
    />
  )
}
