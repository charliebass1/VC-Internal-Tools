import { useState } from 'react'
import { RefreshCw, ExternalLink, Building2, Users, DollarSign, Calendar, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CompanyProfile, Deal } from '@/types'

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface CompanyProfileCardProps {
  profile: CompanyProfile | null
  deal: Deal
  onEnrich: () => void
  onReEnrich: () => void
  enriching: boolean
  streamingText?: string
}

export function CompanyProfileCard({
  profile,
  deal,
  onEnrich,
  onReEnrich,
  enriching,
  streamingText,
}: CompanyProfileCardProps) {
  const [logoError, setLogoError] = useState(false)

  // Empty state: no profile yet
  if (!profile && !enriching) {
    return (
      <Card className="mb-8">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Enrich company profile</p>
              <p className="text-sm text-muted-foreground">
                Auto-generate a structured profile for {deal.company_name} using AI.
              </p>
            </div>
          </div>
          <Button onClick={onEnrich} disabled={enriching}>
            <Sparkles className="h-4 w-4 mr-2" />
            Enrich Now
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (enriching && !profile) {
    return (
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
          {streamingText ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
            </p>
          ) : (
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded animate-pulse w-full" />
              <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!profile) return null

  const logoUrl = profile.logo_url
  const initials = deal.company_name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Card className="mb-8">
      <CardContent className="py-6">
        {/* Top row: logo + summary + re-enrich */}
        <div className="flex gap-4">
          {/* Logo */}
          <div className="shrink-0">
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt={deal.company_name}
                className="h-14 w-14 rounded-lg object-contain bg-white border"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {initials}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">{deal.company_name}</h3>
                {profile.funding_stage && (
                  <Badge variant="secondary" className="mt-1">
                    {profile.funding_stage}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReEnrich}
                disabled={enriching}
                className="shrink-0 text-muted-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${enriching ? 'animate-spin' : ''}`} />
                Re-enrich
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {enriching && streamingText ? (
                <>
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                </>
              ) : (
                profile.ai_summary
              )}
            </p>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t">
          {profile.founded_year && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Founded</p>
                <p className="text-sm font-medium">{profile.founded_year}</p>
              </div>
            </div>
          )}
          {profile.team_size_range && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Team Size</p>
                <p className="text-sm font-medium">{profile.team_size_range}</p>
              </div>
            </div>
          )}
          {profile.funding_stage && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Stage</p>
                <p className="text-sm font-medium">{profile.funding_stage}</p>
              </div>
            </div>
          )}
          {profile.total_raised && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Raised</p>
                <p className="text-sm font-medium">{profile.total_raised}</p>
              </div>
            </div>
          )}
        </div>

        {/* Competitors */}
        {profile.competitors.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Competitors</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.competitors.map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key People */}
        {profile.key_people.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Key People</p>
            <div className="flex flex-wrap gap-3">
              {profile.key_people.map((person) => (
                <div
                  key={person.name}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {person.name
                      .split(' ')
                      .map(w => w[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{person.title}</p>
                  </div>
                  {person.linkedin_url && (
                    <a
                      href={person.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-primary ml-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enriched timestamp */}
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
          Enriched {timeAgo(profile.enriched_at)}
        </p>
      </CardContent>
    </Card>
  )
}
