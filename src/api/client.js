const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:4000'
).replace(/\/$/, '');

export async function apiRequest(
  path,
  options = {}
) {
  const {
    method = 'GET',
    body,
    token,
  } = options;

  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      method,
      headers,
      body: body === undefined
        ? undefined
        : JSON.stringify(body),
    }
  );

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';

  const data =
    contentType.includes(
      'application/json'
    )
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof data === 'object'
        ? data?.error ||
          `API request failed: ${response.status}`
        : `API request failed: ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export { API_URL };
