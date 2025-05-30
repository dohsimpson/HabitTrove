'use client'

import { ReactNode, useEffect, useCallback, useState, Suspense } from 'react'
import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import { aboutOpenAtom, pomodoroAtom, userSelectAtom, currentUserIdAtom, clientFreshnessTokenAtom } from '@/lib/atoms'
import PomodoroTimer from './PomodoroTimer'
import UserSelectModal from './UserSelectModal'
import { useSession } from 'next-auth/react'
import AboutModal from './AboutModal'
import LoadingSpinner from './LoadingSpinner'
import { checkDataFreshness as checkServerDataFreshness } from '@/app/actions/data'
import RefreshBanner from './RefreshBanner'

function ClientWrapperContent({ children }: { children: ReactNode }) {
  const [pomo] = useAtom(pomodoroAtom)
  const [userSelect, setUserSelect] = useAtom(userSelectAtom)
  const [aboutOpen, setAboutOpen] = useAtom(aboutOpenAtom)
  const setCurrentUserIdAtom = useSetAtom(currentUserIdAtom)
  const { data: session, status } = useSession()
  const currentUserId = session?.user.id
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);

  // clientFreshnessTokenAtom is async, useAtomValue will suspend until it's resolved.
  // Suspense boundary is in app/layout.tsx or could be added here if needed more locally.
  const clientToken = useAtomValue(clientFreshnessTokenAtom);


  useEffect(() => {
    if (status === 'loading') return
    if (!currentUserId && !userSelect) {
      setUserSelect(true)
    }
  }, [currentUserId, status, userSelect, setUserSelect])

  useEffect(() => {
    setCurrentUserIdAtom(currentUserId)
  }, [currentUserId, setCurrentUserIdAtom])

  const performFreshnessCheck = useCallback(async () => {
    if (!clientToken || status !== 'authenticated') return;

    try {
      const result = await checkServerDataFreshness(clientToken);
      if (!result.isFresh) {
        setShowRefreshBanner(true);
      }
    } catch (error) {
      console.error("Failed to check data freshness with server:", error);
    }
  }, [clientToken, status]);

  useEffect(() => {
    // Interval for polling data freshness
    if (clientToken && !showRefreshBanner && status === 'authenticated') {
      const intervalId = setInterval(() => {
        performFreshnessCheck();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [clientToken, performFreshnessCheck, showRefreshBanner, status]);

  const handleRefresh = () => {
    setShowRefreshBanner(false);
    window.location.reload();
  };

  return (
    <>
      {children}
      {pomo.show && <PomodoroTimer />}
      {userSelect && <UserSelectModal onClose={() => setUserSelect(false)} />}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {showRefreshBanner && <RefreshBanner onRefresh={handleRefresh} />}
    </>
  );
}

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  // block client-side hydration until mounted (this is crucial to wait for all jotai atoms to load),
  // to prevent SSR hydration errors in the children components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientWrapperContent>{children}</ClientWrapperContent>
    </Suspense>
  );
}
