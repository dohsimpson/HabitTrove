import ChallengeDetail from '@/components/challenges/ChallengeDetail'

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChallengeDetail challengeId={id} />
}
