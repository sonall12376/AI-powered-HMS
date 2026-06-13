const BASE_URL = '/api/v1/reports';

export const fetchReportsSummary = async () => {
  const response = await fetch(`${BASE_URL}/summary`);
  if (!response.ok) throw new Error('Failed to fetch reports summary');
  const result = await response.json();
  return result.data;
};

export const fetchReportsSnapshots = async (startDate, endDate) => {
  let url = `${BASE_URL}/snapshots`;
  const queryParams = [];
  if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch historical reports snapshots');
  const result = await response.json();
  return result.data;
};

export const seedReportsDemoData = async () => {
  const response = await fetch(`${BASE_URL}/seed`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to seed reports demo data');
  const result = await response.json();
  return result.data;
};
