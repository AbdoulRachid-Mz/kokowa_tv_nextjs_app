// components/home/sections/cta-section.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Users, Target, Check } from 'lucide-react'
import Link from 'next/link'

export function CtaSection() {
  const benefits = [
    "Gestion complète des compétitions",
    "Statistiques en temps réel",
    "Streaming des matchs en direct",
    "Communauté active",
    "Support technique 24/7",
    "Formations gratuites"
  ]

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <motion.div
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, var(--primary) 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, var(--secondary) 2px, transparent 2px)`,
          backgroundSize: "60px 60px"
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Shield className="h-4 w-4 text-primary" />
              <Typography variant="body-sm" weight="medium">
                Plateforme Professionnelle
              </Typography>
            </motion.div>

            {/* Main title */}
            <Typography variant="h2" weight="bold" className="mb-6">
              Prêt à{' '}
              <span className="text-primary">révolutionner</span>{' '}
              la gestion de vos compétitions ?
            </Typography>

            {/* Description */}
            <Typography variant="body-lg" theme="muted" className="mb-10 max-w-2xl mx-auto">
              Rejoignez des centaines d'organisations qui font déjà confiance 
              à notre plateforme pour gérer leurs compétitions de lutte traditionnelle.
            </Typography>

            {/* Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <Typography variant="body-sm">{benefit}</Typography>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button size="lg" className="gap-2 group" asChild>
                <Link href="/auth/register">
                  Commencer Gratuitement
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="/contact">
                  <Users className="h-4 w-4" />
                  Demander une Démo
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Organisations", value: "150+" },
                { label: "Compétitions", value: "500+" },
                { label: "Satisfaction", value: "98%" },
                { label: "Support", value: "24/7" }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <Typography variant="h3" weight="bold" className="text-primary">
                    {stat.value}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    {stat.label}
                  </Typography>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}