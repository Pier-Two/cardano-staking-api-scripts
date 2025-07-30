/**
 * Helper function to handle API errors consistently across all scripts
 * Handles both fetch Response errors and regular Error objects
 */
export async function handleApiError(
  error: unknown,
  context: string,
): Promise<never> {
  console.error(`\nError ${context}:`);

  if (error instanceof Response) {
    // Handle fetch Response errors
    console.error(`Status: ${error.status} ${error.statusText}`);
    console.error(`URL: ${error.url}`);

    try {
      const errorBody = await error.json();
      console.error("Response data:", JSON.stringify(errorBody, null, 2));
    } catch {
      try {
        const errorText = await error.text();
        console.error("Response text:", errorText);
      } catch {
        console.error("Could not read response body");
      }
    }
  } else if (error instanceof Error) {
    console.error("Error:", error.message);

    // If it's a network error, provide more context
    if (error.message.includes("fetch")) {
      console.error("This appears to be a network error. Please check:");
      console.error("- Is the API server running?");
      console.error("- Is the API_BASE_URL environment variable correct?");
      console.error("- Is your network connection working?");
    }

    // Only show stack trace in verbose mode or for unexpected errors
    if (process.env.VERBOSE === "true" && error.stack) {
      console.error("\nStack trace:", error.stack);
    }
  } else {
    console.error("Unknown error:", String(error));
  }

  process.exit(1);
}
