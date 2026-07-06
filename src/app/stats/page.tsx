import { redirect } from 'next/navigation'

export default function StatsRoute() {
  redirect('/?tab=stats')
}
