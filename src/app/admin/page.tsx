import { redirect } from 'next/navigation'

// The app is a single-page workspace; `admin` is a tab, not a standalone route.
// Deep-link support: /admin opens the app with the Admin tab active.
export default function AdminRoute() {
  redirect('/?tab=admin')
}
