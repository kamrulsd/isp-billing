import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { authService } from '@/lib/api-services'

type AuthGuardProps = {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const user = authService.getCurrentUserSync()

  useEffect(() => {
    // If no user is logged in and we're not on the login page
    if (!user && router.pathname !== '/login') {
      router.push('/login')
      return
    }

    // If roles are specified, check if user has required role
    if (allowedRoles && !authService.hasPermission(allowedRoles)) {
      router.push('/dashboard')
    }
  }, [router.pathname, allowedRoles]) // eslint-disable-line react-hooks/exhaustive-deps

  // If we're on the login page and user is logged in, redirect to dashboard
  if (user && router.pathname === '/login') {
    router.push('/dashboard')
    return null
  }

  // If we're checking roles and user doesn't have permission, don't render children
  if (allowedRoles && !authService.hasPermission(allowedRoles)) {
    return null
  }

  return <>{children}</>
}
