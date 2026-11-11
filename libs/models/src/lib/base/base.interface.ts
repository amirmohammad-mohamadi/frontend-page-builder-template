/** The fields every persisted record carries. Ids may be numeric or string (UUID) depending on the backend. */
export type IBaseModel = {
  id: number | string;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};
