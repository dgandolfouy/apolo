-- ============================================================
-- SOLUCIÓN FINAL: OPTIMIZACIÓN DE TAREAS (TASKS)
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- Reemplazamos las políticas complejas de Tareas por las funciones seguras
-- Esto evita que 'tasks' dispare lecturas recursivas en 'projects' o 'members'

-- 1. Política para Dueños (Owner)
drop policy if exists "Users can CRUD tasks in their own projects" on tasks;

create policy "Users can CRUD tasks in their own projects" on tasks
  for all using (
    is_project_owner(project_id)
  );

-- 2. Política para Colaboradores (Members)
drop policy if exists "Members can CRUD tasks" on tasks;

create policy "Members can CRUD tasks" on tasks
  for all using (
    is_project_member(project_id)
  );

-- 3. Confirmación
SELECT 'Tasks Policies Fixed' as result;
