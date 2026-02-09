
import { Repository } from '../types';

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Layer 2: Candidate Retrieval
 * Fetches repositories by proxying through the secure backend.
 */
export async function fetchCandidates(queries: string[], token?: string): Promise<Repository[]> {
  try {
    // We pass the client-side token to the backend.
    // The backend prioritizes this token if provided, falling back to process.env.GITHUB_TOKEN.

    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queries, token }),
    });

    if (response.status === 429) {
      throw new RateLimitError("GitHub API Rate Limit Exceeded");
    }

    if (response.status === 401) {
      throw new Error("Authentication Failed: Check GitHub Token");
    }

    if (!response.ok) {
      throw new Error(`Backend Error: ${response.status}`);
    }

    const repos: Repository[] = await response.json();
    return repos;

  } catch (error: any) {
    if (error instanceof RateLimitError) throw error;

    console.error("Candidate Fetch Error:", error);
    throw error;
  }
}
