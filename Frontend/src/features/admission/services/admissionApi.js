const BASE_URL = '/api/v1/admissions';

export const fetchAdmissions = async (status = '') => {
  const url = status ? `${BASE_URL}?status=${status}` : BASE_URL;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch admissions');
  const result = await response.json();
  return result.data;
};

export const fetchAdmissionById = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch admission ${id}`);
  const result = await response.json();
  return result.data;
};

export const fetchAdmissionsByPatient = async (patientId) => {
  const response = await fetch(`${BASE_URL}/patient/${patientId}`);
  if (!response.ok) throw new Error(`Failed to fetch admissions for patient ${patientId}`);
  const result = await response.json();
  return result.data;
};

export const admitPatient = async (admissionData) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admissionData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to admit patient');
  }
  const result = await response.json();
  return result.data;
};

export const recordRound = async (admissionId, roundData) => {
  const response = await fetch(`${BASE_URL}/${admissionId}/rounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roundData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to record clinical round');
  }
  const result = await response.json();
  return result.data;
};

export const transferPatient = async (admissionId, transferData) => {
  const response = await fetch(`${BASE_URL}/${admissionId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to transfer patient');
  }
  const result = await response.json();
  return result.data;
};

export const dischargePatient = async (admissionId, dischargeData) => {
  const response = await fetch(`${BASE_URL}/${admissionId}/discharge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dischargeData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to discharge patient');
  }
  const result = await response.json();
  return result.data;
};

export const fetchBeds = async (occupied = null, wardName = '') => {
  let url = `${BASE_URL}/beds`;
  const params = [];
  if (occupied !== null) params.push(`occupied=${occupied}`);
  if (wardName) params.push(`wardName=${encodeURIComponent(wardName)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch beds directory');
  const result = await response.json();
  return result.data;
};

export const seedBeds = async () => {
  const response = await fetch(`${BASE_URL}/beds/seed`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to seed beds directory');
  const result = await response.json();
  return result.data;
};
