import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { AdminBreadcrumb } from './_form-parts'

interface Invitation {
  id: string
  token: string
  status: 'pending' | 'used' | 'expired'
  usedBy: string | null
  expiresAt: string
  createdAt: string
}

interface LastCreated {
  token: string
  url: string
  expiresAt: string
  emailSent: boolean
  createdAt: number
}

const PAGE_SIZE = 8

export function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCreated, setLastCreated] = useState<LastCreated | null>(null)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    loadInvitations()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  function loadInvitations() {
    api
      .getInvitations()
      .then((data) => {
        setInvitations(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load invitations')
        setLoading(false)
      })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const result = await api.createInvitation(email || undefined)
      setLastCreated({
        token: result.token,
        url: result.url,
        expiresAt: result.expiresAt,
        emailSent: result.emailSent,
        createdAt: Date.now(),
      })
      setEmail('')
      loadInvitations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invitation')
    } finally {
      setCreating(false)
    }
  }

  async function copyUrl(id: string, url: string) {
    await navigator.clipboard.writeText(url)
    setCopiedTokenId(id)
    setTimeout(() => setCopiedTokenId(null), 2000)
  }

  const totalPages = Math.max(1, Math.ceil(invitations.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = invitations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const startIdx = invitations.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endIdx = Math.min(safePage * PAGE_SIZE, invitations.length)

  const lastCreatedAge = useMemo(() => {
    if (!lastCreated) return null
    return relativeFromNow(now, lastCreated.createdAt, 'past')
  }, [lastCreated, now])

  return (
    <div className="max-w-5xl">
      <AdminBreadcrumb trail={['ADMIN', 'INVITATIONS']} />

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-primary leading-tight">Invitations</h1>
          <div className="mt-1 text-[13px] text-muted">
            Generate invite codes. Track usage. Tokens are single-use and expire after 7 days.
          </div>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-md border border-border bg-surface p-6 mb-6"
      >
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-4">
          Create invitation
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label
              htmlFor="invite-email"
              className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5"
            >
              Recipient email <span className="text-muted/60">(optional)</span>
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@dev.com"
              className="admin-input"
            />
          </div>
          <Button type="submit" size="md" loading={creating}>
            Generate
          </Button>
        </div>
        <div className="font-mono text-[11px] text-muted mt-3">
          Leaving the email blank generates a token without auto-sending.
        </div>

        {error && (
          <div className="mt-4 rounded-sm border border-danger/40 bg-danger/10 px-4 py-2 font-mono text-[13px] text-danger">
            {error}
          </div>
        )}

        {lastCreated && (
          <div className="mt-5 rounded-md border border-border border-l-4 border-l-accent bg-page p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent mb-2">
              Last created · {lastCreatedAge}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[18px] text-primary tracking-wide">
                {midEllipsis(lastCreated.token)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyUrl(lastCreated.token, lastCreated.url)}
              >
                {copiedTokenId === lastCreated.token ? 'Copied' : 'Copy URL'}
              </Button>
            </div>
            <div className="font-mono text-[11px] text-muted mt-2 break-all">
              {lastCreated.url}
            </div>
            <div className="font-mono text-[11px] text-muted mt-2">
              {lastCreated.emailSent ? 'Email sent. ' : ''}Expires{' '}
              {relativeFromNow(now, new Date(lastCreated.expiresAt).getTime(), 'future')}. Single-use.
            </div>
          </div>
        )}
      </form>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <colgroup>
              <col className="w-44" />
              <col className="w-28" />
              <col className="w-52" />
              <col className="w-32" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <Th>Token</Th>
                <Th>Status</Th>
                <Th>Redeemed by</Th>
                <Th align="right">Expires</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted font-mono">
                    Loading_
                  </td>
                </tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted text-[13px]">
                    No invitations yet. Generate one above.
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((inv) => {
                  const expiresMs = new Date(inv.expiresAt).getTime()
                  const expired = inv.status === 'expired' || expiresMs < now
                  const url = `${window.location.origin}/invite/${inv.token}`
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-b-0 hover:bg-elevated transition-colors"
                    >
                      <td className="px-4 h-12 align-middle font-mono text-secondary tracking-wide">
                        {midEllipsis(inv.token)}
                      </td>
                      <td className="px-4 h-12 align-middle">
                        <InviteStatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 h-12 align-middle text-secondary">
                        {inv.usedBy ? <span className="font-mono">@{inv.usedBy}</span> : <span className="text-muted">—</span>}
                      </td>
                      <td
                        className={`px-4 h-12 align-middle text-right font-mono ${
                          expired ? 'text-danger/80' : 'text-secondary'
                        }`}
                      >
                        {expired ? 'expired' : relativeFromNow(now, expiresMs, 'future')}
                      </td>
                      <td className="px-4 h-12 align-middle text-right">
                        {inv.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => copyUrl(inv.id, url)}
                            className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-primary transition-colors"
                          >
                            {copiedTokenId === inv.id ? 'Copied' : 'Copy URL'}
                          </button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && invitations.length > 0 && (
        <div className="flex items-center justify-between mt-6 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span>
            Showing {startIdx}–{endIdx} of {invitations.length}
          </span>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
            ariaLabel="Invitations pagination"
            size="sm"
          />
        </div>
      )}
    </div>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`h-10 px-4 font-mono text-[11px] uppercase tracking-wider text-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function InviteStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-muted/15 text-secondary border-border',
    used: 'bg-success/10 text-success border-success/30',
    expired: 'bg-danger/10 text-danger border-danger/30',
  }
  const labels: Record<string, string> = {
    pending: 'unused',
    used: 'redeemed',
    expired: 'expired',
  }
  return (
    <span
      className={`font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
        styles[status] ?? styles['pending']
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}

function midEllipsis(token: string) {
  if (token.length <= 10) return token
  return `${token.slice(0, 4)}…${token.slice(-4)}`
}

function relativeFromNow(now: number, target: number, direction: 'past' | 'future'): string {
  const diff = direction === 'past' ? now - target : target - now
  if (diff < 0) return direction === 'future' ? 'expired' : 'just now'
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return direction === 'past' ? 'just now' : 'in <1m'
  if (minutes < 60) return direction === 'past' ? `${minutes}m ago` : `in ${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return direction === 'past' ? `${hours}h ago` : `in ${hours}h`
  const days = Math.round(hours / 24)
  return direction === 'past' ? `${days}d ago` : `in ${days}d`
}

