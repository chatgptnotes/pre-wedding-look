-- BASIC RLS POLICIES
-- ===================================

-- Countries: Public read access
CREATE POLICY "Countries are publicly readable" ON public.countries
  FOR SELECT USING (true);

-- Styles: Public read access
CREATE POLICY "Styles are publicly readable" ON public.styles
  FOR SELECT USING (true);

-- Country Models: Public read access
CREATE POLICY "Country models are publicly readable" ON public.country_models
  FOR SELECT USING (true);

-- User Projects: Users can manage their own projects
CREATE POLICY "Users can view own projects" ON public.user_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.user_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.user_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Generated Images: Users can manage their own images
CREATE POLICY "Users can view own images" ON public.generated_images
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own images" ON public.generated_images
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own images" ON public.generated_images
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

-- Project Images: Users can manage their own project images
CREATE POLICY "Users can view own project images" ON public.project_images
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project images" ON public.project_images
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.user_projects WHERE user_id = auth.uid()
    )
  );

-- Style Application Logs: Users can view their own logs
CREATE POLICY "Users can view own logs" ON public.style_application_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert logs" ON public.style_application_logs
  FOR INSERT WITH CHECK (true);

-- ===================================
