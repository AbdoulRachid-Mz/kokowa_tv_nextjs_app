// components/matches/match-statistics.tsx
'use client'

// Statistiques RÉELLES du combat, calculées uniquement à partir des données
// enregistrées (cartons, durée, pauses, résultat, spectateurs).
// L'ancienne version affichait des valeurs tirées au hasard (Math.random) et
// une chronologie fictive identique pour tous les combats.

import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Match, FighterCard } from '@/types'
import { Clock, PauseCircle, Users, Trophy, AlertTriangle, Target as TargetIcon } from 'lucide-react'

interface MatchStatisticsProps {
  match: Match
}

function fighterName(f?: Match['fighter1']) {
  if (!f) return 'Lutteur'
  const name = `${f.first_name ?? ''} ${f.last_name ?? ''}`.trim()
  return name || 'Lutteur'
}

/** "05:48:00" (minutes:secondes:centièmes) ou "121:56" -> "05:48" / "121:56" */
function formatMinute(raw?: string) {
  if (!raw) return ''
  const parts = raw.split(':')
  return parts.length === 3 ? `${parts[0]}:${parts[1]}` : raw
}

function minuteToSeconds(raw?: string) {
  if (!raw) return Number.MAX_SAFE_INTEGER
  const [m, s] = raw.split(':').map((v) => parseInt(v, 10) || 0)
  return m * 60 + (s || 0)
}

function countCards(cards: FighterCard[], fighterId?: number) {
  const mine = cards.filter((c) => c.fighter_id === fighterId)
  return {
    yellow: mine.filter((c) => c.card_type === 'yellow').length,
    red: mine.filter((c) => c.card_type === 'red').length,
  }
}

function resultLabel(match: Match) {
  switch (match.match_result) {
    case 'fighter1_win':
      return `Victoire de ${fighterName(match.fighter1)}`
    case 'fighter2_win':
      return `Victoire de ${fighterName(match.fighter2)}`
    case 'draw':
      return 'Match nul'
    case 'cancelled':
      return 'Combat annulé'
    case 'postponed':
      return 'Combat reporté'
    default:
      return match.status === 'completed' ? 'Terminé' : 'En attente du résultat'
  }
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="text-primary">{icon}</div>
      <div>
        <Typography variant="body-sm" theme="muted">{label}</Typography>
        <Typography variant="body-base" weight="bold">{value}</Typography>
      </div>
    </div>
  )
}

export function MatchStatistics({ match }: MatchStatisticsProps) {
  if (!match.fighter1 || !match.fighter2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
          <CardDescription>Statistiques du combat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <Typography variant="body-base" theme="muted">
              Les statistiques ne sont pas disponibles pour ce combat
            </Typography>
          </div>
        </CardContent>
      </Card>
    )
  }

  const cards = (match.cards ?? []).filter((c) => !c.is_cancelled)
  const c1 = countCards(cards, match.fighter1_id ?? match.fighter1.id)
  const c2 = countCards(cards, match.fighter2_id ?? match.fighter2.id)
  const timeline = [...cards].sort((a, b) => minuteToSeconds(a.minute_given) - minuteToSeconds(b.minute_given))

  const rows = [
    { label: 'Avertissements (cartons jaunes)', a: c1.yellow, b: c2.yellow, color: 'bg-yellow-400' },
    { label: 'Cartons rouges', a: c1.red, b: c2.red, color: 'bg-red-500' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques du combat</CardTitle>
        <CardDescription>Données officielles enregistrées par les arbitres</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon={<Trophy className="h-5 w-5" />} label="Résultat" value={resultLabel(match)} />
          <StatTile icon={<Clock className="h-5 w-5" />} label="Durée" value={match.total_duration || 'Non renseignée'} />
          <StatTile icon={<PauseCircle className="h-5 w-5" />} label="Pauses" value={String(match.break_count ?? 0)} />
          <StatTile
            icon={<Users className="h-5 w-5" />}
            label="Spectateurs"
            value={match.audience_count ? match.audience_count.toLocaleString('fr-FR') : 'Non renseigné'}
          />
        </div>

        {/* Comparaison des sanctions */}
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>{fighterName(match.fighter1)}</span>
            <span>{fighterName(match.fighter2)}</span>
          </div>
          {rows.map((row) => {
            const total = row.a + row.b
            const pctA = total ? (row.a / total) * 100 : 50
            return (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{row.a}</span>
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold">{row.b}</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  {total > 0 && (
                    <>
                      <div className={row.color} style={{ width: `${pctA}%` }} />
                      <div className={`${row.color} opacity-50`} style={{ width: `${100 - pctA}%` }} />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Chronologie réelle des sanctions */}
        <div className="space-y-2">
          <Typography variant="body-base" weight="bold">Chronologie des sanctions</Typography>
          {timeline.length === 0 ? (
            <Typography variant="body-sm" theme="muted">Aucun carton dans ce combat.</Typography>
          ) : (
            timeline.map((card) => {
              const isF1 = card.fighter_id === (match.fighter1_id ?? match.fighter1?.id)
              return (
                <div key={card.id} className="flex items-center gap-3 rounded-lg bg-muted p-2">
                  <AlertTriangle
                    className={card.card_type === 'red' ? 'h-4 w-4 text-red-600' : 'h-4 w-4 text-yellow-600'}
                  />
                  <Badge variant="outline">{formatMinute(card.minute_given) || '—'}</Badge>
                  <span className="text-sm">
                    {card.card_type === 'red' ? 'Carton rouge' : 'Avertissement'} —{' '}
                    {fighterName(isF1 ? match.fighter1 : match.fighter2)}
                    {card.card_reason ? ` (${card.card_reason})` : ''}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
