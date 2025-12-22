import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const UnauthorizedPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Non autorisé</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            401 - Non autorisé
          </h1>
          <p className="text-primary-dark mb-6">
            Vous n'avez pas les permissions pour accéder à cette page.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded hover:bg-primary-dark transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </>
  );
};

export default UnauthorizedPage;
