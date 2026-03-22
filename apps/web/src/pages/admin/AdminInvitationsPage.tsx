import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Invitation {
  id: string
  token: string
  status: 'pending' | 'used' | 'expired'
  usedBy: string | null
  expiresAt: string
  createdAt: string
}

export function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [lastCreated, setLastCreated] = useState<{ url: string; emailSent: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadInvitations()
  }, [])

  function loadInvitations() {
    api.getInvitations().then((data) => {
      setInvitations(data)
      setLoading(false)
    })
  }

  async function handleCreate() {
    setCreating(true)
    setLastCreated(null)
    try {
      const result = await api.createInvitation(email || undefined)
      setLastCreated({ url: result.url, emailSent: result.emailSent })
      setEmail('')
      loadInvitations()
    } finally {
      setCreating(false)
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h1 className="font-mono text-xl text-primary mb-6">Invitations</h1>

      {/* Create invitation */}
      <div className="bg-surface border border-border rounded-md p-5 mb-6">
        <p className="text-secondary text-sm mb-4">Generate an invite link. Optionally send it via email.</p>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="admin-input flex-1"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-5 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 disabled:opacity-40 transition-colors shrink-0"
          >
            {creating ? 'Creating...' : email ? 'Create & send' : 'Create link'}
          </button>
        </div>

        {lastCreated && (
          <div className="mt-4 p-3 bg-base border border-accent/30 rounded-sm">
            <div className="flex items-center justify-between gap-2">
              <code className="text-accent text-xs font-mono truncate">{lastCreated.url}</code>
              <button
                onClick={() => copyUrl(lastCreated.url)}
                className="text-muted text-xs font-mono hover:text-secondary shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {lastCreated.emailSent && (
              <p className="text-success text-xs font-mono mt-2">Email sent to {email || 'recipient'}</p>
            )}
          </div>
        )}
      </div>

      {/* Invitations list */}
      {loading ? (
        <div className="text-muted font-mono text-sm">Loading...</div>
      ) : invitations.length === 0 ? (
        <div className="text-muted font-mono text-sm">No invitations yet.</div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">Token</th>
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">Status</th>
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">Used by</th>
                <th className="text-right px-4 py-2 text-muted font-mono text-xs uppercase">Expires</th>
                <th className="text-right px-4 py-2 text-muted font-mono text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 font-mono text-secondary text-xs">{inv.token}</td>
                  <td className="px-4 py-3">
                    <InviteStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-secondary text-xs">
                    {inv.usedBy ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted text-xs font-mono">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => copyUrl(`${window.location.origin}/invite/${inv.token}`)}
                        className="text-accent text-xs font-mono hover:text-accent/80"
                      >
                        Copy link
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InviteStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'text-accent border border-accent/30',
    used: 'text-success border border-success/30',
    expired: 'text-muted border border-muted/30',
  }
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${styles[status] ?? styles['pending']}`}>
      {status.toUpperCase()}
    </span>
  )
}
