-- Home "We are a Growing Company" section: same four stats as the About page.
update public.pages
set content = jsonb_set(
  content,
  '{sections}',
  (
    select jsonb_agg(
      case when s->>'id' = 'growing-company' then
        jsonb_set(s, '{fields}', '[
          {"key": "h1", "label": "Section heading", "value": "We are a Growing Company"},
          {"key": "p",  "label": "Section summary", "value": "Foto Laminate Precision is a manufacturing pioneer in India."},
          {"key": "h2", "label": "Stat value one",   "value": "25+"},
          {"key": "p",  "label": "Stat label one",   "value": "Years Experience"},
          {"key": "h2", "label": "Stat value two",   "value": "5,000+"},
          {"key": "p",  "label": "Stat label two",   "value": "Machines Sold"},
          {"key": "h2", "label": "Stat value three", "value": "100+"},
          {"key": "p",  "label": "Stat label three", "value": "Corporate Print Houses"},
          {"key": "h2", "label": "Stat value four",  "value": "250+"},
          {"key": "p",  "label": "Stat label four",  "value": "Repeat Orders"}
        ]'::jsonb)
      else s end
    )
    from jsonb_array_elements(content->'sections') s
  )
), updated_at = now()
where page_id = 'home';
