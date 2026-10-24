# 01 - Sign in and open the correct menu

## User Story

As a participant, I want to sign up and go straight to Challenges, so that I can start practising without setting up a company or uploading a file.

**Owner:** Dev A  
**Needs:** Existing auth and application shell. Agree personal-record ownership with the other developers.  
**BRD:** BR-01; navigation in section 5.

## To Do

- [ ] Reuse the existing signup/sign-in flow. Use Google if configured and tested, or keep the working managed login. Do not make a provider change a separate rebuild.
- [ ] Send new and returning users to Challenges, except when returning to a valid protected deep link. Remove the mandatory organisation setup check/redirect from the event flow.
- [ ] Show exactly Dashboard, Practice Mode > Challenges and Sessions, Knowledge Base, and Settings. Remove guest, Clients, organisation/team, Realtime and Integrations entry points.
- [ ] Protect application routes and APIs. Reject unauthenticated or anonymous-account attempts before challenge access, uploads, generation, coaching, calls, reports or Time Machine processing.
- [ ] Use the verified account ID for personal records. Enforce owner access to private records, not a browser-provided owner field; give teammates a clear shared helper/pattern.
- [ ] Keep session restoration, signout and failed-login recovery working. Clear personal caches on signout/account change and show useful access errors.
- [ ] Keep public marketing/QR links limited to product information and sign-in; they must not start an unauthenticated AI session.

## Technical Notes

Reuse the existing Supabase SDK session, feature repositories and protected routes. Existing organisation tables can remain unused; no destructive schema cleanup or role system is needed. Update tests that assume every account must complete organisation setup. Owner policies on feature tables/files belong with those features.

## Done When

- [ ] I sign up with no company/product fields and land on Challenges; refresh and later sign-in work too.
- [ ] Without sign-in, I cannot use app features or trigger AI through a direct API request.
- [ ] The menu matches the agreed structure and signout does not leave my personal data visible.
