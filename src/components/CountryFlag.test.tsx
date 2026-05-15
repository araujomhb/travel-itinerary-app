import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CountryFlag from './CountryFlag';

describe('CountryFlag', () => {
  it('renders a fallback emoji when country name is unknown', async () => {
    await act(async () => {
      render(<CountryFlag countryName="Unknown Country" />);
    });
    expect(screen.getByText('🏳️')).toBeInTheDocument();
  });

  it('renders an image with the correct URL for a known country', async () => {
    await act(async () => {
      render(<CountryFlag countryName="Brazil" />);
    });
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://flagcdn.com/w80/br.png');
    expect(img).toHaveAttribute('alt', 'Flag of Brazil');
  });

  it('applies the correct size classes', async () => {
    const { container: containerSm } = render(<CountryFlag countryName="Brazil" size="sm" />);
    // Re-render isn't strictly needed for class check on the wrapper, but good practice
    const divSm = containerSm.firstChild;
    expect(divSm).toHaveClass('w-6');
    expect(divSm).toHaveClass('h-4');

    const { container: containerLg } = render(<CountryFlag countryName="Brazil" size="lg" />);
    const divLg = containerLg.firstChild;
    expect(divLg).toHaveClass('w-16');
    expect(divLg).toHaveClass('h-11');
  });
});
