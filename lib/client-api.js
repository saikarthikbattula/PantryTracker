export async function postJSON(path, body) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.status === 504
        ? "Recipe or photo analysis took too long. Please try again."
        : "The server returned an unexpected response. Please try again.",
    );
  }
  if (!response.ok)
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "The request could not be completed. Please try again.",
    );
  return data;
}
