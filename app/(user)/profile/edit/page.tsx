// app/profile/edit/page.tsx
"use client";

import { useState } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Typography } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  ArrowLeft,
  Upload,
  Camera
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditProfilePage() {
  const { user, userDocument, reloadUser } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: userDocument?.first_name || "",
    last_name: userDocument?.last_name || "",
    username: userDocument?.username || "",
    email: userDocument?.email || "",
    phone_number: userDocument?.phone_number || "",
    // country: userDocument?.country || "",
    bio: userDocument?.bio || "",
    profile_picture: userDocument?.profile_picture || "",
  });

  if (!user || !userDocument) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Typography variant="h3" className="mb-4">
              Accès non autorisé
            </Typography>
            <Typography variant="body-base" theme="muted" className="mb-6">
              Vous devez être connecté pour modifier votre profil
            </Typography>
            <Button asChild>
              <Link href="/auth/signin">
                Se connecter
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simuler l'upload d'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profile_picture: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simuler l'appel API pour mettre à jour le profil
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await reloadUser(); // Recharger les données utilisateur
        toast.success("Profil mis à jour avec succès");
        router.push('/profile');
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return username ? username[0].toUpperCase() : "U";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <Typography variant="h2">Modifier le profil</Typography>
          <Typography variant="body-base" theme="muted">
            Mettez à jour vos informations personnelles
          </Typography>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche - Photo de profil */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Photo de profil</CardTitle>
                <CardDescription>
                  Taille recommandée : 500x500px
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarImage 
                      src={formData.profile_picture} 
                      alt={formData.username}
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/70 text-white">
                      {getInitials(formData.first_name, formData.last_name, formData.username)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center">
                    <Typography variant="body-base" weight="medium">
                      {formData.first_name && formData.last_name 
                        ? `${formData.first_name} ${formData.last_name}`
                        : formData.username
                      }
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      @{formData.username}
                    </Typography>
                  </div>

                  <div className="w-full">
                    <Label 
                      htmlFor="profile-picture" 
                      className="cursor-pointer w-full"
                    >
                      <div className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-muted-foreground/25 rounded-lg hover:bg-muted/50 transition-colors">
                        <Camera className="h-4 w-4" />
                        <Typography variant="body-sm">
                          Changer la photo
                        </Typography>
                      </div>
                    </Label>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne de droite - Formulaire */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Ces informations seront visibles sur votre profil public
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Votre nom d'utilisateur"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Parlez-nous de vous..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informations de contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Informations de contact
                </CardTitle>
                <CardDescription>
                  Ces informations restent privées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Téléphone</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Votre pays"
                  />
                </div> */}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/profile">
                  Annuler
                </Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}