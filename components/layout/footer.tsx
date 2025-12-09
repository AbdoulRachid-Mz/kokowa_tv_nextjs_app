// components/layout/footer.tsx
"use client";

import Link from "next/link";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  Heart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppSettingsHook } from "@/hooks/use-app-settings";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { 
    appName, 
    appDescription, 
    contactEmail,
    socialLinks 
  } = useAppSettingsHook();

  const quickLinks = [
    { label: "Accueil", href: "/" },
    { label: "Compétitions", href: "/competitions" },
    { label: "Lutteurs", href: "/fighters" },
    { label: "Régions", href: "/regions" },
    { label: "Matchs", href: "/matches" },
    { label: "Médias", href: "/media" },
  ];

  const infoLinks = [
    { label: "À propos", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Aide", href: "/help" },
    { label: "Confidentialité", href: "/privacy" },
    { label: "Conditions", href: "/terms" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  const contactInfo = [
    { icon: Mail, text: "contact@lutte-traditionnelle.com" },
    { icon: Phone, text: "+227 XX XX XX XX" },
    { icon: MapPin, text: "Niamey, Niger" },
  ];

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et description */}
<div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <Typography variant="h4" weight="bold" className="text-primary-foreground">
                  {appName.charAt(0)}
                </Typography>
              </div>
              <Typography variant="h4" weight="bold">
                {appName}
              </Typography>
            </div>
            <Typography variant="body-sm" theme="muted">
              {appDescription}
            </Typography>

          {/* Liens rapides */}
          <div>
            <Typography variant="h5" className="mb-4">
              Liens rapides
            </Typography>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <Link href={link.href}>
                      <Typography variant="body-sm">{link.label}</Typography>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <Typography variant="h5" className="mb-4">
              Informations
            </Typography>
            <ul className="space-y-2">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <Link href={link.href}>
                      <Typography variant="body-sm">{link.label}</Typography>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter et contact */}
          <div className="space-y-6">
            <div>
              <Typography variant="h5" className="mb-4">
                Newsletter
              </Typography>
              <Typography variant="body-sm" theme="muted" className="mb-3">
                Restez informé des dernières actualités et compétitions.
              </Typography>
              <form className="space-y-2">
                <Input 
                  type="email" 
                  placeholder="Votre email" 
                  className="bg-background"
                />
                <Button type="submit" className="w-full">
                  S'abonner
                </Button>
              </form>
            </div>

            {/* Contact info */}
            <div>
              <Typography variant="h5" className="mb-4">
                Contact
              </Typography>
              <div className="space-y-3">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <info.icon className="h-4 w-4 text-muted-foreground" />
                    <Typography variant="body-sm">{info.text}</Typography>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <Typography variant="body-sm" theme="muted">
            © {currentYear} Lutte Traditionnelle. Tous droits réservés.
          </Typography>
          <div className="flex items-center gap-2">
            <Typography variant="body-sm" theme="muted">
              Fait avec
            </Typography>
            <Heart className="h-4 w-4 text-destructive fill-destructive" />
            <Typography variant="body-sm" theme="muted">
              pour la lutte traditionnelle
            </Typography>
          </div>
        </div>
      </div>
    </footer>
  );
}