const BASE_URL = '/api/v1/ai';

export const explainPrescription = async (prescriptionDetails, patientId) => {
  const response = await fetch(`${BASE_URL}/explain-prescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prescriptionDetails, patientId })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to explain prescription. Rate limit may have been reached.');
  }

  const result = await response.json();
  return result.data;
};

export const fetchOperationalInsights = async () => {
  const response = await fetch(`${BASE_URL}/insights`);
  if (!response.ok) throw new Error('Failed to fetch operational insights');
  const result = await response.json();
  return result.data;
};

export const triggerOperationalInsights = async () => {
  const response = await fetch(`${BASE_URL}/insights/trigger`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to trigger operational insights update');
  const result = await response.json();
  return result.data;
};
