"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Typography } from "@/components/ui/typography";
import { getMobileTeamMembers } from "@/actions/mobile/teams";
import { TeamMember } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star, Award, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const result = await getMobileTeamMembers();
        if (result.success && result.data?.members) {
          // Safely cast unknown data to TeamMember[] after type check
          setMembers((result.data.members as unknown as TeamMember[]) || []);
        }
      } catch (error) {
        console.error("Error fetching team for home section:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading || members.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decoration */}
      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <Users className="h-96 w-96 text-primary rotate-12" />
      </div>

      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4">
                L'Équipe Kokowa TV
              </Badge>
              <Typography variant="h2" weight="bold" className="mb-4">
                Les Visages Derrière la <span className="text-primary">Passion</span>
              </Typography>
              <Typography variant="body-lg" theme="muted">
                Découvrez les experts dévoués qui travaillent chaque jour pour vous offrir la meilleure expérience de sport et de divertissement.
              </Typography>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Button asChild variant="ghost" className="group">
              <Link href="/team" className="flex items-center gap-2">
                Voir toute l'équipe
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {members.slice(0, 4).map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="group h-full border-none shadow-none bg-transparent overflow-hidden">
                <CardContent className="p-0 space-y-4">
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
                    <Image
                      src={member.profile_image || "/icons/avatar/3dboy.png"}
                      alt={member.first_name || member.last_name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                      <div className="flex gap-2 mb-3">
                        {member.is_lead && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black border-none">
                            <Award className="h-3 w-3 mr-1" /> Lead
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/80 text-xs line-clamp-3 italic">
                        "{member.bio || member.quote || "Passionné par l'excellence et le partage."}"
                      </p>
                    </div>

                    {/* Quick Stats on Image */}
                    <div className="absolute top-4 right-4 space-y-2">
                      {member.years_experience && (
                        <div className="bg-black/50 backdrop-blur-md text-white rounded-full px-2 py-1 text-[10px] flex items-center gap-1 border border-white/10">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {member.years_experience} ans
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center md:text-left px-2">
                    <Typography variant="h4" weight="bold" className="group-hover:text-primary transition-colors">
                      {member.first_name || member.last_name}
                    </Typography>
                    <Typography variant="caption1" theme="muted" className="uppercase tracking-widest font-semibold text-[10px]">
                      {member.role}
                    </Typography>
                    
                    <div className="mt-3 flex flex-wrap gap-1 justify-center md:justify-start">
                      {Array.isArray(member.expertise) && member.expertise.slice(0, 2).map((exp, i) => (
                        <span key={i} className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
