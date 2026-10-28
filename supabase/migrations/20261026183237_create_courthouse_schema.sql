
-- Courthouse Locator: initial database schema

-- Courthouse locations
CREATE TABLE public.courthouse_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    name text NOT NULL
        CHECK (length(trim(name)) > 0),

    address text NOT NULL
        CHECK (length(trim(address)) > 0),

    latitude double precision,
    longitude double precision,

    active boolean NOT NULL DEFAULT true,

    geocoded_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT courthouse_coordinates_valid CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR
    (
        latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude BETWEEN -90 AND 90
        AND longitude BETWEEN -180 AND 180
    )
)
);

-- Administrator roles
CREATE TABLE public.user_roles (
    user_id uuid PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,

    role text NOT NULL DEFAULT 'admin'
        CHECK (role IN ('admin')),

    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common lookups
CREATE INDEX courthouse_locations_active_idx
    ON public.courthouse_locations (active);

CREATE INDEX courthouse_locations_name_idx
    ON public.courthouse_locations (name);

-- Automatically maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER courthouse_locations_updated_at
BEFORE UPDATE ON public.courthouse_locations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Admin-check function
-- SECURITY DEFINER allows the function to check roles without
-- triggering recursive RLS evaluation on user_roles.
CREATE OR REPLACE FUNCTION public.is_courthouse_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles AS ur
        WHERE ur.user_id = (SELECT auth.uid())
          AND ur.role = 'admin'
    );
$$;

-- Explicit API permissions
-- Public visitors will use a controlled server endpoint for lookups.
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.courthouse_locations TO authenticated;

GRANT SELECT ON public.user_roles TO authenticated;

GRANT ALL PRIVILEGES
    ON public.courthouse_locations, public.user_roles
    TO service_role;

REVOKE ALL ON public.courthouse_locations FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

REVOKE ALL ON FUNCTION public.is_courthouse_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_courthouse_admin()
    TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.courthouse_locations
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles
    ENABLE ROW LEVEL SECURITY;

-- Only administrators can access or modify courthouse rows
CREATE POLICY "Admins can view courthouses"
ON public.courthouse_locations
FOR SELECT
TO authenticated
USING ((SELECT public.is_courthouse_admin()));

CREATE POLICY "Admins can insert courthouses"
ON public.courthouse_locations
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_courthouse_admin()));

CREATE POLICY "Admins can update courthouses"
ON public.courthouse_locations
FOR UPDATE
TO authenticated
USING ((SELECT public.is_courthouse_admin()))
WITH CHECK ((SELECT public.is_courthouse_admin()));

CREATE POLICY "Admins can delete courthouses"
ON public.courthouse_locations
FOR DELETE
TO authenticated
USING ((SELECT public.is_courthouse_admin()));

-- Users can read their own role; admins can read all roles
CREATE POLICY "Users can view permitted roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_courthouse_admin())
);
