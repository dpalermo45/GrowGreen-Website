# Content parity vs stored WordPress extract

Compares substantial paragraphs / FAQs / structured blocks from `src/data/content/*.json` against locally rendered `<main>` text.

## Summary

| Verdict | Count |
| --- | ---: |
| strong | 54 |
| partial | 2 |
| weak | 1 |

## Intentional remaining gaps

- **Privacy / Terms:** Pages render `src/data/legal-content.generated.ts` (scrubbed legal HTML), not the Divi `content/*.json` extract. Partial scores vs Divi JSON are expected until the parity script compares against the generated legal source.
- **Trucklead “misses”:** SMS consent copy, JS-disabled notice, and thank-you strings live in the shared quote form / success UI — not duplicated as static paragraphs. Add-on lawn help copy is included when present in filtered narrative.

## Gaps (non-strong)

- `/privacy-policy/` — **partial** · 22/35 (63%)
  - missing: Contact our local office team to ask about your information or communication preferences.
  - missing: If you affirmatively opt in, Grow Green may send SMS or MMS messages concerning estimate notifications and follow-ups, appointments, scheduling, technician arrival, service updates
  - missing: You may opt out by replying STOP to a message or by contacting us. Reply HELP for assistance. We may retain opt-in and opt-out records to document and honor your communication choi
  - missing: Payments may be processed by a third-party payment processor. Payment-card information is submitted to and handled by that processor under its security practices and privacy policy
  - missing: We retain personal information for as long as reasonably necessary for the purposes described in this policy, including providing services, maintaining customer and treatment recor
  - missing: We use reasonable administrative, technical, and physical safeguards designed to protect personal information against unauthorized access, loss, misuse, alteration, or disclosure. 
- `/terms-and-conditions/` — **partial** · 23/34 (68%)
  - missing: Our local office team can answer questions about these terms or your messaging preferences.
  - missing: These terms cover this website and our SMS program. Lawn-care services are governed by the written estimate, service authorization, account terms, or other service documents provid
  - missing: To the fullest extent permitted by law, Grow Green Weed Control and its owners, employees, and agents will not be liable for indirect, incidental, special, consequential, exemplary
  - missing: This limitation concerns the Site and does not replace or expand any rights, obligations, limitations, or remedies contained in an applicable customer service document. Some laws d
  - missing: Our Privacy Policy explains how we collect, use, disclose, and protect personal information. By using the Site, you acknowledge that information will be handled as described in tha
  - missing: We may update the Site and these Terms from time to time. When we make changes, we will post the revised Terms here and update the effective date. Changes apply prospectively when 
- `/trucklead/` — **weak** · 7/12 (58%)
  - missing: By checking this box, I agree to receive SMS messages from Grow Green Weed Control about estimates, appointments, service, billing, and customer support. Message frequency varies. 
  - missing: Please enable JavaScript to send this form, or call (225) 461-3199 for your free estimate.
  - missing: Thanks for reaching out! We’ve received your estimate request. Our local team will review your property and follow up with pricing, usually within one business day.
  - missing: No need to submit again. If you have a question in the meantime, give us a call.
  - missing: Need extra help in the yard? Ask about fire ant control, fungus and insect treatments, and soil health options. We’ll explain any additional recommendations and pricing.

## Strong matches

- `/about-us/` · 25/25
- `/battling-dallis-grass-the-challenge-of-eliminating-a-stubborn-weed-in-warm-season-grasses/` · 7/7
- `/battling-large-patch-disease-a-guide-to-protecting-your-baton-rouge-lawn/` · 6/6
- `/careers/` · 15/17
- `/common-lawn-insects-in-prairieville/` · 13/13
- `/contact-us/` · 9/10
- `/core-aeration/` · 31/31
- `/creating-a-thriving-centipede-lawn-in-baton-rouge-louisiana/` · 16/16
- `/excellent-results-with-our-lawn-treatment-program/` · 0/0
- `/facebook-estimate-request/` · 19/22
- `/fire-ant-treatment/` · 30/30
- `/fire-ant-treatments-baton-rouge/` · 27/30
- `/flower-bed-weed-control-and-fertilization/` · 28/28
- `/gym-member-lawn-care-special/` · 2/2
- `/how-to-kill-pickers-stickers-burweed-in-louisiana/` · 25/25
- `/importance-of-winterizing-your-lawn-and-pre-emergents-in-south-louisiana/` · 0/0
- `/lawn-care-blog/` · 2/2
- `/lawn-fertilization-ascension/` · 28/32
- `/lawn-fertilization-baton-rouge/` · 29/32
- `/lawn-fertilization-denham-springs/` · 29/32
- `/lawn-fertilization-gonzales/` · 29/32
- `/lawn-fertilization-laplace/` · 31/34
- `/lawn-fertilization-lutcher/` · 31/34
- `/lawn-fertilization-plaquemine/` · 31/34
- `/lawn-fertilization-prairieville/` · 31/34
- `/lawn-fertilization-weed-control/` · 32/32
- `/lawn-fungus/` · 42/42
- `/lawn-insects/` · 41/41
- `/lawn-treatment-addis-la/` · 30/33
- `/lawn-treatment-and-weed-control-in-iberville-parish/` · 32/35
- `/lawn-treatment-in-saint-gabriel-la/` · 37/40
- `/lawn-treatment-service-in-central-la/` · 37/40
- `/lawn-treatment-service-in-denham-springs-la/` · 39/42
- `/lawn-treatment-service-in-gonzales-la/` · 39/42
- `/lawn-treatment-service-in-walker-la/` · 39/42
- `/lawn-treatment-service-prairieville-la/` · 42/45
- `/lawn-treatment-springfield-la/` · 38/41
- `/lawn-treatment-west-baton-rouge-la/` · 40/43
- `/lawn-treatments-ascension/` · 33/35
- `/lawn-treatments-baton-rouge/` · 41/44
- `/lawn-treatments-livingston-parish/` · 40/43
- `/liquid-aeration/` · 29/29
- `/mosquito-flea-tick-treatments/` · 33/33
- `/nextdoor-estimate-request/` · 17/19
- `/plant-disease-or-pest/` · 39/42
- `/post-card-estimate-request/` · 6/6
- `/request-a-quote/` · 8/9
- `/request-an-estimate-facebook-50/` · 0/0
- `/services/` · 34/37
- `/soil-sample/` · 16/16
- `/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/` · 10/10
- `/tree-and-shrub-care/` · 32/32
- `/weed-control-ascension/` · 36/39
- `/weed-control-baton-rouge/` · 38/41
