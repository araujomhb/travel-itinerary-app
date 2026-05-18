import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MarkCountryModal from './MarkCountryModal';

describe('MarkCountryModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const destination = 'France';

  it('renders correctly when open', () => {
    render(
      <MarkCountryModal
        isOpen={true}
        onClose={mockOnClose}
        destination={destination}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Mark Destination')).toBeInTheDocument();
    expect(screen.getByText(destination)).toBeInTheDocument();
    expect(screen.getByText('Visited')).toBeInTheDocument();
    expect(screen.getByText('Wish to Go')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <MarkCountryModal
        isOpen={true}
        onClose={mockOnClose}
        destination={destination}
        onSave={mockOnSave}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // The X icon button
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onSave with "visited" and false when "Save Now" is clicked after selecting Visited', async () => {
    render(
      <MarkCountryModal
        isOpen={true}
        onClose={mockOnClose}
        destination={destination}
        onSave={mockOnSave}
      />
    );

    // Default status is "visited"
    const saveNowButton = screen.getByText('Save Now');
    fireEvent.click(saveNowButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('visited', false);
    }, { timeout: 2000 });
  });

  it('calls onSave with "planned" and true when "Add Itinerary Details" is clicked after selecting Wish to Go', async () => {
    render(
      <MarkCountryModal
        isOpen={true}
        onClose={mockOnClose}
        destination={destination}
        onSave={mockOnSave}
      />
    );

    const wishButton = screen.getByText('Wish to Go');
    fireEvent.click(wishButton);

    const addDetailsButton = screen.getByText('Add Itinerary Details');
    fireEvent.click(addDetailsButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('planned', true);
    });
  });
});
