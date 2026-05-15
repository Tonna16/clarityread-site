const SUPPORT_TO = process.env.SUPPORT_TO || 'ttonnaagburu@gmail.com';
const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTHS = {
  name: 120,
  email: 254,
  subject: 180,
  message: 5000,
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const trimField = (value) => (typeof value === 'string' ? value.trim() : '');

const parseBody = (event) => {
  if (!event.body) {
    return {};
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';

  if (contentType.includes('application/json')) {
    return JSON.parse(rawBody);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return JSON.parse(rawBody);
};

const validatePayload = (payload) => {
  const fields = {
    name: trimField(payload.name),
    email: trimField(payload.email).toLowerCase(),
    subject: trimField(payload.subject),
    message: trimField(payload.message),
  };

  const errors = {};

  Object.entries(fields).forEach(([field, value]) => {
    if (!value) {
      errors[field] = 'This field is required.';
      return;
    }

    if (value.length > MAX_FIELD_LENGTHS[field]) {
      errors[field] = `Please keep this field under ${MAX_FIELD_LENGTHS[field]} characters.`;
    }
  });

  if (fields.email && !EMAIL_PATTERN.test(fields.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  return { fields, errors };
};

const getMissingEmailConfig = () => ['RESEND_API_KEY', 'EMAIL_FROM'].filter((key) => !process.env[key]);

const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildOwnerEmail = ({ name, email, subject, message }, timestamp) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');
  const safeTimestamp = escapeHtml(timestamp);

  return {
    from: process.env.EMAIL_FROM,
    to: SUPPORT_TO,
    reply_to: email,
    subject: `ClarityRead support: ${subject}`,
    text: [
      'New ClarityRead support request',
      '',
      `Sender name: ${name}`,
      `Sender email: ${email}`,
      `Subject: ${subject}`,
      `Submission timestamp: ${timestamp}`,
      '',
      'Support message:',
      message,
    ].join('\n'),
    html: `
      <h2>New ClarityRead support request</h2>
      <p><strong>Sender name:</strong> ${safeName}</p>
      <p><strong>Sender email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Submission timestamp:</strong> ${safeTimestamp}</p>
      <h3>Support message</h3>
      <p>${safeMessage}</p>
    `,
  };
};

const buildConfirmationEmail = ({ name, email, subject }) => {
  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subject);

  return {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'We received your ClarityRead support request',
    text: [
      `Hi ${name},`,
      '',
      `Thanks for contacting ClarityRead about "${subject}". Your message was received, and you can expect a reply within 48 hours.`,
      '',
      'Best,',
      'ClarityRead Support',
    ].join('\n'),
    html: `
      <p>Hi ${safeName},</p>
      <p>Thanks for contacting ClarityRead about <strong>${safeSubject}</strong>. Your message was received, and you can expect a reply within 48 hours.</p>
      <p>Best,<br />ClarityRead Support</p>
    `,
  };
};

const sendEmail = async (email) => {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(email),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Resend email API returned ${response.status}: ${responseText}`);
  }
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, error: 'Method not allowed.' });
  }

  let payload;

  try {
    payload = parseBody(event);
  } catch (error) {
    return json(400, { success: false, error: 'Invalid request body.' });
  }

  const { fields, errors } = validatePayload(payload);

  if (Object.keys(errors).length > 0) {
    return json(400, { success: false, error: 'Please fix the highlighted fields.', errors });
  }

  const missingEmailConfig = getMissingEmailConfig();

  if (missingEmailConfig.length > 0) {
    console.error('Missing support email configuration:', missingEmailConfig.join(', '));
    return json(500, { success: false, error: 'Support email is not configured yet.' });
  }

  const timestamp = new Date().toISOString();

  try {
    await sendEmail(buildOwnerEmail(fields, timestamp));
    await sendEmail(buildConfirmationEmail(fields));
  } catch (error) {
    console.error('Support email delivery failed:', error);
    return json(502, { success: false, error: 'Could not send your request. Please email support directly.' });
  }

  return json(200, {
    success: true,
    message: 'Your support request was sent. Please check your email for confirmation.',
  });
};
