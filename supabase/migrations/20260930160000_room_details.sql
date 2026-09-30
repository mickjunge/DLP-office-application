alter table rooms add column has_tv boolean;

update rooms set capacity = 5, has_tv = false where slug = 'small-conference-room';
update rooms set capacity = 12, has_tv = true where slug = 'big-conference-room';
-- studio: capacity and has_tv both stay null (N/A — not a seated room)
