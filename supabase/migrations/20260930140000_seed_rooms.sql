-- Slug is how the floorplan SVG's clickable shapes reference a room
-- (navigates to /rooms/:slug) without hardcoding a uuid in the component.
alter table rooms add column slug text unique not null;

insert into rooms (name, slug, location, capacity) values
  ('Big conference room', 'big-conference-room', 'office', 8),
  ('Small conference room', 'small-conference-room', 'office', 4),
  ('Studio', 'studio', 'studio', null);
