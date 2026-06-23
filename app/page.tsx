import HomePage from "@/components/pages/home/home-page";
import { Metadata } from "next";

export const revalidate = 180;
const appLogo = "https://kokowa.tv/logo.png";
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// cache page
export const metadata: Metadata = {
  title: "Kokowa TV - Accueil",
  description:
    "Découvrez et profitez du meilleur contenu télévisuel avec Kokowa TV, votre plateforme de lutte traditionnelle Nigerienne préférée.",
  keywords: [
    "streaming",
    "lutte",
    "combat",
    "sport",
    "Nigerienne",
    "culture",
    "films",
    "Kokowa TV",
  ],
  authors: [
    { name: "Abdoul Rachid AWAL", url: "https://abdoulrachid.com/" },
    { name: "HAROUNA IDISSA Salifou", url: "https://harounaidissaalifou.com/" },
  ],
  creator: "Abdoul Rachid AWAL",
  publisher: "Kokowa TV",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: appUrl,
    siteName: "Kokowa TV",
    title: "Kokowa TV - Accueil",
    description:
      "Découvrez et profitez du meilleur contenu télévisuel avec Kokowa TV, votre plateforme de lutte traditionnelle Nigerienne préférée.",
    images: [
      {
        url: appLogo,
        width: 1200,
        height: 630,
        alt: "Kokowa TV - Plateforme de lutte traditionnelle Nigerienne",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kokowa TV - Accueil",
    description:
      "Découvrez et profitez du meilleur contenu télévisuel avec Kokowa TV, votre plateforme de lutte traditionnelle Nigerienne préférée.",
    images: [appLogo],
  },
};

export default function Home() {
  return <HomePage />;
}
