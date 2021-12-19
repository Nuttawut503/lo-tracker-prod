import type { AppProps } from 'next/app'
import { PageTransition } from 'next-page-transitions'
import { SessionProvider } from 'next-auth/react'

import '../styles/globals.css'
import 'react-toastify/dist/ReactToastify.css'
import 'rc-collapse/assets/index.css'

import { AuthWrapper } from 'components/auth-wrapper'
import SiteLayout from 'components/SiteLayout'

function MyApp({ Component, pageProps: {session, ...pageProps}, router }: AppProps) {
  return <SessionProvider session={session} refetchInterval={10 * 60}>
    <AuthWrapper pageProps={pageProps}>
      <SiteLayout>
        <PageTransition
          timeout={160}
          classNames="page-transition"
          loadingComponent={<p>Loading...</p>}
          loadingDelay={200}
          loadingTimeout={{
            enter: 160,
            exit: 0,
          }}
          loadingClassNames="loading-indicator">
            <Component {...pageProps} key={router.route}/>
        </PageTransition>
        <style jsx global>{`
          .page-transition-enter {
            opacity: 0;
          }
          .page-transition-enter-active {
            opacity: 1;
            transition: opacity 160ms;
          }
          .page-transition-exit {
            opacity: 1;
          }
          .page-transition-exit-active {
            opacity: 0;
            transition: opacity 160ms;
          }
        `}</style>
      </SiteLayout>
    </AuthWrapper>
  </SessionProvider>
}

export default MyApp
