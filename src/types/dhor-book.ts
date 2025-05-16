
export interface DhorBookEntry {
  id: string;
  student_id: string;
  teacher_id?: string;
  entry_date: string;
  day_of_week: string;
  dhor_1?: string | null;
  dhor_1_mistakes: number;
  dhor_2?: string | null;
  dhor_2_mistakes: number;
  sabak?: string | null;
  sabak_para?: string | null;
  points: number;
  detention: boolean;
  comments?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentDhorSummary {
  id: string;
  student_id: string;
  days_absent: number;
  total_points: number;
  total_detentions: number;
  last_updated_by: string;
  last_entry_date: string; 
  created_at: string;
}

export interface JuzRevision {
  id: string;
  student_id: string;
  juz_revised: number;
  revision_date: string;
  memorization_quality: string;
  created_at: string;
  teacher_notes?: string;
}

export interface SabaqPara {
  id: string;
  student_id: string;
  juz_number: number;
  quarters_revised: string;
  revision_date: string;
  quality_rating: string;
  created_at: string;
  teacher_notes?: string;
  sabaq_para_juz?: number;
  sabaq_para_pages?: number;
}
