export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

export async function parseApiError(
  res: Response,
  fallback = "Request failed",
): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string" && data.error) return data.error;
  } catch {
    // response body was not JSON
  }

  if (res.status === 502) return "AI service is temporarily unavailable. Try again.";
  if (res.status === 500) return "Server error. Check your configuration and try again.";
  if (res.status === 400) return "Invalid input. Check your job description and resume.";
  return fallback;
}
