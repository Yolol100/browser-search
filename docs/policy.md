# Google automation boundary

Google Search Help states that queries sent by robots, computer programs, automated services, and search scrapers are considered automated traffic. Google may respond with an unusual-traffic page or reCAPTCHA.

This project therefore treats live Google browser search as a best-effort external capability, not as an official or unlimited API.

Required behavior:

- no anti-bot bypass;
- no CAPTCHA solving;
- no stealth/fingerprint manipulation;
- no proxy/IP rotation for bypass purposes;
- bounded serialized requests;
- stop immediately on block signals;
- preserve independent native/OpenAI search as a separate source.

References checked 2026-10-02:

- https://support.google.com/websearch/answer/86640
- https://policies.google.com/terms
