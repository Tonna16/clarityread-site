# clarityread-website

Static marketing and support pages for ClarityRead.

## Support form with EmailJS

The support form on `support.html` sends directly from the browser through EmailJS. There is no Netlify Function or server-side email endpoint required.

### 1. Create your EmailJS service

1. Sign in at <https://dashboard.emailjs.com/>.
2. Go to **Email Services**.
3. Click **Add New Service**.
4. Choose your email provider, such as Gmail.
5. Connect the inbox that should send/receive ClarityRead support mail.
6. Copy the generated **Service ID**. You will paste it into `support.html` as `data-emailjs-service-id`.

### 2. Create the support request template

1. Go to **Email Templates**.
2. Click **Create New Template**.
3. Configure the template fields like this:
   - **Template name:** `ClarityRead Support Request`
   - **To Email:** your support inbox, for example `ttonnaagburu@gmail.com`
   - **From Name:** `{{name}}`
   - **Reply To:** `{{email}}`
   - **Subject:** `ClarityRead support: {{subject}}`
4. Use this message body:

```text
New ClarityRead support request

Name: {{name}}
Email: {{email}}
Subject: {{subject}}

Message:
{{message}}
```

5. Save the template.
6. Copy the generated **Template ID**. You will paste it into `support.html` as `data-emailjs-template-id`.

The form field names are `name`, `email`, `subject`, and `message`; keep the EmailJS variables exactly the same.

### 3. Optional: add an automatic confirmation email

If you want the user to receive a confirmation, create a second EmailJS template and link it from the main support template's **Auto-Reply** tab.

Suggested auto-reply settings:

- **To Email:** `{{email}}`
- **To Name:** `{{name}}`
- **From Name:** `ClarityRead Support`
- **Reply To:** your support inbox, for example `ttonnaagburu@gmail.com`
- **Subject:** `We received your ClarityRead support request`

Suggested auto-reply body:

```text
Hi {{name}},

Thanks for contacting ClarityRead about "{{subject}}". I received your message and will reply within 48 hours.

— ClarityRead Support
```

### 4. Add the EmailJS IDs to the site

Open `support.html` and replace these placeholder values on the `<form>` element:

```html
data-emailjs-public-key="YOUR_EMAILJS_PUBLIC_KEY"
data-emailjs-service-id="YOUR_EMAILJS_SERVICE_ID"
data-emailjs-template-id="YOUR_EMAILJS_TEMPLATE_ID"
```

Where to find each value:

- **Public Key:** EmailJS dashboard → **Account** → **Public Key**.
- **Service ID:** EmailJS dashboard → **Email Services** → your connected service.
- **Template ID:** EmailJS dashboard → **Email Templates** → your support template.

The EmailJS public key, service ID, and template ID are meant to be used by browser code. Do not add private email passwords or secret API keys to this repository.

## Deployment

Because the support form now uses EmailJS from frontend JavaScript, this site can be deployed as a fully static site.

### GitHub Pages

Yes, GitHub Pages will work.

1. Push this repository to GitHub.
2. In the repository, open **Settings** → **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose your branch, usually `main`, and the `/ (root)` folder.
5. Save.
6. After GitHub finishes deploying, open the Pages URL and test `support.html`.

For this project, root deployment is correct because `index.html`, `support.html`, `styles.css`, and `support.js` are all at the repository root.

### Netlify or other static hosts

Netlify, Vercel static hosting, Cloudflare Pages, and similar static hosts will also work. No serverless function configuration is needed for the support form anymore.

## Local checks

```bash
npm test
```
