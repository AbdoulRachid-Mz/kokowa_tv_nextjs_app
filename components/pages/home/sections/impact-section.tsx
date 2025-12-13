// components/home/sections/impact-section.tsx
'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Target, Heart, Globe, Award, Users, TrendingUp, Shield, Star } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

export function ImpactSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])

  const impacts = [
    {
      title: "Promotion Culturelle",
      description: "Préservation et promotion du patrimoine culturel à travers la lutte traditionnelle.",
      icon: Heart,
      color: "text-red-600",
      stats: "15+ années de tradition"
    },
    {
      title: "Développement Régional",
      description: "Création d'opportunités économiques et sociales dans les régions participantes.",
      icon: Globe,
      color: "text-blue-600",
      stats: "500+ emplois créés"
    },
    {
      title: "Excellence Sportive",
      description: "Formation et développement des talents pour l'excellence sportive.",
      icon: Award,
      color: "text-yellow-600",
      stats: "50+ champions formés"
    },
    {
      title: "Communauté Engagée",
      description: "Une communauté active et engagée autour des valeurs du sport traditionnel.",
      icon: Users,
      color: "text-green-600",
      stats: "10,000+ membres"
    }
  ]

  return (
    <section ref={containerRef} className="py-20 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0,0.1)_1px,transparent_0)] bg-[size:40px_40px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Typography variant="h2" weight="bold" className="mb-4">
            Plus qu'une plateforme, un{' '}
            <span className="text-primary">impact réel</span>
          </Typography>
          <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
            Notre engagement va au-delà de la technologie pour créer un impact significatif 
            sur la pratique et la promotion de la lutte traditionnelle.
          </Typography>
        </motion.div>

        {/* Impact cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {impacts.map((impact, index) => (
            <motion.div
              key={impact.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="relative p-6 rounded-2xl border bg-card backdrop-blur-sm h-full hover:shadow-xl transition-all duration-300">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-${impact.color.split('-')[1]}-500/10 mb-4`}>
                  <impact.icon className={`h-6 w-6 ${impact.color}`} />
                </div>

                {/* Title */}
                <Typography variant="h5" weight="medium" className="mb-3">
                  {impact.title}
                </Typography>

                {/* Description */}
                <Typography variant="body-base" theme="muted" className="mb-4">
                  {impact.description}
                </Typography>

                {/* Stats */}
                <div className="mt-auto">
                  <Typography variant="body-sm" weight="medium" className="text-primary">
                    {impact.stats}
                  </Typography>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/20 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating testimonial */}
        <motion.div
          style={{ y }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl p-8 border relative"
        >
          <div className="absolute -top-4 -left-4 bg-primary text-white p-3 rounded-full">
            <Star className="h-6 w-6" fill="white" />
          </div>
          
          <Typography variant="h4" className="text-center mb-6 italic">
            "Grâce à cette plateforme, nous avons pu organiser notre plus grande compétition 
            avec une efficacité jamais vue auparavant. Un outil indispensable pour la lutte traditionnelle moderne."
          </Typography>
          
          <div className="text-center">
            <Typography variant="body-base" weight="medium">
              — Directeur de la Fédération de Lutte Traditionnelle
            </Typography>
            <Typography variant="body-sm" theme="muted">
              Depuis 2023
            </Typography>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mt-16"
        >
          <Typography variant="h4" weight="medium" className="mb-6">
            Prêt à faire partie de l'impact ?
          </Typography>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/auth/register">
                <Shield className="h-4 w-4" />
                Rejoindre la Plateforme
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/contact">
                <TrendingUp className="h-4 w-4" />
                Demander une Démo
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}