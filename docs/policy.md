# Google automation boundary

Google describes queries sent by robots, computer programs, automated services and search scrapers as automated traffic and may display unusual-traffic or reCAPTCHA challenges. Google also restricts automated access in its terms/policies.

This repository therefore treats Google browser search as a best-effort, bounded external discovery capability. It is not an official Google Search API, not an unlimited-search guarantee and not a mechanism for bypassing Google controls.

Required behavior:

- no CAPTCHA solving or bypass;
- no stealth/fingerprint manipulation;
- no proxy/IP rotation for bypass purposes;
- no automated recovery intended to defeat provider blocks;
- serialized bounded requests;
- configurable backoff after a block;
- explicit consent choice;
- preserve independent OpenAI/native search as a separate source;
- stop and surface provider limitations rather than hiding them.

References checked 2026-10-02:

- https://support.google.com/websearch/answer/86640
- https://policies.google.com/terms
