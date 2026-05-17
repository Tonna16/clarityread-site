const supportForm = document.querySelector('.support-form');
const supportStatus = document.querySelector('#support-form-status');
const supportSubmitButton = supportForm?.querySelector('button[type="submit"]');
const fallbackEmail = 'ttonnaagburu@gmail.com';
const successMessage = 'Your message was sent. I’ll reply within 48 hours.';
const configurationMessage = `Support form is not configured yet. Please email ${fallbackEmail} directly.`;
const failureMessage = `Unable to send your message. Please email ${fallbackEmail} directly.`;
const emailjsPlaceholderPattern = /^(YOUR_|REPLACE_)/i;

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
  if (!window.emailjs || typeof window.emailjs.sendForm !== 'function') {
    return null;
  }

  return window.emailjs;
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
    await emailjsClient.sendForm(emailjsConfig.serviceId, emailjsConfig.templateId, supportForm, {
      publicKey: emailjsConfig.publicKey,
    });

    supportForm.reset();
    setSupportStatus(successMessage);
  } catch (error) {
    setSupportStatus(`Error: ${failureMessage}`, 'error');
  } finally {
    supportForm.removeAttribute('aria-busy');

    if (supportSubmitButton) {
      supportSubmitButton.disabled = false;
    }
  }
});
