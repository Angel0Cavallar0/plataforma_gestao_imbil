export type MetaPublishResult = {
  id: string;
  permalink_url?: string;
};

export type MetaCredentials = {
  app_id: string;
  facebook_page_id: string;
  instagram_user_id: string;
  app_secret_ref?: string;
  system_user_token_ref?: string;
};

export type PostForPublish = {
  id: string;
  content_type: string;
  copy: string | null;
  hashtags: string[] | null;
  cta_url: string | null;
  credential_id: string | null;
  platform: { slug: string };
  assets: Array<{
    asset_type: string;
    storage_path: string;
    mime_type: string | null;
    public_url: string | null;
  }>;
  credentials: MetaCredentials;
};
