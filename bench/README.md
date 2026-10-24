# LYGO Bench

Live: https://chatagent.ca/bench/

Browser workbench:

1. **Card** — HTTPS GET a public page (or drop local HTML). Title, CSP, SHA-256, yield ALIGNED / DRIFT / SHADOW.
2. **Hash** — SHA-256 of pasted text or a dropped file. Stays in this tab.
3. **Redact** — strip common API keys / PEMs / JWTs before you paste into a model.

No POST. No live Star Chart write. CORS miss on a foreign page is named SHADOW.

CLI pair:

```text
npx clawhub@latest install deepseekoracle/lygo-site-card
npx clawhub@latest install deepseekoracle/lygo-context-guard
```
