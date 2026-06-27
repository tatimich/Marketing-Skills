import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PERFIS_ESCRITORIO, PERFIS_IES } from '@/types'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Rota pública: login
  if (path.startsWith('/login') || path.startsWith('/api/')) {
    return supabaseResponse
  }

  // Sem sessão → redirecionar para login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Buscar perfil do usuário
  const { data: perfil } = await supabase
    .from('perfis')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rotas do escritório: só perfis internos
  if (path.startsWith('/escritorio') && !PERFIS_ESCRITORIO.includes(perfil.perfil)) {
    return NextResponse.redirect(new URL('/ies', request.url))
  }

  // Rotas da IES: só perfis de IES
  if (path.startsWith('/ies') && !PERFIS_IES.includes(perfil.perfil)) {
    return NextResponse.redirect(new URL('/escritorio', request.url))
  }

  // Redirecionar raiz conforme perfil
  if (path === '/') {
    if (PERFIS_ESCRITORIO.includes(perfil.perfil)) {
      return NextResponse.redirect(new URL('/escritorio', request.url))
    }
    return NextResponse.redirect(new URL('/ies', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
