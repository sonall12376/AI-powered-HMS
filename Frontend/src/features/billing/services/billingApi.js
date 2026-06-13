const BASE_URL = '/api/v1/billing';

export const fetchInvoices = async () => {
  const response = await fetch(`${BASE_URL}/invoices`);
  if (!response.ok) throw new Error('Failed to fetch invoices');
  const result = await response.json();
  return result.data;
};

export const fetchInvoiceById = async (id) => {
  const response = await fetch(`${BASE_URL}/invoices/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch invoice ${id}`);
  const result = await response.json();
  return result.data;
};

export const fetchInvoicesByPatient = async (patientId) => {
  const response = await fetch(`${BASE_URL}/invoices/patient/${patientId}`);
  if (!response.ok) throw new Error(`Failed to fetch invoices for patient ${patientId}`);
  const result = await response.json();
  return result.data;
};

export const createInvoice = async (invoiceData) => {
  const response = await fetch(`${BASE_URL}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to create invoice');
  }
  const result = await response.json();
  return result.data;
};

export const processPayment = async (invoiceId, paymentData) => {
  const response = await fetch(`${BASE_URL}/invoices/${invoiceId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to process payment');
  }
  const result = await response.json();
  return result.data;
};

export const submitInsuranceClaim = async (invoiceId, claimData) => {
  const response = await fetch(`${BASE_URL}/invoices/${invoiceId}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claimData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to file insurance claim');
  }
  const result = await response.json();
  return result.data;
};

export const fetchPaymentHistory = async (invoiceId) => {
  const response = await fetch(`${BASE_URL}/invoices/${invoiceId}/payments`);
  if (!response.ok) throw new Error(`Failed to fetch payments for invoice ${invoiceId}`);
  const result = await response.json();
  return result.data;
};
