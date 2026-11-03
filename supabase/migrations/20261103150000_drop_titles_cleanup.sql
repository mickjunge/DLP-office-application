-- Follow-up to 20261103120000: the app no longer sends titles, so drop the
-- old title-taking functions (which also bypassed the abuse limits), the
-- title column itself, and the retired OTHER company code.

drop function create_booking(uuid, text, timestamptz, timestamptz, text);
drop function create_booking(uuid, text, timestamptz, timestamptz, text, text);
drop function update_booking(uuid, uuid, text, timestamptz, timestamptz);
drop function update_booking(uuid, uuid, text, timestamptz, timestamptz, text);

alter table bookings drop column title;

update bookings set company = 'EM' where company = 'OTHER';
alter table bookings drop constraint bookings_company_check;
alter table bookings add constraint bookings_company_check
  check (company in ('DLP', 'BTB', 'PIXEL', 'EM'));
