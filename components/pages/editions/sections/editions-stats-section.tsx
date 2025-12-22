// components/editions/sections/editions-stats-section.tsx
"use client";

import { motion, Variants } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import {
  Trophy,
  Calendar,
  Users,
  MapPin,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEditionsStats } from "@/hooks/use-editions";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react"; // Ajout de useRef

interface EditionsStatsSectionProps {
  stats: {
    total: number;
    current: number;
    upcoming: number;
    completed: number;
  };
  loading: boolean;
}

export function EditionsStatsSection({
  stats,
  loading,
}: EditionsStatsSectionProps) {
  const [animatedValues, setAnimatedValues] = useState({
    total: 0,
    ongoing: 0,
    upcoming: 0,
    completed: 0,
  });

  const animationStarted = useRef(false); // Référence pour suivre si l'animation a démarré

  useEffect(() => {
    if (loading || animationStarted.current) return;

    animationStarted.current = true;

    // Réinitialiser les valeurs
    setAnimatedValues({
      total: 0,
      ongoing: 0,
      upcoming: 0,
      completed: 0,
    });

    const interval = setInterval(() => {
      setAnimatedValues((prev) => {
        const newValues = {
          total: Math.min(
            prev.total + Math.ceil(stats.total / 30),
            stats.total
          ),
          ongoing: Math.min(
            prev.ongoing + Math.ceil(stats.current / 20),
            stats.current
          ),
          upcoming: Math.min(
            prev.upcoming + Math.ceil(stats.upcoming / 20),
            stats.upcoming
          ),
          completed: Math.min(
            prev.completed + Math.ceil(stats.completed / 30),
            stats.completed
          ),
        };

        // Arrêter l'animation quand toutes les valeurs sont atteintes
        if (
          newValues.total === stats.total &&
          newValues.ongoing === stats.current &&
          newValues.upcoming === stats.upcoming &&
          newValues.completed === stats.completed
        ) {
          clearInterval(interval);
        }

        return newValues;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [stats, loading]);

  const statCards = [
    {
      icon: Trophy,
      title: "Éditions Total",
      value: animatedValues.total,
      description: "Toutes les éditions",
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Calendar,
      title: "En Cours",
      value: animatedValues.ongoing,
      description: "Éditions actives",
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Target,
      title: "À Venir",
      value: animatedValues.upcoming,
      description: "Éditions programmées",
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Users,
      title: "Terminées",
      value: animatedValues.completed,
      description: "Éditions passées",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            : statCards.map((stat) => (
                <motion.div
                  key={stat.title}
                  variants={cardVariants}
                  className="relative group"
                >
                  <div
                    className={`relative p-5 rounded-xl border bg-card/50 backdrop-blur-sm ${stat.bgColor} transition-all duration-300 hover:shadow-lg`}
                  >
                    {/* Icon */}
                    <div
                      className={`inline-flex p-2.5 rounded-lg ${stat.bgColor} mb-3`}
                    >
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>

                    {/* Value */}
                    <Typography variant="h3" weight="bold" className="mb-1">
                      {stat.value}
                    </Typography>

                    {/* Title */}
                    <Typography
                      variant="body-base"
                      weight="medium"
                      className="mb-1"
                    >
                      {stat.title}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body-sm" theme="muted">
                      {stat.description}
                    </Typography>

                    {/* Animated line */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1 }}
                      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
        </motion.div>

        {/* Additional stats - conditionnel uniquement si stats existe */}
        {stats && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div className="text-center p-4 rounded-xl bg-muted/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <Typography variant="body-sm" theme="muted">
                  Participants Moyens
                </Typography>
              </div>
              <Typography variant="h4" weight="bold">
                {Math.round(stats.total)}
              </Typography>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <Typography variant="body-sm" theme="muted">
                  Max Participants
                </Typography>
              </div>
              <Typography variant="h4" weight="bold">
                {stats.total}
              </Typography>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <Typography variant="body-sm" theme="muted">
                  Taux de Remplissage
                </Typography>
              </div>
              <Typography variant="h4" weight="bold">
                {((stats.current / stats.total) * 100).toFixed(0)}%
              </Typography>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
