/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL — leave empty to use Vite proxy in dev mode */
  readonly VITE_API_BASE_URL: string;
  /** Optional custom basemap tile URL */
  readonly VITE_BASEMAP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
