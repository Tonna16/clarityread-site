const supportForm = document.querySelector('.support-form');
const supportStatus = document.querySelector('#support-form-status');
const supportSubmitButton = supportForm?.querySelector('button[type="submit"]');
const fallbackEmail = 'ttonnaagburu@gmail.com';
const successMessage = 'Your message was sent. I’ll reply within 48 hours.';
const failureMessage = `Unable to send your message. Please email ${fallbackEmail} directly.`;

const setSupportStatus = (message, type = 'success') => {
  if (!supportStatus) {
    return;
  }

  supportStatus.textContent = message;
  supportStatus.dataset.status = type;
};

const markInvalidFields = (errors = {}) => {
  if (!supportForm) {
    return;
  }

  supportForm.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute('aria-invalid');
  });

  Object.keys(errors).forEach((fieldName) => {
    const field = supportForm.elements[fieldName];

    if (field) {
      field.setAttribute('aria-invalid', 'true');
    }
  });
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return {};
};

supportForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  markInvalidFields();

  if (!supportForm.checkValidity()) {
    supportForm.reportValidity();
    setSupportStatus('Error: please complete every required field with a valid email address.', 'error');
    return;
  }

  const payload = Object.fromEntries(new FormData(supportForm));

  if (supportSubmitButton) {
    supportSubmitButton.disabled = true;
  }

  supportForm.setAttribute('aria-busy', 'true');
  setSupportStatus('Sending your request…', 'pending');

  try {
    const response = await fetch(supportForm.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const result = await parseResponse(response);

    if (!response.ok || !result.success) {
      markInvalidFields(result.errors);
      throw new Error(result.error || failureMessage);
    }

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
