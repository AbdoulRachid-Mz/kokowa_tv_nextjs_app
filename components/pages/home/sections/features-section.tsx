// components/home/sections/features-section.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, Users, Shield, BarChart3, FileText, Video, Bell, Globe, Target, Trophy } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function FeaturesSection() {
  const features = [
    {
      title: "Gestion des Compétitions",
      description: "Organisez et gérez toutes les phases de vos compétitions, des qualifications aux finales.",
      icon: Trophy,
      color: "text-blue-600",
      features: ["Phases et groupes", "Calendrier automatique", "Résultats en temps réel"]
    },
    {
      title: "Gestion des Lutteurs",
      description: "Suivez les profils, statistiques et performances de tous les lutteurs professionnels.",
      icon: Users,
      color: "text-emerald-600",
      features: ["Fiches détaillées", "Palmarès", "Transferts"]
    },
    {
      title: "Matchs en Direct",
      description: "Diffusez et suivez les matchs en direct avec commentaires et statistiques en temps réel.",
      icon: Target,
      color: "text-purple-600",
      features: ["Streaming live", "Statistiques live", "Chat interactif"]
    },
    {
      title: "Administration Complète",
      description: "Tableau de bord complet pour la gestion de toute l'organisation.",
      icon: Shield,
      color: "text-amber-600",
      features: ["Gestion des utilisateurs", "Rapports détaillés", "Paramètres avancés"]
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Typography variant="h2" weight="bold" className="mb-4">
            Tout ce dont vous avez besoin pour{' '}
            <span className="text-primary">gérer la lutte traditionnelle</span>
          </Typography>
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            Une plateforme complète conçue spécifiquement pour les besoins uniques 
            de la gestion des compétitions de lutte traditionnelle.
          </Typography>
        </motion.div>

        {/* Features Tabs */}
        <Tabs defaultValue="competitions" className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-12">
            <TabsTrigger value="competitions" className="gap-2">
              <Trophy className="h-4 w-4" />
              Compétitions
            </TabsTrigger>
            <TabsTrigger value="fighters" className="gap-2">
              <Users className="h-4 w-4" />
              Lutteurs
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Target className="h-4 w-4" />
              Matchs
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Shield className="h-4 w-4" />
              Administration
            </TabsTrigger>
          </TabsList>

          {features.map((feature, index) => (
            <TabsContent key={feature.title} value={feature.title.toLowerCase().split(' ')[0]}>
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid lg:grid-cols-2 gap-12 items-center"
              >
                <div>
                  <div className="inline-flex items-center gap-2 mb-6">
                    <div className={`p-3 rounded-xl bg-${feature.color.split('-')[1]}-500/10`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <Typography variant="h5" weight="medium">
                      {feature.title}
                    </Typography>
                  </div>
                  
                  <Typography variant="h3" weight="bold" className="mb-4">
                    {feature.title}
                  </Typography>
                  
                  <Typography variant="body-lg" theme="muted" className="mb-8">
                    {feature.description}
                  </Typography>

                  <ul className="space-y-3 mb-8">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <Typography variant="body-base">{item}</Typography>
                      </li>
                    ))}
                  </ul>

                  <Button className="gap-2" asChild>
                    <Link href={`/ad/${feature.title.toLowerCase().split(' ')[0]}`}>
                      Explorer {feature.title.split(' ')[0]}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden border shadow-2xl">
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <div className="p-8 text-center">
                        <feature.icon className={`h-24 w-24 ${feature.color} opacity-20 mx-auto mb-6`} />
                        <Typography variant="h4" weight="bold">
                          {feature.title}
                        </Typography>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  {index === 0 && (
                    <>
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg border"
                      >
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg border"
                      >
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}