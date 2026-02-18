-- Seed Data for Criteria (Reference Qualiopi simplified)
insert into public.criteria (id, label, description) values
(1, 'Information', 'Conditions d’information du public'),
(2, 'Objectifs', 'Identification précise des objectifs des prestations'),
(3, 'Adaptation', 'Adaptation aux publics bénéficiaires'),
(4, 'Moyens', 'Adéquation des moyens pédagogiques'),
(5, 'Qualification', 'Qualification et développement des connaissances'),
(6, 'Environnement', 'Inscription et investissement du prestataire'),
(7, 'Amélioration', 'Recueil et prise en compte des appréciations')
on conflict (id) do nothing;

-- Seed Data for Indicators (Simplified I1 to I32)
-- This ensures indicators exist for the criteria
do $$
declare
  i integer;
  c_id integer;
  exists_count integer;
begin
  -- Check if indicators table is empty or has very few entries before seeding
  select count(*) into exists_count from public.indicators;
  
  if exists_count < 32 then
      for i in 1..32 loop
        -- Mapping logic same as schema.sql
        if i <= 3 then c_id := 1;
        elsif i <= 8 then c_id := 2;
        elsif i <= 16 then c_id := 3;
        elsif i <= 20 then c_id := 4;
        elsif i <= 22 then c_id := 5;
        elsif i <= 29 then c_id := 6;
        else c_id := 7;
        end if;
        
        insert into public.indicators (id, criterion_id, code, label)
        values (i, c_id, 'I' || i, 'Indicateur ' || i)
        on conflict (id) do nothing;
      end loop;
  end if;
end $$;
