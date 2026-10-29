export interface Post {
  id: string;
  title_ro: string;
  title_hu: string;
  content_ro: string;
  content_hu: string;
  institution: string;
  cover_image: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  resolved: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  picture: string | null;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  original_filename: string;
  institution: string;
  created_at: string;
}

export interface Institution {
  slug: string;
  description_ro: string;
  description_hu: string;
  address: string;
  phone: string;
  email: string;
  images: string[];
}

export interface OfficialDocument {
  id: string;
  title_ro: string;
  title_hu: string;
  original_filename: string;
  size: number;
  url: string;
  created_at: string;
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
