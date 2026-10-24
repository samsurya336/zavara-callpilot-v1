# 03 - Upload personal product knowledge

## User Story

As a participant, I want to upload my product details, so that I can generate product-specific challenges and get accurate private coaching and feedback.

**Owner:** Dev A  
**Needs:** Signed-in ownership from task 01. Share ready-entry/text references with tasks 04, 06 and 07.  
**BRD:** BR-03.

## To Do

- [ ] Add Knowledge Base list/detail/create screens with title and exactly one PDF per entry. Allow multiple entries per account.
- [ ] Show filename/type, created date and Uploading/Processing/Ready/Failed state. State the supported file size/content limit and ask people to upload only authorised material.
- [ ] Save the private file and metadata under the verified owner. Validate size and actual supported type on the backend, not just the extension.
- [ ] Extract readable text with the Gemini extraction function. Handle empty, scanned or unreadable files honestly, support processing retry and clean up incomplete uploads.
- [ ] Make only Ready entries selectable for challenge generation. Provide a route back to Challenges with this entry selected; use the generation action defined in task 04.
- [ ] Enforce personal database/Storage access for metadata, files, extracted text and source retrieval. Remove conflicting broad demo policies; another signed-in account must not download or attach the source.
- [ ] Keep stable knowledge content/version references for generated challenges, reports and Time Machine. If replacement/deletion is offered, handle dependent records clearly rather than silently changing their evidence.

## Technical Notes

Reuse the private `documents` bucket but review its existing permissive access. Use a simple owner-linked knowledge table and bounded text/chunks; no vector service, crawling or organisation sharing is required. Choose a size within the bucket maximum and display it. Full seller files go to the private coach/evaluator, not buyer prompts.

## Done When

- [ ] I create multiple entries with one supported file each and see their real state after refresh.
- [ ] A Ready entry can generate challenges; invalid/unreadable files show a useful retry/error state.
- [ ] A second account cannot list, fetch, download or use my content through direct requests, and Open Challenges still work without uploads.
