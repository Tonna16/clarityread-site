const supportForm = document.querySelector('.support-form');
const supportStatus = document.querySelector('#support-form-status');
const supportSubmitButton = supportForm?.querySelector('button[type="submit"]');
const supportScriptVersion = '2026-05-17-emailjs-send';
const supportEmail = 'clarityread.support@gmail.com';
const successMessage = 'Your message was sent. I’ll reply within 48 hours.';
const configurationMessage = `Support form is not configured yet. Please email ${supportEmail} directly.`;
const failureMessage = `Unable to send your message. Please email ${supportEmail} directly.`;
const emailjsPlaceholderPattern = /^(YOUR_|REPLACE_)/i;

console.info(`ClarityRead support form loaded (${supportScriptVersion}).`);

const setSupportStatus = (message, type = 'success') => {
  if (!supportStatus) {
    return;
  }

  supportStatus.textContent = message;
  supportStatus.dataset.status = type;
};

const markInvalidFields = () => {
  if (!supportForm) {
    return;
  }

  supportForm.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute('aria-invalid');
  });
};

const getEmailjsConfig = () => {
  if (!supportForm) {
    return null;
  }

  const config = {
    publicKey: supportForm.dataset.emailjsPublicKey?.trim(),
    serviceId: supportForm.dataset.emailjsServiceId?.trim(),
    templateId: supportForm.dataset.emailjsTemplateId?.trim(),
  };

  const hasMissingValue = Object.values(config).some((value) => !value || emailjsPlaceholderPattern.test(value));

  return hasMissingValue ? null : config;
};

const getEmailjsClient = () => {
  if (!window.emailjs || typeof window.emailjs.send !== 'function') {
    return null;
  }

  return window.emailjs;
};

const getSupportFormParams = () => {
  const formData = new FormData(supportForm);
  const name = formData.get('name')?.toString().trim() ?? '';
  const email = formData.get('email')?.toString().trim() ?? '';
  const subject = formData.get('subject')?.toString().trim() ?? '';
  const message = formData.get('message')?.toString().trim() ?? '';

  return {
    name,
    email,
    subject,
    message,
    from_name: name,
    from_email: email,
    reply_to: email,
    to_email: supportEmail,
  };
};

const getEmailjsErrorText = (error) => {
  if (!error) {
    return '';
  }

  if (typeof error.text === 'string') {
    return error.text;
  }

  if (typeof error.message === 'string') {
    return error.message;
  }

  return '';
};

supportForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  markInvalidFields();

  if (!supportForm.checkValidity()) {
    supportForm.reportValidity();
    setSupportStatus('Error: please complete every required field with a valid email address.', 'error');
    return;
  }

  const emailjsClient = getEmailjsClient();
  const emailjsConfig = getEmailjsConfig();

  if (!emailjsClient || !emailjsConfig) {
    setSupportStatus(`Error: ${configurationMessage}`, 'error');
    return;
  }

  if (supportSubmitButton) {
    supportSubmitButton.disabled = true;
  }

  supportForm.setAttribute('aria-busy', 'true');
  setSupportStatus('Sending your request…', 'pending');

  try {
    await emailjsClient.send(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      getSupportFormParams(),
      { publicKey: emailjsConfig.publicKey },
    );

    supportForm.reset();
    setSupportStatus(successMessage);
  } catch (error) {
    const errorText = getEmailjsErrorText(error);

    if (errorText) {
      console.error('EmailJS failed to send the support request:', errorText);
    }

    setSupportStatus(`Error: ${failureMessage}`, 'error');
  } finally {
    supportForm.removeAttribute('aria-busy');

    if (supportSubmitButton) {
      supportSubmitButton.disabled = false;
    }
  }
});
