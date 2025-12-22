// components/fighters/profile/fighter-cards.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertTriangle, 
  AlertCircle,
  Calendar,
  Swords,
  Trophy,
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FighterCardsProps {
  cards: any[]
}

export function FighterCards({ cards }: FighterCardsProps) {
  if (!cards || cards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Cartons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <Typography variant="body-base" theme="muted">
                Aucun carton reçu
              </Typography>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const getCardColor = (cardType: string) => {
    switch (cardType) {
      case 'yellow': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'red': return 'bg-red-500/20 text-red-600 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getCardIcon = (cardType: string) => {
    return cardType === 'red' ? AlertTriangle : AlertCircle
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A'
    return timeString
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Cartons ({cards.length})
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {cards.filter(c => c.cardType === 'red').length} rouges
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cards.map((card, index) => {
              const CardIcon = getCardIcon(card.cardType)
              
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  {/* Card icon */}
                  <div className={`p-3 rounded-lg ${getCardColor(card.cardType)}`}>
                    <CardIcon className="h-6 w-6" />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Typography variant="body-base" weight="medium" className="capitalize">
                          Carton {card.cardType}
                        </Typography>
                        {card.matchNumber && (
                          <Typography variant="body-sm" theme="muted">
                            Match #{card.matchNumber}
                          </Typography>
                        )}
                      </div>
                      {card.minuteGiven && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(card.minuteGiven)}
                        </Badge>
                      )}
                    </div>

                    {/* Reason */}
                    {card.cardReason && (
                      <Typography variant="body-sm" theme="muted" className="mb-3">
                        {card.cardReason}
                      </Typography>
                    )}

                    {/* Match info */}
                    <div className="flex items-center gap-4">
                      {card.matchDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <Typography variant="body-sm">
                            {new Date(card.matchDate).toLocaleDateString('fr-FR')}
                          </Typography>
                        </div>
                      )}
                      
                      {card.opponentNickname && (
                        <div className="flex items-center gap-1">
                          <Swords className="h-3 w-3 text-muted-foreground" />
                          <Typography variant="body-sm">
                            vs {card.opponentNickname}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t">
            <Typography variant="body-sm" weight="medium" className="mb-3">
              Résumé des cartons
            </Typography>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                <Typography variant="h4" weight="bold" className="text-yellow-600 mb-1">
                  {cards.filter(c => c.cardType === 'yellow').length}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Cartons jaunes
                </Typography>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <Typography variant="h4" weight="bold" className="text-red-600 mb-1">
                  {cards.filter(c => c.cardType === 'red').length}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Cartons rouges
                </Typography>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}