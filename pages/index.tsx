import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import React, { useContext } from 'react'
import { signOut } from 'next-auth/react'

import { AuthContext } from 'components/auth-wrapper'

export default function Index() {
  const {isSignedIn, isTeacher} = useContext(AuthContext)
  return <div>
    <Head>
      <title>Home</title>
    </Head>
    <div className="bg-white p-5 mt-5 rounded-md text-center">
    <div style={{ display: "inline-flex" }}>
      <Image src={'kmutt1.jpg'} width={600} alt='kmutt'/>
      <div style={{margin: "auto", marginLeft: 100, textAlign: "center" }}>
      <Image src={'LogoFull.png'} width={250} height={150} alt='logo'/>
        {isSignedIn && <>
          <p className="text-xl">Welcome back</p><br/>
          {isTeacher && <Link href="/programs" passHref>
            <h4 className="px-4 py-2 rounded bg-blue-200 hover:bg-blue-400 cursor-pointer text-lg"> Go to programs page👩‍🏫 </h4>
          </Link>}
          {!isTeacher && <Link href="/me" passHref>
            <h4 className="px-4 py-2 rounded bg-blue-200 hover:bg-blue-400 cursor-pointer text-lg"> Check my dashboard‍🎓 </h4>
          </Link>}
        </>}
        <div className="my-3"></div>
        {
          isSignedIn
          ?<p className="px-2 py-2 rounded bg-red-200 hover:bg-red-300 cursor-pointer text-lg" onClick={() => signOut()}>Logout</p>
          :<div>
            <p className="text-xl">Welcome!</p><br/>
            <Link href="/login" passHref><p className="px-8 py-2 rounded bg-blue-200 hover:bg-blue-400 cursor-pointer text-lg">Login</p></Link>
          </div>
        }
      </div>
    </div> <br/><br/>
    <p className="text-lg">LO Tracker</p>
    <p>A Capstone project about tracking learning outcome of each and all students in your course,<br/>
      where not only teacher or program chair can access, but student too, can see their own outcome score here.
    </p>
    </div>
  </div>
}
