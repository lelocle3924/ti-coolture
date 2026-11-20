-- Migration 00024: Create site_settings table for system configurations (Approval Mode, etc.)

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings" ON public.site_settings FOR SELECT USING (true);

-- Allow service_role full management
DROP POLICY IF EXISTS "Allow service_role all site_settings" ON public.site_settings;
CREATE POLICY "Allow service_role all site_settings" ON public.site_settings USING (true) WITH CHECK (true);

-- Insert default require_approval setting (enabled: true)
INSERT INTO public.site_settings (key, value)
VALUES ('require_approval', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
