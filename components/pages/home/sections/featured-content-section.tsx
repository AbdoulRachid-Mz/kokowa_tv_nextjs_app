// components/home/sections/featured-content-section.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { FileText, Video, Image, TrendingUp, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export function FeaturedContentSection() {
  const featuredContent = [
    {
      type: 'article',
      title: "L'Évolution de la Lutte Traditionnelle",
      description: "Comment la technologie transforme la gestion des compétitions traditionnelles.",
      author: "Équipe Rédaction",
      date: "15 Jan 2024",
      views: "2.4K",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      type: 'video',
      title: "Techniques Avancées de Lutte",
      description: "Analyse des techniques utilisées par les champions actuels.",
      author: "Coach Moussa",
      date: "10 Jan 2024",
      views: "5.7K",
      icon: Video,
      color: "text-red-600"
    },
    {
      type: 'gallery',
      title: "Championnat National 2023",
      description: "Les meilleurs moments du tournoi de l'année.",
      author: "Photographe Officiel",
      date: "5 Jan 2024",
      views: "3.2K",
      icon: Image,
      color: "text-green-600"
    },
    {
      type: 'stats',
      title: "Statistiques de la Saison",
      description: "Analyse complète des performances de tous les lutteurs.",
      author: "Département Statistiques",
      date: "1 Jan 2024",
      views: "1.8K",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ]

  return (
    <section className="py-20">
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
            Contenu en{' '}
            <span className="text-primary">Vedette</span>
          </Typography>
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            Découvrez les dernières actualités, analyses et moments forts 
            du monde de la lutte traditionnelle.
          </Typography>
        </motion.div>

        {/* Carousel */}
        <Carousel className="w-full max-w-6xl mx-auto">
          <CarouselContent>
            {featuredContent.map((content, index) => (
              <CarouselItem key={content.title} className="md:basis-1/2 lg:basis-1/3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full"
                >
                  <div className="relative h-full rounded-2xl border bg-card p-6 hover:shadow-xl transition-all duration-300 group">
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl bg-${content.color.split('-')[1]}-500/10 mb-4`}>
                      <content.icon className={`h-6 w-6 ${content.color}`} />
                    </div>

                    {/* Type badge */}
                    <div className="absolute top-6 right-6">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${content.color} bg-${content.color.split('-')[1]}-500/10`}>
                        {content.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Title */}
                    <Typography variant="h5" weight="medium" className="mb-3">
                      {content.title}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body-base" theme="muted" className="mb-6 line-clamp-3">
                      {content.description}
                    </Typography>

                    {/* Meta */}
                    <div className="space-y-3 mt-auto">
                      <div className="flex items-center justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Par {content.author}
                        </Typography>
                        <Typography variant="body-sm" theme="muted">
                          {content.date}
                        </Typography>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <Typography variant="body-sm" theme="muted">
                            {content.views} vues
                          </Typography>
                        </div>
                        <Button size="sm" variant="ghost" className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          Lire plus
                        </Button>
                      </div>
                    </div>

                    {/* Hover effect */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/20 transition-all duration-300" />
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-4 mt-8">
            <CarouselPrevious className="relative" />
            <CarouselNext className="relative" />
          </div>
        </Carousel>

        {/* Additional sections */}
        <div className="grid md:grid-cols-2 gap-8 mt-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border bg-gradient-to-br from-blue-500/5 to-transparent p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
              <Typography variant="h5" weight="medium">
                Calendrier des Événements
              </Typography>
            </div>
            <Typography variant="body-base" theme="muted" className="mb-6">
              Ne manquez aucun événement important. Consultez le calendrier complet 
              des compétitions, matchs et événements spéciaux.
            </Typography>
            <Button variant="outline" asChild>
              <Link href="/matches">
                Voir le Calendrier
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border bg-gradient-to-br from-green-500/5 to-transparent p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <Typography variant="h5" weight="medium">
                Classements en Direct
              </Typography>
            </div>
            <Typography variant="body-base" theme="muted" className="mb-6">
              Suivez les classements mis à jour en temps réel. Découvrez qui mène 
              la course au titre de champion.
            </Typography>
            <Button variant="outline" asChild>
              <Link href="/fighters">
                Voir les Classements
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}