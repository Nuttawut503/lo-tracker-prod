import type { NextRequest, NextFetchEvent } from 'next/server'

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
  // console.log('Going to -->', req.nextUrl.pathname)
}
