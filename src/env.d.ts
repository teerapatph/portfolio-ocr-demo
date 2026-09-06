interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL: string;
  readonly PUBLIC_AWS_REGION: string;
  readonly PUBLIC_AWS_ACCESS_KEY_ID: string;
  readonly PUBLIC_AWS_SECRET_ACCESS_KEY: string;
  readonly PUBLIC_S3_BUCKET_NAME: string;
}


interface ImportMeta {
  readonly env: ImportMetaEnv;
}
