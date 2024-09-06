'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchPoll, submitVote } from '../services/api';
import { Poll, Option } from '../types';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';

export default function VotingInterface({ pollId }: { pollId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);

  useEffect(() => {
    if (poll) {
      const timer = setTimeout(() => setAnimate(true), 100);
      return () => clearTimeout(timer);
    }
  }, [poll]);

  const loadPoll = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPoll(pollId);
      setPoll(data);
      setAllowMultipleAnswers(data.allowMultipleAnswers);
      setError(null);
    } catch (error) {
      setError('Failed to load poll');
      setPoll(null);
    } finally {
      setIsLoading(false);
    }
  }, [pollId]);

  const sortedOptions = useMemo(() => {
    if (!poll) return [];
    return [...poll.options].sort((a, b) => b.voteCount - a.voteCount);
  }, [poll]);

  useEffect(() => {
    loadPoll();
    const storedImage = localStorage.getItem(`pollImage_${pollId}`);
    if (storedImage) {
      setHeaderImage(storedImage);
    }
  }, [loadPoll, pollId]);

  const handleOptionChange = (optionId: number) => {
    if (allowMultipleAnswers) {
      setSelectedOptions(prev => 
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) return;
    try {
      for (const optionId of selectedOptions) {
        await submitVote(pollId, optionId, voterName || null);
      }
      setHasVoted(true);
      setPoll((currentPoll) => {
        if (!currentPoll) return null;
        return {
          ...currentPoll,
          options: currentPoll.options.map((option) => 
            selectedOptions.includes(option.id)
              ? { 
                  ...option, 
                  voteCount: option.voteCount + 1, 
                  votes: [...option.votes, { id: Date.now(), voterName: voterName || 'Anonymous' }] 
                }
              : option
          ),
        };
      });
      setSelectedOptions([]);
      setVoterName('');
    } catch (error) {
      setError('Failed to submit vote');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!poll || !poll.options) return <div className="text-center p-4">No poll data available</div>;

  const totalVotes = poll.options.reduce((sum, option) => sum + option.voteCount, 0);

  return (
    <div className="mt-8 p-4 bg-white rounded-lg shadow-md max-w-md mx-auto">
      {headerImage && (
        <div className="mb-4">
          <Image
            src={headerImage}
            alt="Poll header"
            width={400}
            height={200}
            className="w-full h-40 object-cover rounded-md"
          />
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{poll.question}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {poll.allowMultipleAnswers ? "You can select multiple options" : "Select one option"}
      </p>
      {sortedOptions.map((option: Option) => (
        <div key={option.id} className="mb-2">
          <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded transition-colors">
            <input
              type={poll.allowMultipleAnswers ? "checkbox" : "radio"}
              id={`option-${option.id}`}
              name="poll-option"
              value={option.id}
              checked={selectedOptions.includes(option.id)}
              onChange={() => handleOptionChange(option.id)}
              disabled={hasVoted}
              className={poll.allowMultipleAnswers ? "form-checkbox text-blue-600" : "form-radio text-blue-600"}
            />
            <label htmlFor={`option-${option.id}`} className="text-gray-700 flex-grow">
              {option.text}
            </label>
            <span className="font-semibold text-gray-600">
              {option.voteCount} votes ({totalVotes > 0 ? ((option.voteCount / totalVotes) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000 ease-out"
              style={{ 
                width: animate ? `${(option.voteCount / totalVotes) * 100}%` : '0%'
              }}
            ></div>
          </div>
          {option.votes && option.votes.length > 0 && (
            <div className="mt-1">
              <p className="text-xs text-gray-500">Voters: {option.votes.map(vote => vote.voterName).join(', ')}</p>
            </div>
          )}
        </div>
      ))}
      {!hasVoted && (
        <>
          <label htmlFor="voterName" className="block text-sm font-medium text-gray-700 mb-1 mt-4">
            Your Name (optional)
          </label>
          <input
            type="text"
            id="voterName"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your name"
          />
        </>
      )}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={handleVote}
          disabled={selectedOptions.length === 0 || hasVoted}
          className="flex-grow bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
        >
          {hasVoted ? 'Voted' : 'Vote'}
        </button>
        {hasVoted && (
          <button
            onClick={loadPoll}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
          >
            Refresh Results
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-gray-600">Total votes: {totalVotes}</p>
    </div>
  );
}