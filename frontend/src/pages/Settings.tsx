import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Check, ExternalLink } from 'lucide-react'
import { getIntegrationSettings, upsertIntegrationSettings, triggerGranolaSync } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { IntegrationSettings } from '@/types'

export default function Settings() {
  const [granola, setGranola] = useState<IntegrationSettings | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const settings = await getIntegrationSettings('granola')
      if (settings) {
        setGranola(settings)
        setApiKey(settings.api_key)
      }
    } catch {
      // Table may not exist yet
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const settings = await upsertIntegrationSettings('granola', {
        api_key: apiKey,
        enabled: !!apiKey.trim(),
      })
      setGranola(settings)
      toast.success('Granola settings saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await triggerGranolaSync()
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} meeting${result.synced !== 1 ? 's' : ''} from Granola`)
      } else {
        toast.info(result.message || 'No new meetings to sync')
      }
      loadSettings()
    } catch (err: any) {
      toast.error(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    setSaving(true)
    try {
      const settings = await upsertIntegrationSettings('granola', {
        api_key: '',
        enabled: false,
      })
      setGranola(settings)
      setApiKey('')
      toast.success('Granola disconnected')
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage integrations and preferences.</p>
      </div>

      {/* Granola Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg">
                🫘
              </div>
              <div>
                <CardTitle className="text-lg">Granola AI</CardTitle>
                <p className="text-sm text-muted-foreground">Auto-sync meeting notes to deal timelines</p>
              </div>
            </div>
            {granola?.enabled ? (
              <Badge variant="default">Connected</Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Granola account to automatically import meeting notes as touchpoints.
            Meetings are matched to deals by company name and appear on deal timelines.
          </p>

          <Separator />

          {loading ? (
            <div className="space-y-3">
              <div className="h-9 bg-muted animate-pulse rounded" />
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="grn_..."
                    className="font-mono"
                  />
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : <Check className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from Granola Settings &rarr; Integrations &rarr; Personal API
                </p>
              </div>

              {granola?.enabled && (
                <>
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Sync meetings</p>
                      <p className="text-xs text-muted-foreground">
                        {granola.last_synced_at
                          ? `Last synced: ${new Date(granola.last_synced_at).toLocaleString()}`
                          : 'Never synced'}
                      </p>
                    </div>
                    <Button onClick={handleSync} disabled={syncing} variant="outline">
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>

                  <Separator />

                  <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDisconnect}>
                    Disconnect Granola
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Future integrations placeholder */}
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            More integrations coming soon — Slack, Notion, HubSpot, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
