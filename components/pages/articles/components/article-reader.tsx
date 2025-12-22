// components/articles/article-reader.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { BookOpen, Moon, Sun, Type, Volume2, Eye } from 'lucide-react'

interface ArticleReaderProps {
  content: string
}

export function ArticleReader({ content }: ArticleReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(16)
  const [darkMode, setDarkMode] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  useEffect(() => {
    // Suivi de la progression de lecture
    const handleScroll = () => {
      if (!containerRef.current) return

      const element = containerRef.current
      const totalHeight = element.scrollHeight - element.clientHeight
      const currentPosition = element.scrollTop
      const progress = (currentPosition / totalHeight) * 100

      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }

    const element = containerRef.current
    element?.addEventListener('scroll', handleScroll)

    // Initialiser la synthèse vocale
    if ('speechSynthesis' in window) {
      const voices = speechSynthesis.getVoices()
      const frenchVoice = voices.find(v => v.lang.startsWith('fr'))
      setVoice(frenchVoice || voices[0])
    }

    return () => {
      element?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleTextToSpeech = () => {
    if (!speaking) {
      const utterance = new SpeechSynthesisUtterance(content)
      if (voice) utterance.voice = voice
      utterance.rate = 0.9
      utterance.pitch = 1
      
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      
      speechSynthesis.speak(utterance)
      setSpeaking(true)
    } else {
      speechSynthesis.cancel()
      setSpeaking(false)
    }
  }

  const estimatedReadingTime = Math.ceil(content.split(' ').length / 200)

  return (
    <div className="relative">
      {/* Contrôles de lecture */}
      <motion.div
        style={{ opacity }}
        className="sticky top-24 z-10 mb-6"
      >
        <div className="flex items-center justify-between bg-background/80 backdrop-blur-sm rounded-xl p-3 border">
          <div className="flex items-center gap-2">
            <Typography variant="body-sm" weight="medium">
              {estimatedReadingTime} min
            </Typography>
            <span className="text-muted-foreground">•</span>
            <Typography variant="body-sm" theme="muted">
              {Math.round(readingProgress)}% lu
            </Typography>
          </div>

          <div className="flex items-center gap-2">
            {/* Taille de police */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8"
                onClick={() => setFontSize(Math.max(14, fontSize - 1))}
              >
                <Typography variant="body-sm">A-</Typography>
              </Button>
              <Typography variant="body-sm" className="min-w-[40px] text-center">
                {fontSize}px
              </Typography>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8"
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              >
                <Typography variant="body-sm">A+</Typography>
              </Button>
            </div>

            {/* Mode sombre */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Synthèse vocale */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8"
              onClick={handleTextToSpeech}
            >
              <Volume2 className={`h-4 w-4 ${speaking ? 'text-primary animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${readingProgress}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </motion.div>

      {/* Contenu avec styles dynamiques */}
      <div
        ref={containerRef}
        className={`overflow-y-auto max-h-[600px] rounded-xl border p-6 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-card'}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {/* Fin d'article */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t text-center"
        >
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <Typography variant="h4" weight="bold" className="mb-2">
            Vous avez terminé cet article !
          </Typography>
          <Typography variant="body-base" theme="muted" className="mb-6">
            Merci d'avoir pris le temps de lire cet article. Partagez-le si vous l'avez aimé !
          </Typography>
          
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">
                Temps de lecture : {estimatedReadingTime} minutes
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">
                {content.length.toLocaleString()} caractères
              </Typography>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}