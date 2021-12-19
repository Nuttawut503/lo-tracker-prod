import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useContext } from 'react'
import { ToastContainer } from 'react-toastify'

import background from 'public/background.png'
import { AuthContext } from './auth-wrapper'

export default function SiteLayout({children}) {
  const {isSignedIn, isTeacher, username} = useContext(AuthContext)
  const router =  useRouter()
  useEffect(() => {
    if (router.isReady) {
      const pathname = router.pathname.replace('/', '')
      if (!isSignedIn && !(pathname === 'login' || pathname === '')) {
        router.replace('/login')
      }
      if (isSignedIn && !isTeacher && (pathname.indexOf('program') !== -1 || pathname.indexOf('course') !== -1)) {
        router.replace('/')
      }
    }
  }, [router, isSignedIn, isTeacher])
  return <div className="relative min-h-screen flex flex-col w-100">
    <div className="absolute w-100 h-100" style={{zIndex: -99, filter: 'blur(2px)'}}><Image src={background} layout="fill" placeholder="blur" objectFit="cover" objectPosition="center" alt='background'/></div>
    <nav className="flex text-white bg-blue-400 justify-around py-2">
      <Link href="/">LO Tracker</Link>
      {isSignedIn && <p>You are signed in as {username}</p>}
    </nav>
    <main
      style={{
        maxWidth: 1270,
        padding: `0.5rem 1.0875rem 1.45rem`
      }}
      className="mx-auto flex-grow w-screen flex flex-col justify-items-center">
      <ToastContainer/>
      <div>{children}</div>
    </main>
  </div>
}