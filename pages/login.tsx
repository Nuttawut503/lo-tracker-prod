import Image from 'next/image'
import router from 'next/router'
import { useState, useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { signIn } from 'next-auth/react'
import { toast } from 'react-toastify'

import Logo from 'public/LogoFull.png'
import { AuthContext } from 'components/auth-wrapper'

interface UserLoginForm {
  username: string
  password: string
}

export default function Page() {
  const [submitting, setSubmitting] = useState<boolean>(false)
  const { register, handleSubmit } = useForm<UserLoginForm>()
  const { isSignedIn, isTeacher } = useContext(AuthContext)
  useEffect(() => {
    if (!isSignedIn) return
    if (isTeacher) {
      router.push('/programs')
    } else {
      router.push('/me')
    }
  }, [isSignedIn, isTeacher])
  const submitForm = (form: UserLoginForm) => {
    if (form.username === '') {
      toast('Please complete the form', { type: 'info' })
      return
    }
    if (submitting || isSignedIn) return
    setSubmitting(true)
    signIn('credentials', {
      redirect: false,
      ...form
    }).then(res => {
      if (res.error) throw res.error;
      toast('Singed In successfully, redirecting...', { type: 'success' })
    }).catch(_ => toast(`Error: User not found`, { type: 'error' })).finally(() => setSubmitting(false))
  }
  return <div className="flex justify-center" style={{paddingTop: '10vh'}}>
    {!isSignedIn && <form onSubmit={handleSubmit(submitForm)} className="flex flex-column items-center gap-y-4 bg-white rounded-md shadow-md p-3">
      <Image src={Logo} height="200" alt='logo'/>
      <div>
        <span>Username</span><br/>
        <input style={{width: '250px'}} {...register('username', {required: true})} className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
      </div>
      <div>
        <span>Password</span><br/>
        <input style={{width: '250px'}} type="password" {...register('password', {required: true})} className="border-4 rounded-md p-1 mx-2 text-sm"/><br/>
      </div>
      <input type="submit" value="sign in" className={`py-1 px-3 bg-gray-900 hover:bg-gray-600 text-white rounded-lg ${(submitting || isSignedIn)?'disabled:opacity-50':''}`}/>
    </form>}
  </div>;
}
