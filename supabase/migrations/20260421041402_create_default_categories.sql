create table default_categories (
  id       text primary key,
  label    text not null,
  color    text not null,
  position smallint not null default 0
);

grant select on default_categories to anon, authenticated;

alter table default_categories enable row level security;

create policy "Public read"
  on default_categories
  for select
  using (true);

insert into default_categories (id, label, color, position) values
  ('groceries',     'Groceries',      '#E8981E', 0),
  ('dining',        'Dining',         '#F07030', 1),
  ('transport',     'Transport',      '#F5B041', 2),
  ('shopping',      'Shopping',       '#90C853', 3),
  ('entertainment', 'Entertainment',  '#D4780A', 4),
  ('health',        'Health',         '#5DADE2', 5),
  ('utilities',     'Utilities',      '#A569BD', 6),
  ('business',      'Business',       '#F0C060', 7),
  ('other',         'Other',          '#B6ACA6', 8);
