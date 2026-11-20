-- Product ID (owner code) + Size for the category table. Run once on the live DB before deploying.
alter table public.products add column if not exists product_code text;
alter table public.products add column if not exists size text;
create unique index if not exists products_product_code_key on public.products (upper(product_code)) where product_code is not null;

-- Seed the Cutting Machine range from the owner's reference table (codes CM-01…CM-14, sizes as given).
update public.products set product_code = v.code, size = v.size
from (values
  ('cutting-machine-3mm-mdf-cutter',               'CM-01', '3 mm'),
  ('cutting-machine-45-pvc-beeding-cutter',        'CM-02', '45°'),
  ('cutting-machine-45-aluminium-cutter',          'CM-03', '45°'),
  ('12-inch-roll-to-sheet-cutter',                 'CM-04', '12 inch'),
  ('cutting-machine-mdf-board-cutter',             'CM-05', '2 ft x 4 ft'),
  ('cutting-machine-mdf-board-and-frame-cutter',   'CM-06', '2 ft x 4 ft, 45°'),
  ('cutting-machine-20-inch-album-cutter-with-stand','CM-07', '20 inch'),
  ('cutting-machine-round-corner-cutter-manual',   'CM-08', '8, 10 & 12 mm'),
  ('cutting-machine-round-corner-cutter-auto',     'CM-09', '8, 10 & 12 mm'),
  ('cutting-machine-corner-cutter-auto',           'CM-10', '8, 10 & 12 mm'),
  ('cutting-machine-id-card-dye-cutter',           'CM-11', '85 x 55 mm'),
  ('cutting-machine-a4-size-paper-cutter',         'CM-12', 'A4'),
  ('cutting-machine-ms-dye-cutter-manual',         'CM-13', '45°'),
  ('cutting-machine-pvc-v-cutter-manual',          'CM-14', '45°')
) as v(slug, code, size)
where public.products.slug = v.slug and public.products.product_code is null;
