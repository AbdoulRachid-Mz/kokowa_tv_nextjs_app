// components/ui/prose.tsx
'use client'

import { motion } from 'framer-motion'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface ProseProps {
  content: string
  className?: string
}

export function Prose({ content, className }: ProseProps) {
  // Parser le contenu markdown ou texte simple
  const parseContent = (text: string) => {
    const paragraphs = text.split('\n\n')
    
    return paragraphs.map((paragraph, index) => {
      // Vérifier si c'est un titre
      if (paragraph.startsWith('# ')) {
        return (
          <motion.h2
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-2xl font-bold mt-8 mb-4 text-foreground"
          >
            {paragraph.substring(2)}
          </motion.h2>
        )
      }
      
      if (paragraph.startsWith('## ')) {
        return (
          <motion.h3
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl font-semibold mt-6 mb-3 text-foreground"
          >
            {paragraph.substring(3)}
          </motion.h3>
        )
      }
      
      if (paragraph.startsWith('### ')) {
        return (
          <motion.h4
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-medium mt-4 mb-2 text-foreground"
          >
            {paragraph.substring(4)}
          </motion.h4>
        )
      }
      
      // Vérifier si c'est une liste
      if (paragraph.includes('\n- ') || paragraph.includes('\n* ')) {
        const items = paragraph.split('\n').filter(line => line.startsWith('- ') || line.startsWith('* '))
        
        return (
          <motion.ul
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-4 space-y-2"
          >
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex items-start gap-2">
                <span className="text-primary mt-2">•</span>
                <Typography variant="body-base">{item.substring(2)}</Typography>
              </li>
            ))}
          </motion.ul>
        )
      }
      
      // Vérifier si c'est une citation
      if (paragraph.startsWith('> ')) {
        return (
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border-l-4 border-primary pl-4 my-6 italic text-muted-foreground"
          >
            {paragraph.substring(2)}
          </motion.blockquote>
        )
      }
      
      // Paragraphe normal
      return (
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-4 leading-relaxed"
        >
          {paragraph}
        </motion.p>
      )
    })
  }

  return (
    <div className={cn('prose prose-lg dark:prose-invert max-w-none', className)}>
      {parseContent(content)}
    </div>
  )
}