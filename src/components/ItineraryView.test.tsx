import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ItineraryView from './ItineraryView';
import { ItineraryItem } from '@/lib/db';

describe('ItineraryView', () => {
  const mockDays = [
    new Date('2026-05-15T00:00:00'),
    new Date('2026-05-16T00:00:00'),
  ];

  const mockItems: ItineraryItem[] = [
    {
      id: '1',
      tripId: 'trip1',
      date: new Date('2026-05-15T00:00:00'),
      time: '10:00',
      description: 'Visit Eiffel Tower',
      location: 'Paris',
    },
  ];

  const mockOnAddClick = vi.fn();

  it('renders days correctly', () => {
    render(<ItineraryView days={mockDays} items={[]} onAddClick={mockOnAddClick} />);
    expect(screen.getByText(/Friday, May 15/i)).toBeInTheDocument();
    expect(screen.getByText(/Saturday, May 16/i)).toBeInTheDocument();
  });

  it('renders itinerary items for the correct days', () => {
    render(<ItineraryView days={mockDays} items={mockItems} onAddClick={mockOnAddClick} />);
    expect(screen.getByText('Visit Eiffel Tower')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  it('renders "Nothing planned" when no items exist for a day', () => {
    render(<ItineraryView days={[mockDays[1]]} items={[]} onAddClick={mockOnAddClick} />);
    expect(screen.getByText(/Nothing planned for this day/i)).toBeInTheDocument();
  });

  it('calls onAddClick when "+ Add activity" is clicked', () => {
    render(<ItineraryView days={[mockDays[1]]} items={[]} onAddClick={mockOnAddClick} />);
    const addButton = screen.getByText(/\+ Add activity/i);
    fireEvent.click(addButton);
    expect(mockOnAddClick).toHaveBeenCalledTimes(1);
  });
});
