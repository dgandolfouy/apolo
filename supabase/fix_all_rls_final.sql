-- =================================================================
-- 🚨 SOLUCIÓN FINAL GLOBAL (NUCLEAR FIX v2) 🚨
-- CORREGIDO: Incluye borrado de políticas duplicadas
-- =================================================================

-- 1. FUNCIONES SEGURAS (Evitan recursión infinita)
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

-- 2. LIMPIEZA TOTAL DE POLÍTICAS (Borrar TODO lo viejo y lo nuevo para evitar conflictos)
-- Projects
drop policy if exists "Users can CRUD own projects" on projects;
drop policy if exists "Members can view shared projects" on projects;
drop policy if exists "Members can view projects they joined" on projects;
drop policy if exists "Users can view own projects" on projects;
drop policy if exists "Users can create projects" on projects;
drop policy if exists "Users can update own projects" on projects;
drop policy if exists "Users can delete own projects" on projects;

-- Tasks
drop policy if exists "Users can CRUD tasks in their own projects" on tasks;
drop policy if exists "Members can CRUD tasks" on tasks;

-- Members
drop policy if exists "Users can view project members" on project_members;
drop policy if exists "Users can join projects" on project_members;
drop policy if exists "Members can view members" on project_members;


-- 3. APLICAR POLÍTICAS SEGURAS (PROJECTS)
create policy "Users can CRUD own projects" on projects
  for all using (owner_id = auth.uid());

create policy "Members can view shared projects" on projects
  for select using (is_project_member(id));

-- 4. APLICAR POLÍTICAS SEGURAS (TASKS)
create policy "Users can CRUD tasks in their own projects" on tasks
  for all using (is_project_owner(project_id));

create policy "Members can CRUD tasks" on tasks
  for all using (is_project_member(project_id));

-- 5. APLICAR POLÍTICAS SEGURAS (MEMBERS)
create policy "Users can view project members" on project_members
  for select using (
    auth.uid() = user_id 
    OR is_project_owner(project_id) 
    OR exists (select 1 from projects where id = project_members.project_id and is_project_member(id))
  );

create policy "Users can join projects" on project_members
  for insert with check (auth.uid() = user_id);

-- 6. CONFIRMACIÓN
SELECT '✅ FIX v2 COMPLETADO EXITOSAMENTE' as status;
