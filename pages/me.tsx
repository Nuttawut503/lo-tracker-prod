import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'

export default function Page() {
  return <div></div>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }
  if (!!session.user.teacher) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }
  return {
    redirect: {
      destination: `/students/${session.user.id}`,
      permanent: false,
    },
  }
}
