const BASE_URL = '/api/v1/emergency-cases';

export const fetchEmergencyCases = async (status = '') => {
  const url = status ? `${BASE_URL}?status=${status}` : BASE_URL;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch emergency queue');
  const result = await response.json();
  return result.data;
};

export const fetchEmergencyCaseById = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch emergency case ${id}`);
  const result = await response.json();
  return result.data;
};

export const registerEmergencyCase = async (caseData) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caseData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to register emergency case');
  }
  const result = await response.json();
  return result.data;
};

export const updateTriage = async (id, triageData) => {
  const response = await fetch(`${BASE_URL}/${id}/triage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(triageData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to update triage details');
  }
  const result = await response.json();
  return result.data;
};

export const logTreatment = async (id, treatmentData) => {
  const response = await fetch(`${BASE_URL}/${id}/treatments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(treatmentData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to log ER treatment');
  }
  const result = await response.json();
  return result.data;
};

export const assignStaff = async (id, staffIds) => {
  const response = await fetch(`${BASE_URL}/${id}/assign-staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffIds })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to assign medical staff');
  }
  const result = await response.json();
  return result.data;
};

export const escalateCaseToInpatient = async (id, escalationData) => {
  const response = await fetch(`${BASE_URL}/${id}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(escalationData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to escalate emergency case');
  }
  const result = await response.json();
  return result.data;
};

export const closeEmergencyCase = async (id, dischargeNotes = '') => {
  const response = await fetch(`${BASE_URL}/${id}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dischargeNotes })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to close emergency case');
  }
  const result = await response.json();
  return result.data;
};
