export type Lutteur = {
  id: number;
  nom: string;
  surnom?: string;
  date_naissance?: Date;
  region_id?: number;
  poids?: number;
  actif: boolean;
  photo_url?: string;
  created_at?: Date;
  region_name?: string;
  region_code?: string;
};

export type Competition = {
  id: number;
  title: string;
  description?: string;
  lieu: string;
  date: Date;
  created_at?: Date;
};

export type Region = {
  id: number;
  name: string;
  code?: string;
  created_at?: Date;
};

export type Phase = {
  id: number;
  competition_id: number;
  name: string;
  position: number;
  competition_title?: string;
};

export type Match = {
  id: number;
  phase_id: number;
  lutteur_a: number;
  lutteur_b: number;
  score_a?: number;
  score_b?: number;
  statut?: 'SCHEDULED' | 'FINISHED' | 'CANCELLED';
  scheduled_at?: Date;
};

export type Transfert = {
  id: number;
  lutteur_id: number;
  from_region: number;
  to_region: number;
  date_transfert: Date;
  notes?: string;
  created_at?: Date;
};

export type Palmares = {
  id: number;
  lutteur_id: number;
  competition_id: number;
  year: number;
  position: string;
};