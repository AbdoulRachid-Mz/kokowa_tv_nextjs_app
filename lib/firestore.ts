import { auth, db } from "@/configs/firebase/config";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  limit,
  Query,
  query,
  serverTimestamp,
  where,
  WhereFilterOp,
  OrderByDirection,
  startAfter,
  orderBy,
  getCountFromServer,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { UserDocument } from "@/types/user";
import { getFirebaseErrorMessage } from "@/utils/getFirebaseErrorMessage";

// --- Interfaces (inchangées, car bien définies) ---
interface AuthResponse {
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

export interface QueryCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface QueryOptions {
  conditions?: QueryCondition[];
  orderBy?: {
    field: string;
    direction?: OrderByDirection;
  };
  limit?: number;
  startAfter?: DocumentSnapshot;
  includeCount?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  lastVisible?: DocumentSnapshot;
  totalCount?: number;
  hasMore: boolean;
}

// --- Helper pour gérer les erreurs Firebase ---
// Rendre la gestion des erreurs plus cohérente et réutilisable.
const handleFirebaseError = (
  error: unknown,
  method: string = "unknown"
): { code: string; message: string } => {
  if (error instanceof FirebaseError) {
    const errorCode = error.code.replace("auth/", ""); // Strip auth/ prefix if present
    return {
      code: error.code,
      message: getFirebaseErrorMessage(method, errorCode),
    };
  }

  // For non-Firebase errors, return a generic error using the error utils
  return {
    code: "unknown-error",
    message: getFirebaseErrorMessage("unknown", "unknown"),
  };
};

// Helper function to build Firestore query
const buildQuery = (
  collectionRef: CollectionReference,
  options?: QueryOptions
): Query => {
  let q: Query = collectionRef;

  if (options?.conditions && options.conditions.length > 0) {
    // Ajout vérification de longueur
    options.conditions.forEach((cond) => {
      q = query(q, where(cond.field, cond.operator, cond.value));
    });
  }

  if (options?.orderBy) {
    q = query(
      q,
      orderBy(options.orderBy.field, options.orderBy.direction || "asc")
    );
  }

  if (options?.startAfter) {
    q = query(q, startAfter(options.startAfter));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  return q;
};

// --- Fonctions Firestore ---

interface BatchUpdateItem {
  collection: string;
  id: string;
  data: any;
}

/**
 * Effectue des mises à jour par lots sur plusieurs documents
 */
export const firestoreBatchUpdate = async (
  updates: BatchUpdateItem[]
): Promise<AuthResponse> => {
  try {
    // Vérifier qu'il y a des mises à jour à effectuer
    if (!updates || updates.length === 0) {
      return {
        error: {
          code: "no-updates",
          message: "No updates provided for batch operation",
        },
      };
    }

    // Vérifier qu'on ne dépasse pas la limite de 500 opérations par batch
    if (updates.length > 500) {
      return {
        error: {
          code: "too-many-updates",
          message: "Firestore batch operations are limited to 500 updates",
        },
      };
    }

    const batch = writeBatch(db);

    updates.forEach((update) => {
      const docRef = doc(db, update.collection, update.id);
      batch.update(docRef, {
        ...update.data,
        updated_at: serverTimestamp(),
      });
    });

    await batch.commit();

    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};

export const firestoreGetDocument = async <T = DocumentData>(
  collectionName: string,
  documentID: string,
  options?: {
    conditions?: QueryCondition[];
  }
): Promise<{ data?: T; error?: { code: string; message: string } }> => {
  try {
    // Vérification des paramètres
    if (!collectionName || !documentID) {
      return {
        error: {
          code: "invalid-argument",
          message: "Collection name and document ID are required",
        },
      };
    }

    const docRef = doc(db, collectionName, documentID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { error: { code: "not-found", message: "Document not found" } };
    }

    const data = { id: docSnap.id, ...docSnap.data() } as T;

    // Vérification des conditions côté client
    if (options?.conditions?.length) {
      const meetsConditions = options.conditions.every((cond) => {
        const fieldValue = (data as any)[cond.field];
        if (fieldValue === undefined) return false;

        switch (cond.operator) {
          case "==":
            return fieldValue === cond.value;
          case "!=":
            return fieldValue !== cond.value;
          case ">":
            return typeof fieldValue === "number" && fieldValue > cond.value;
          case "<":
            return typeof fieldValue === "number" && fieldValue < cond.value;
          case ">=":
            return typeof fieldValue === "number" && fieldValue >= cond.value;
          case "<=":
            return typeof fieldValue === "number" && fieldValue <= cond.value;
          case "array-contains":
            return Array.isArray(fieldValue) && fieldValue.includes(cond.value);
          case "in":
            return Array.isArray(cond.value) && cond.value.includes(fieldValue);
          case "array-contains-any":
            return (
              Array.isArray(fieldValue) &&
              Array.isArray(cond.value) &&
              cond.value.some((val) => fieldValue.includes(val))
            );
          default:
            return true;
        }
      });

      if (!meetsConditions) {
        return {
          error: {
            code: "conditions-not-met",
            message: "Document does not meet conditions",
          },
        };
      }
    }

    return { data };
  } catch (error) {
    console.error("Firestore getDocument error:", error);
    return { error: handleFirebaseError(error) };
  }
};

export const firestoreGetDocuments = async <T = DocumentData>(
  collectionName: string,
  options?: QueryOptions
): Promise<
  PaginatedResponse<T> & { error?: { code: string; message: string } }
> => {
  try {
    // Vérification des paramètres
    if (!collectionName) {
      return {
        data: [],
        hasMore: false,
        error: {
          code: "invalid-argument",
          message: "Collection name is required",
        },
      };
    }

    const collectionRef = collection(db, collectionName);
    let q = query(collectionRef);

    // Appliquer les conditions
    if (options?.conditions?.length) {
      options.conditions.forEach((cond) => {
        q = query(q, where(cond.field, cond.operator, cond.value));
      });
    }

    // Appliquer le tri
    if (options?.orderBy) {
      q = query(
        q,
        orderBy(options.orderBy.field, options.orderBy.direction || "asc")
      );
    }

    // Appliquer la pagination
    if (options?.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }

    // Appliquer la limite
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as T)
    );
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    // Compter le total si demandé
    let totalCount: number | undefined;
    if (options?.includeCount) {
      const countQuery = options.conditions?.length
        ? query(
            collectionRef,
            ...options.conditions.map((c) =>
              where(c.field, c.operator, c.value)
            )
          )
        : collectionRef;
      const countSnapshot = await getCountFromServer(countQuery);
      totalCount = countSnapshot.data().count;
    }

    return {
      data,
      lastVisible,
      totalCount,
      hasMore: options?.limit ? data.length === options.limit : false,
    };
  } catch (error) {
    console.error("Firestore getDocuments error:", error);
    return {
      data: [],
      hasMore: false,
      error: handleFirebaseError(error),
    };
  }
};

export const firestoreSubscribeToDocument = <T = DocumentData>(
  collectionName: string,
  documentID: string,
  callback: (data: T | null, error?: { code: string; message: string }) => void,
  options?: {
    conditions?: QueryCondition[];
  }
) => {
  const docRef = doc(db, collectionName, documentID);

  // onSnapshot renvoie une fonction de désabonnement, pas besoin d'un try/catch direct ici
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as T; // Inclure l'ID du document

      // Application des conditions côté client
      if (options?.conditions && options.conditions.length > 0) {
        const meetsConditions = options.conditions.every((cond) => {
          const fieldValue = (data as any)[cond.field]; // Utiliser 'any' pour l'accès dynamique
          switch (cond.operator) {
            case "==":
              return fieldValue === cond.value;
            case "!=":
              return fieldValue !== cond.value;
            case ">":
              return fieldValue > cond.value;
            case "<":
              return fieldValue < cond.value;
            case ">=":
              return fieldValue >= cond.value;
            case "<=":
              return fieldValue <= cond.value;
            case "array-contains":
              return (
                Array.isArray(fieldValue) && fieldValue.includes(cond.value)
              );
            case "in":
              return (
                Array.isArray(cond.value) && cond.value.includes(fieldValue)
              );
            case "array-contains-any":
              return (
                Array.isArray(fieldValue) &&
                Array.isArray(cond.value) &&
                cond.value.some((val) => fieldValue.includes(val))
              );
            default:
              return true;
          }
        });

        if (!meetsConditions) {
          callback(null, {
            code: "conditions-not-met",
            message: "Document does not meet conditions",
          });
          return;
        }
      }

      callback(data);
    },
    (error) => {
      // Gérer les erreurs directement dans le callback d'erreur de onSnapshot
      callback(null, handleFirebaseError(error));
    }
  );

  return unsubscribe; // Retourner la fonction de désabonnement
};

export const firestoreSubscribeToCollection = <T = DocumentData>(
  collectionName: string,
  callback: (data: T[], error?: { code: string; message: string }) => void,
  options?: QueryOptions
) => {
  const collectionRef = collection(db, collectionName);
  const q = buildQuery(collectionRef, options);

  // onSnapshot renvoie une fonction de désabonnement
  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const data = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as T)
      );
      callback(data);
    },
    (error) => {
      // Gérer les erreurs directement dans le callback d'erreur de onSnapshot
      callback([], handleFirebaseError(error));
    }
  );

  return unsubscribe; // Retourner la fonction de désabonnement
};

export const firestoreCreateDocument = async <T = DocumentData>(
  collectionName: string,
  data: T,
  documentID?: string
): Promise<AuthResponse> => {
  try {
    const documentRef = documentID
      ? doc(db, collectionName, documentID)
      : doc(collection(db, collectionName));

    await setDoc(documentRef, {
      ...data,
      id: documentRef.id, // S'assurer que l'ID est toujours inclus dans les données
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return {
      data: {
        id: documentRef.id,
        ...data,
      },
    };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};

export const firestoreUpdateDocument = async <T = DocumentData>(
  collectionName: string,
  documentID: string,
  data: Partial<T>
): Promise<AuthResponse> => {
  try {
    const documentRef = doc(db, collectionName, documentID);
    // Destructurer 'id' si elle est passée pour éviter de l'écrire dans le doc
    const { id, ...updateData } = data as any; // Cast en any pour la destructuring dynamique

    await updateDoc(documentRef, {
      ...updateData,
      updated_at: serverTimestamp(),
    });

    return {
      data: {
        id: documentID,
        ...data, // Retourner les données originales plus l'ID pour la cohérence
      },
    };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};

export const firestoreDeleteDocument = async (
  collectionName: string,
  documentID: string
): Promise<AuthResponse> => {
  try {
    const documentRef = doc(db, collectionName, documentID);
    await deleteDoc(documentRef);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};

export const firestoreSearch = async <T = DocumentData>({
  collection: collectionName,
  searchFields,
  searchTerm,
  limit: limitCount = 10,
  conditions,
}: {
  collection: string;
  searchFields: string[];
  searchTerm: string;
  limit?: number;
  conditions?: QueryCondition[];
}): Promise<{ data: T[]; error?: { code: string; message: string } }> => {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return { data: [] };
    }

    const collectionRef = collection(db, collectionName);
    // Utiliser Promise.allSettled pour gérer les promesses individuelles plus robustement
    const snapshots = await Promise.allSettled(
      searchFields.map((field) => {
        let q: Query = collectionRef;

        q = query(
          q,
          where(field, ">=", searchTerm),
          where(field, "<=", searchTerm + "\uf8ff")
        );

        if (conditions && conditions.length > 0) {
          conditions.forEach((cond) => {
            q = query(q, where(cond.field, cond.operator, cond.value));
          });
        }

        q = query(q, limit(limitCount));

        return getDocs(q);
      })
    );

    const results = snapshots
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled"
      ) // Filtrer les promesses réussies
      .flatMap((result) =>
        result.value.docs.map(
          (doc: DocumentSnapshot) => ({ id: doc.id, ...doc.data() } as T)
        )
      )
      .filter(
        (item, index, self) =>
          index === self.findIndex((t) => (t as any).id === (item as any).id)
      )
      .slice(0, limitCount);

    return { data: results };
  } catch (error) {
    return { data: [], error: handleFirebaseError(error) };
  }
};

// --- Authentication methods (Gérer les erreurs avec le helper) ---
export const firebaseSignUpWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { data: userCredential.user };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};

export const firebaseSignInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { data: userCredential.user };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};

export const firebaseSendPasswordResetEmail = async (
  email: string
): Promise<AuthResponse> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};

export const firebaseSignInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    if (!result.user) {
      throw new Error("No user returned from Google sign in");
    }

    return { data: result.user };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};

export const firebaseSignOut = async (): Promise<AuthResponse> => {
  try {
    await signOut(auth);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error) };
  }
};
