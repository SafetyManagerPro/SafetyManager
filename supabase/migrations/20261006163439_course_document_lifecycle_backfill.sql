update public.course_completion_items
set document_status = case
  when mode = 'not_applicable' or activity_status = 'not_applicable' or evidence_status = 'not_applicable' then 'not_applicable'
  when evidence_status in ('scan_available','digital') then 'scanned'
  when evidence_status = 'paper_original' and recording_status = 'recorded' then 'checked'
  when evidence_status = 'paper_original' then 'returned'
  else document_status
end,
scanned_at = case when evidence_status in ('scan_available','digital') then coalesce(scanned_at, updated_at, now()) else scanned_at end,
checked_at = case when evidence_status = 'paper_original' and recording_status = 'recorded' then coalesce(checked_at, updated_at, now()) else checked_at end,
returned_at = case when evidence_status = 'paper_original' then coalesce(returned_at, updated_at, now()) else returned_at end
where document_status = 'not_prepared';
