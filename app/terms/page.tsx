// app/terms/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, Users, Copyright, AlertTriangle, Scale, Mail, CalendarDays } from "lucide-react";

export default function TermsOfServicePage() {
  const sections = [
    {
      icon: Shield,
      title: "1. Acceptation des conditions",
      content: "En accédant et en utilisant Kokowa TV, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services."
    },
    {
      icon: FileText,
      title: "2. Description du service",
      content: "Kokowa TV est une plateforme de diffusion et de gestion de compétitions de lutte. Nous fournissons des services pour les organisateurs, les arbitres, les lutteurs et les spectateurs."
    },
    {
      icon: Users,
      title: "3. Comptes utilisateurs",
      content: "Vous êtes responsable de la sécurité de votre compte. Vous ne pouvez pas partager vos identifiants de connexion. Nous nous réservons le droit de suspendre ou de supprimer des comptes en cas de violation de ces conditions.",
      list: [
        "Sécurité du compte : vous êtes responsable de vos identifiants",
        "Partage : interdiction de partager vos accès",
        "Sanctions : suspension ou suppression possible en cas de violation"
      ]
    },
    {
      icon: Copyright,
      title: "4. Contenu utilisateur",
      content: "En soumettant du contenu sur Kokowa TV, vous déclarez que vous avez les droits nécessaires pour publier ce contenu, qu'il ne viole pas les droits d'auteur et qu'il ne contient pas de matériel illégal, diffamatoire ou injurieux."
    },
    {
      icon: Copyright,
      title: "5. Propriété intellectuelle",
      content: "Tout le contenu publié sur Kokowa TV, y compris les textes, images, vidéos et logos, est protégé par les droits d'auteur et autres lois sur la propriété intellectuelle. Vous ne pouvez pas reproduire, distribuer ou modifier ce contenu sans notre autorisation écrite."
    },
    {
      icon: AlertTriangle,
      title: "6. Limitation de responsabilité",
      content: "Kokowa TV est fourni 'tel quel' et 'selon la disponibilité'. Nous ne garantissons pas que le service sera ininterrompu ou exempt d'erreurs. Dans toute la mesure permise par la loi, nous déclinons toute responsabilité pour tout dommage indirect, incident, spécial ou consécutif."
    },
    {
      icon: FileText,
      title: "7. Modifications des conditions",
      content: "Nous nous réservons le droit de modifier ces conditions d'utilisation à tout moment. Les modifications seront publiées sur cette page et entreront en vigueur immédiatement après leur publication."
    },
    {
      icon: AlertTriangle,
      title: "8. Résiliation",
      content: "Vous pouvez résilier votre compte à tout moment. Nous nous réservons le droit de résilier votre compte immédiatement, sans préavis, si vous violez ces conditions."
    },
    {
      icon: Scale,
      title: "9. Droit applicable",
      content: "Ces conditions d'utilisation sont régies par le droit français. Tout litige relatif à ces conditions sera soumis à la compétence exclusive des tribunaux de Niger."
    },
    {
      icon: Mail,
      title: "10. Contact",
      content: "Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter à : legal@kokowa.tv"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-6 px-2 sm:px-4 lg:px-6">
      <div className="container mx-auto">
        {/* Hero Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent mb-8 overflow-hidden">
          <CardContent className="p-8 text-center relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <Typography 
                variant="h1" 
                weight="bold"  
                className="mb-4"
              >
                Conditions d'Utilisation
              </Typography>
              <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
                En utilisant Kokowa TV, vous acceptez nos conditions générales d'utilisation
              </Typography>
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <Typography variant="caption1">Dernière mise à jour : 15 Juin 2026</Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <Card className="border shadow-lg overflow-x-hidden">
          <ScrollArea className="">
            <CardContent className="p-8 space-y-8">
              {sections.map((section, index) => (
                <div key={index}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <Typography variant="h4" weight="semibold">
                        {section.title}
                      </Typography>
                      <Typography variant="body-base" theme="muted" className="leading-relaxed">
                        {section.content}
                      </Typography>
                      
                      {section.list && (
                        <ul className="space-y-2 pl-6">
                          {section.list.map((item, idx) => (
                            <li key={idx}>
                              <Typography variant="body-sm" theme="muted" className="flex items-start gap-2">
                                <span className="text-primary text-lg leading-5">•</span>
                                {item}
                              </Typography>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  {index < sections.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}

              {/* Footer */}
              <div className="pt-6 text-center border-t border-border">
                <Typography variant="caption2" theme="muted">
                  © 2026 Kokowa TV. Tous droits réservés.
                </Typography>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}