// components/home/sections/hero-section.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { ArrowRight, Play, Trophy, Users, Target } from 'lucide-react'
import Link from 'next/link'
import { useScreenSize } from '@/hooks/use-screen'

export function HeroSection() {
  const { isSmallScreen } = useScreenSize()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Trophy className="h-4 w-4 text-primary" />
            <Typography variant="body-sm" weight="medium">
              Plateforme Officielle de Lutte Traditionnelle
            </Typography>
          </motion.div>

          {/* Main title */}
          <motion.div variants={itemVariants} custom={0}>
            <Typography 
              variant={isSmallScreen ? "h1" : "h1"} 
              weight="bold" 
              className="mb-6"
            >
              La{' '}
              <span className="text-primary">Référence</span>{' '}
              <br className={isSmallScreen ? "block" : "hidden"} />
              pour la{' '}
              <span className="relative">
                Lutte Traditionnelle
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="absolute bottom-2 left-0 h-2 bg-primary/30 -z-10 rounded-full"
                />
              </span>
            </Typography>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={itemVariants}>
            <Typography 
              variant={isSmallScreen ? "body-lg" : "h4"} 
              theme="muted" 
              className="mb-10 max-w-2xl mx-auto"
            >
              Gérez, suivez et promevez les compétitions de lutte traditionnelle 
              avec la première plateforme digitale dédiée au sport traditionnel africain.
            </Typography>
          </motion.div>

          {/* Stats preview */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            <div className="text-center">
              <Typography variant="h3" weight="bold" className="text-primary">
                500+
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Lutteurs
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h3" weight="bold" className="text-primary">
                50+
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Compétitions
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h3" weight="bold" className="text-primary">
                15+
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Régions
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h3" weight="bold" className="text-primary">
                1000+
              </Typography>
              <Typography variant="body-sm" theme="muted">
                Matchs
              </Typography>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" className="gap-2 group" asChild>
              <Link href="/competitions">
                Explorer les Compétitions
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/auth/register">
                <Users className="h-4 w-4" />
                Rejoindre la Communauté
              </Link>
            </Button>
          </motion.div>

          {/* Video preview */}
          <motion.div 
            variants={itemVariants}
            className="mt-16 relative"
          >
            <div className="relative rounded-2xl overflow-hidden border shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                >
                  <Play className="h-8 w-8 text-white" fill="white" />
                </Button>
              </div>
              <div className="absolute bottom-4 left-4 z-20">
                <Typography variant="body-sm" className="text-white">
                  Découvrez notre plateforme en 2 minutes
                </Typography>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}