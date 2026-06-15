// app/privacy/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Database, 
  Eye, 
  Share2, 
  Lock, 
  UserCheck, 
  Cookie, 
  FileText, 
  Mail, 
  CalendarDays,
  Fingerprint,
  Building2,
  Trash2
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      icon: Shield,
      title: "1. Introduction",
      content: "Bienvenue sur Kokowa TV. Nous nous engageons à protéger la vie privée de nos utilisateurs. Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos données personnelles."
    },
    {
      icon: Database,
      title: "2. Données que nous collectons",
      content: "Nous collectons les informations nécessaires au fonctionnement de nos services :",
      list: [
        "Informations de compte : nom, prénom, e-mail, mot de passe, numéro de téléphone",
        "Informations de profil : photo de profil, biographie",
        "Données d'utilisation : pages consultées, interactions avec l'application",
        "Informations techniques : adresse IP, type de navigateur, système d'exploitation"
      ]
    },
    {
      icon: Eye,
      title: "3. Comment nous utilisons vos données",
      content: "Vos données nous permettent de vous offrir une expérience personnalisée et sécurisée :",
      list: [
        "Fournir et améliorer nos services",
        "Communiquer avec vous concernant votre compte",
        "Personnaliser votre expérience utilisateur",
        "Assurer la sécurité de nos services",
        "Analyser et optimiser nos performances"
      ]
    },
    {
      icon: Share2,
      title: "4. Partage des données",
      content: "Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées dans les cas suivants :",
      list: [
        "Avec nos partenaires techniques (hébergement, paiements, notifications)",
        "Avec les autorités légales si requis par la loi",
        "Pour la protection de nos droits et la sécurité des utilisateurs"
      ]
    },
    {
      icon: Lock,
      title: "5. Sécurité",
      content: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction. Cela inclut le chiffrement des données sensibles et une surveillance continue de nos systèmes."
    },
    {
      icon: UserCheck,
      title: "6. Vos droits (RGPD)",
      content: "Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :",
      list: [
        "Droit d'accès : consulter vos données personnelles",
        "Droit de rectification : corriger vos données inexactes",
        "Droit à l'effacement : demander la suppression de vos données",
        "Droit à la limitation : restreindre le traitement de vos données",
        "Droit à la portabilité : récupérer vos données dans un format standard",
        "Droit d'opposition : vous opposer au traitement de vos données"
      ]
    },
    {
      icon: Cookie,
      title: "7. Cookies",
      content: "Nous utilisons des cookies pour améliorer votre expérience utilisateur. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur. Les cookies essentiels sont nécessaires au fonctionnement du site."
    },
    {
      icon: FileText,
      title: "8. Modifications de la politique",
      content: "Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page avec la date de mise à jour. Nous vous encourageons à consulter régulièrement cette page."
    },
    {
      icon: Mail,
      title: "9. Contact et DPO",
      content: "Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits RGPD, vous pouvez nous contacter :",
      list: [
        "Email : privacy@kokowa.tv",
        "Adresse : Kokowa TV, [votre adresse]",
        "Délégué à la Protection des Données : dpo@kokowa.tv"
      ]
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
                  <Fingerprint className="h-8 w-8 text-primary" />
                </div>
              </div>
              <Typography 
                variant="h1" 
                weight="bold"  
                className="mb-4"
              >
                Politique de Confidentialité
              </Typography>
              <Typography variant="body-lg" theme="muted" className="max-w-2xl mx-auto">
                Comment nous protégeons et utilisons vos données personnelles
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

              {/* RGPD Badge */}
              <div className="pt-4">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Typography variant="body-sm" weight="semibold" className="text-green-800 dark:text-green-300">
                        Conformité RGPD
                      </Typography>
                      <Typography variant="caption2" className="text-green-700 dark:text-green-400">
                        Kokowa TV est pleinement conforme au Règlement Général sur la Protection des Données (UE) 2016/679.
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

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