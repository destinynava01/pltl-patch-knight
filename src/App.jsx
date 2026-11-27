import BugSubmit, { BugReviewPage } from './Bugs'
import Leader from './Leader'
import StudentJoin from './StudentJoin'
import { isConfigured } from './supabase'
import { CenterCard } from './ui'

// Routes:
//   /       the leader: start a game and watch the class dashboard (then the report)
//   /join   students (solo or a small group on one screen): the world map and the bugs
//   /submit leaders write a bug of their own;  /review  reviewers approve them (and browse the built-in bugs)
// The bugs and their answers live on the server (supabase _shared/patchKnight.ts).
export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (!isConfigured) {
    return (
      <CenterCard title="Setup needed">
        <p className="mt-4 text-muted">Add your Supabase address and public key to <code>.env.local</code> (see <code>.env.example</code>), then restart.</p>
      </CenterCard>
    )
  }
  if (path === '/submit') return <BugSubmit />
  if (path === '/review') return <BugReviewPage />
  return path === '/join' ? <StudentJoin /> : <Leader />
}
