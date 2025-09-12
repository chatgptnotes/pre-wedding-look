-- Create waitlist table for capturing interested users
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'blind_date_game', -- To track which feature they're interested in
    status VARCHAR(20) DEFAULT 'pending', -- pending, contacted, converted
    notes TEXT, -- For admin notes
    
    -- Add constraints
    CONSTRAINT unique_email_mobile UNIQUE(email, mobile_number)
);

-- Create index for faster lookups
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_mobile ON public.waitlist(mobile_number);
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);
CREATE INDEX idx_waitlist_status ON public.waitlist(status);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from authenticated and anonymous users
CREATE POLICY "Allow public to insert into waitlist" ON public.waitlist
    FOR INSERT 
    TO public, anon
    WITH CHECK (true);

-- Create policy to allow authenticated users to view their own entries
CREATE POLICY "Users can view their own waitlist entries" ON public.waitlist
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' = email);

-- Create policy for admins to view all entries
CREATE POLICY "Admins can view all waitlist entries" ON public.waitlist
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin', 'superadmin')
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON public.waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment on table
COMMENT ON TABLE public.waitlist IS 'Stores waitlist entries for users interested in upcoming features';