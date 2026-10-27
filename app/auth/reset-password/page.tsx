"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
// import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/configs/firebase/config";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  // Verify reset code
  useEffect(() => {
    if (!oobCode) {
      setError("Lien de réinitialisation invalide ou expiré");
      setVerifying(false);
      return;
    }

    const verifyCode = async () => {
      try {
        // Note: verifyPasswordResetCode and confirmPasswordReset are not in the provided utils
        // You may need to add them or handle this verification differently
        const email = await verifyPasswordResetCode(auth, oobCode);
        toast.success("Code vérifié avec succès");
        setEmail(email);
        setVerifying(false);
      } catch (err: any) {
        toast.error("Code vérification échoué");
        console.error("Code verification error:", err);
        setError("Lien de réinitialisation invalide ou expiré");
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (!oobCode) {
      setError("Lien de réinitialisation invalide");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Note: confirmPasswordReset is not in the provided utils
      // You may need to add it or handle this reset differently
      await confirmPasswordReset(auth, oobCode, formData.password);
      toast.success("Mot de passe réinitialisé avec succès");
      setSuccess(true);

      // Redirect to sign-in page after 3 seconds
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 3000);
    } catch (err: any) {
      toast.error("Réinitialisation de mot de passe échouée");
      console.error("Password reset error:", err);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      "auth/expired-action-code": "Le lien de réinitialisation a expiré",
      "auth/invalid-action-code": "Lien de réinitialisation invalide",
      "auth/user-disabled": "Ce compte a été désactivé",
      "auth/user-not-found": "Compte non trouvé",
      "auth/weak-password": "Le mot de passe est trop faible",
    };

    return (
      errorMessages[errorCode] || "Une erreur est survenue. Veuillez réessayer."
    );
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-gray-600">
            Vérification du lien de réinitialisation...
          </p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Lien invalide</h2>
          <p className="text-gray-600">{error}</p>
          <div className="pt-4">
            <Link
              href="/auth/forget-password"
              className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {success ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900">
                Mot de passe modifié !
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">
                  Redirection vers la page de connexion...
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900">
                Nouveau mot de passe
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Créez un nouveau mot de passe pour votre compte
                {email && <span className="font-medium"> {email}</span>}
              </p>
            </>
          )}
        </div>

        {!success && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }));
                    if (error) setError("");
                  }}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Au moins 6 caractères"
                  minLength={6}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }));
                    if (error) setError("");
                  }}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                  placeholder="Retapez votre mot de passe"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? "Réinitialisation..."
                  : "Réinitialiser le mot de passe"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
