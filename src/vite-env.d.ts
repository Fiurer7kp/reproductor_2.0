/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY: string | undefined;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
