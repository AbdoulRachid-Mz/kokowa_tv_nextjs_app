// components/fighters/profile/fighter-bio.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  MapPin, 
  Calendar, 
  Weight, 
  Ruler,
  Target,
  Award,
  Users
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InteractionButton } from '@/components/shared/interactions-button'

interface FighterBioProps {
  fighter: any
}

export function FighterBio({ fighter }: FighterBioProps) {
  if (!fighter) return null

  const age = fighter.birthDate ? 
    new Date().getFullYear() - new Date(fighter.birthDate).getFullYear() : null

  const infoItems = [
    {
      icon: User,
      label: "Nom complet",
      value: `${fighter.firstName} ${fighter.lastName}`,
      color: "text-blue-600"
    },
    {
      icon: MapPin,
      label: "Lieu de naissance",
      value: fighter.birthPlace || "Non renseigné",
      color: "text-emerald-600"
    },
    {
      icon: Calendar,
      label: "Date de naissance",
      value: fighter.birthDate ? 
        new Date(fighter.birthDate).toLocaleDateString('fr-FR') : "Non renseignée",
      color: "text-purple-600"
    },
    {
      icon: Target,
      label: "Année de début",
      value: fighter.debutYear || "Non renseignée",
      color: "text-amber-600"
    },
    {
      icon: Weight,
      label: "Poids",
      value: fighter.weight ? `${fighter.weight} kg` : "Non renseigné",
      color: "text-red-600"
    },
    {
      icon: Ruler,
      label: "Taille",
      value: fighter.height ? `${fighter.height} m` : "Non renseignée",
      color: "text-indigo-600"
    }
  ]

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
              <User className="h-5 w-5 text-primary" />
              Biographie
            </CardTitle>
            <div className="flex gap-2">
              <InteractionButton
                type="like"
                entityType="fighter"
                entityId={fighter.id}
                iconOnly
                count={0}
              />
              <InteractionButton
                type="bookmark"
                entityType="fighter"
                entityId={fighter.id}
                iconOnly
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nickname */}
          {fighter.nickname && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Typography variant="body-sm" theme="muted">
                  Surnom
                </Typography>
                <Typography variant="h5" className="italic">
                  "{fighter.nickname}"
                </Typography>
              </div>
            </div>
          )}

          {/* Bio */}
          {fighter.bio && (
            <div>
              <Typography variant="body-base" className="whitespace-pre-line leading-relaxed">
                {fighter.bio}
              </Typography>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color.replace('text-', 'bg-')}/10`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <Typography variant="body-sm" theme="muted">
                    {item.label}
                  </Typography>
                  <Typography variant="body-base" weight="medium">
                    {item.value}
                  </Typography>
                </div>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <Badge variant={fighter.isActive ? "default" : "secondary"}>
                {fighter.isActive ? "Actif" : "Inactif"}
              </Badge>
              {fighter.isChampion && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                  <Award className="h-3 w-3 mr-1" />
                  Champion
                </Badge>
              )}
              {age && (
                <Badge variant="outline">
                  {age} ans
                </Badge>
              )}
              {fighter.ranking && fighter.ranking <= 10 && (
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-600">
                  Top 10 Mondial
                </Badge>
              )}
            </div>
          </div>

          {/* Social links */}
          {fighter.socialLinks && Object.keys(fighter.socialLinks).length > 0 && (
            <div className="pt-4 border-t">
              <Typography variant="body-sm" weight="medium" className="mb-3">
                Réseaux sociaux
              </Typography>
              <div className="flex gap-2">
                {Object.entries(fighter.socialLinks).map(([platform, url]) => (
                  <Button
                    key={platform}
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={url as string} target="_blank" rel="noopener noreferrer">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}