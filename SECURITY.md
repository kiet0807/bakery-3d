# Security

## Reporting a vulnerability

Please report it privately, not in a public issue: open the repository's **Security** tab and choose **Report a
vulnerability** ([direct link](https://github.com/kiet0807/bakery-3d/security/advisories/new)). Only the maintainer
sees the report.

Say what you did, what happened and what you expected, and the page address. Steps or a short script help most.

This project has one maintainer. Expect an answer within a week. A confirmed problem is fixed on `main`, which deploys
to `https://bakery.kaidev.io.vn`.

## What counts

Kai's Bakery is a demo shop: there is no server-side code that stores orders, no accounts and no payments. Welcome
reports, for example:

- script injection through a shared design link (`/design?cake=…`), a saved cart or any other input;
- a way around the security headers in `next.config.ts`, for example framing the site from another origin or
  sending its forms elsewhere;
- the test checkout sending or keeping a name, phone number or address, which the site promises it never does.

Not a vulnerability here:

- the shop's phone number and social links on the pages: they are public on purpose;
- prices or orders changed in your own browser's storage: nothing is charged or sent;
- flooding the site with traffic.
