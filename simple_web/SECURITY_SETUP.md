# Secure Your CWL Roster Manager

## Step 1: Enable Email Authentication in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project (`ovaqlplyxpiffnbjlejf`)
3. Navigate to **Authentication** > **Providers**
4. Ensure **Email** is enabled (it should be by default)

## Step 2: Create Admin User

Run this in your Supabase **SQL Editor**:

```sql
-- This will create the admin user
-- Email: fear@cwl.com
-- Password: 12345678987654321

-- Note: Supabase doesn't allow creating users via SQL directly for security reasons.
-- You need to use the Supabase Dashboard or API.

-- INSTEAD: Go to Authentication > Users > Add User
-- Email: fear@cwl.com
-- Password: 12345678987654321
-- Auto Confirm User: YES
```

**OR** you can sign up through the website:
1. Temporarily modify `login.html` to add a "Sign Up" button (or just use Supabase Dashboard as shown above)

## Step 3: Update RLS Policies (Secure the Database)

Run this SQL to lock down your database so only authenticated users can modify data:

```sql
-- Update signups table policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.signups;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.signups;

-- Allow everyone to read
CREATE POLICY "Public read access" ON public.signups
    FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated insert" ON public.signups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update" ON public.signups
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete" ON public.signups
    FOR DELETE USING (auth.role() = 'authenticated');

-- Update clans table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clans;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.clans;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.clans;

-- Allow everyone to read
CREATE POLICY "Public read access" ON public.clans
    FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated insert" ON public.clans
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update" ON public.clans
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete" ON public.clans
    FOR DELETE USING (auth.role() = 'authenticated');
```

## Step 4: Test

1. Visit your website (refresh the page)
2. You should see a "Login" button
3. Click it and sign in with:
   - Email: `fear@cwl.com`
   - Password: `12345678987654321`
4. After login, you should see "Add Clan", "Delete", and "Assign" buttons
5. Click "Logout" to return to visitor mode

## Security Notes

- **Visitors** can now only VIEW the rosters
- **Only logged-in admins** can create clans, assign players, or delete clans
- The Discord bot will still be able to insert signups (it uses the service role key in the backend)
