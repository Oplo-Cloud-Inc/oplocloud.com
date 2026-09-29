# OC EFM sample books (test fixture)

`seed.js` generates invented books — three entities, GBP/JPY/USD, fictional colleagues,
a bank feed, a September close — so the accounting engine and every screen can be tested
against a busy ledger. **It is not part of OC EFM and is never served to anybody**; OC EFM
shows only OploCloud's real books, kept as a chained list of commands on the server
(`api/migrations/0012_efm_books.sql`, `efm/js/books.js`).

The browser tests load it in development only, when the page sets `window.__EFM_SAMPLE`,
which serves this file at `/js/sample-seed.js` on a local server. In production the page
ignores the flag and no such address exists.
