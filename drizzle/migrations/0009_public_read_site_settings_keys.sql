-- Public pages need to read the destination chips and tour document settings.
DROP POLICY "public read site settings" ON public.admin_settings;
CREATE POLICY "public read site settings" ON public.admin_settings
  FOR SELECT TO anon, authenticated
  USING (key = ANY (ARRAY['site_name'::text, 'site_email'::text, 'site_phone'::text, 'site_address'::text, 'hero_images'::text, 'destination_chips'::text, 'educational_tour_doc'::text, 'corporate_tour_doc'::text]));