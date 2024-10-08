import { Poll } from '../types';

// Function to create a new poll
export async function createPoll(question: string, options: string[], allowMultipleAnswers: boolean): Promise<Poll> {
  const response = await fetch(`/api/poll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options, allowMultipleAnswers }),
  });
  if (!response.ok) throw new Error('Failed to create poll');
  return response.json();
}

// Function to fetch a poll by ID
export async function fetchPoll(id: string): Promise<Poll> {
  const response = await fetch(`/api/poll/${id}`);
  if (!response.ok) throw new Error('Failed to fetch poll');
  return response.json();
}

// Function to submit a vote
export async function submitVote(pollId: string, optionId: number, voterName: string | null): Promise<void> {
  const response = await fetch(`/api/poll/${pollId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId, voterName }),
  });
  if (!response.ok) throw new Error('Failed to submit vote');
}

// Function to fetch all polls
export async function fetchAllPolls(): Promise<Poll[]> {
  const response = await fetch(`/api/poll`, {
    method: 'GET',
    cache: 'no-store'
  });
  
  if (!response.ok) throw new Error('Failed to fetch polls');
  return response.json();
}