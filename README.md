# clarityread-website

Static marketing and support pages for ClarityRead.

## Support endpoint

The support form posts to `/api/support`, which is redirected by Netlify to `/.netlify/functions/support`. The function validates `name`, `email`, `subject`, and `message`, sends the owner-facing support email to `ttonnaagburu@gmail.com`, and sends the user a confirmation email.

Configure these environment variables in Netlify before deploying:

- `RESEND_API_KEY` - server-side API key for the Resend email service.
- `EMAIL_FROM` - verified sender address used in outgoing support emails, such as `ClarityRead Support <support@example.com>`.
- `SUPPORT_TO` - optional override for the owner inbox. Defaults to `ttonnaagburu@gmail.com`.

Do not put email provider credentials in frontend JavaScript or committed files.
