# Security

- Never commit API keys, cookies, browser storage state, private avatar identifiers, training media, generated customer media, traces containing personal data, or account exports.
- Runtime data must stay under `.runtime/` or another ignored directory.
- All provider calls are opt-in. Dry-run and mock modes are the default during construction.
- Public examples must use fictitious data.
