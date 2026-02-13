-- ============================================================
-- SOLUCIÓN A ERROR HTTP 500 (BUCLE INFINITO DE SEGURIDAD)
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Funciones "Security Definer" para romper el ciclo
-- Permiten consultar permisos sin disparar las políticas recursivas

create or replace function public.is_project_member(_project_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from project_members
    where project_id = _project_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_project_owner(_project_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from projects 
    where id = _project_id 
    and owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 2. Actualizar Políticas de Proyectos (Projects)

drop policy if exists "Members can view projects they joined" on projects;

create policy "Members can view projects they joined" on projects
  for select using (
    is_project_member(id)
  );

-- 3. Actualizar Políticas de Miembros (Project Members)

drop policy if exists "Members can view other members" on project_members;

create policy "Members can view other members" on project_members
  for select using (
    is_project_member(project_id) 
    OR 
    is_project_owner(project_id)
  );

drop policy if exists "Owners can add members" on project_members;

create policy "Owners can add members" on project_members
  for insert with check (
    is_project_owner(project_id)
  );

drop policy if exists "Owners or user can remove members" on project_members;

create policy "Owners or user can remove members" on project_members
  for delete using (
    is_project_owner(project_id) OR auth.uid() = user_id
  );

-- Confirmación
SELECT 'RLS Fixed Successfully' as result;
