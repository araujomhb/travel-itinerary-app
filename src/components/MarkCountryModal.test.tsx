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
    expect(screen.getByText('Wish to Visit')).toBeInTheDocument();
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

  it('calls onSave with "visited" and false when "Save Destination" is clicked after selecting Visited', async () => {
    render(
      <MarkCountryModal
        isOpen={true}
        onClose={mockOnClose}
        destination={destination}
        onSave={mockOnSave}
      />
    );

    // Default status is "visited"
    const saveButton = screen.getByText('Save Destination');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      // The onSave signature is (status, addDetails, details)
      expect(mockOnSave).toHaveBeenCalledWith('visited', false, expect.any(Object));
    }, { timeout: 2000 });
  });

  it('calls onSave with "planned" and true when "Open Full Trip Planner" is clicked after selecting Wish to Visit', async () => {
    render(
      <MarkCountryModal
        isOpen={true}
        onClose={mockOnClose}
        destination={destination}
        onSave={mockOnSave}
      />
    );

    const wishButton = screen.getByText('Wish to Visit');
    fireEvent.click(wishButton);

    const openPlannerButton = screen.getByText('Open Full Trip Planner');
    fireEvent.click(openPlannerButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('planned', true, expect.any(Object));
    });
  });
});
