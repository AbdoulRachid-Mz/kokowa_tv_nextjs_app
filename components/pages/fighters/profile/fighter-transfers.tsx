// components/fighters/profile/fighter-transfers.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  MapPin, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FighterTransfersProps {
  transfers: any[]
}

export function FighterTransfers({ transfers }: FighterTransfersProps) {
  if (!transfers || transfers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Transferts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <Typography variant="body-base" theme="muted">
                Aucun transfert enregistré
              </Typography>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-600 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle
      case 'pending': return AlertCircle
      case 'rejected': return XCircle
      default: return AlertCircle
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Transferts ({transfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transfers.map((transfer, index) => {
              const StatusIcon = getStatusIcon(transfer.status)

              return (
                <motion.div
                  key={transfer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <Badge className={getStatusColor(transfer.status)}>
                        {transfer.status === 'approved' ? 'Approuvé' : 
                         transfer.status === 'pending' ? 'En attente' : 'Rejeté'}
                      </Badge>
                    </div>
                    <Typography variant="body-sm" theme="muted">
                      {formatDate(transfer.transferDate)}
                    </Typography>
                  </div>

                  {/* Transfer flow */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
                        <Typography variant="body-sm" weight="bold" className="text-red-600">
                          {transfer.fromRegionCode?.substring(0, 2)}
                        </Typography>
                      </div>
                      <Typography variant="body-sm" theme="muted">
                        {transfer.fromRegionName}
                      </Typography>
                    </div>

                    <div className="flex-1 px-4">
                      <div className="relative">
                        <div className="h-0.5 bg-border" />
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-1">
                        <Typography variant="body-sm" weight="bold" className="text-emerald-600">
                          {transfer.toRegionCode?.substring(0, 2)}
                        </Typography>
                      </div>
                      <Typography variant="body-sm" theme="muted">
                        {transfer.toRegionName}
                      </Typography>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3">
                    {transfer.transferFee > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Montant
                          </Typography>
                          <Typography variant="body-sm" weight="medium">
                            {formatCurrency(transfer.transferFee)}
                          </Typography>
                        </div>
                      </div>
                    )}

                    {transfer.contractDuration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Durée
                          </Typography>
                          <Typography variant="body-sm" weight="medium">
                            {transfer.contractDuration} mois
                          </Typography>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  {transfer.transferReason && (
                    <div className="mt-3 pt-3 border-t">
                      <Typography variant="body-sm" theme="muted" className="mb-1">
                        Raison
                      </Typography>
                      <Typography variant="body-sm">
                        {transfer.transferReason}
                      </Typography>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}