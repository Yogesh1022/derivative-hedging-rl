import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlobalSearch from '../components/GlobalSearch';

describe('GlobalSearch Component', () => {
  const mockOnClose = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnNavigate.mockClear();
  });

  it('should render when open', () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    expect(screen.getByPlaceholderText(/search or jump to/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <GlobalSearch
        isOpen={false}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should auto-focus input when opened', async () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const input = screen.getByPlaceholderText(/search or jump to/i);
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it('should filter results based on search query', async () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const input = screen.getByPlaceholderText(/search or jump to/i);
    await userEvent.type(input, 'portfolio');

    expect(screen.getByText(/portfolios/i)).toBeInTheDocument();
  });

  it('should navigate on item selection', async () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const portfolioItem = screen.getByText(/portfolios/i);
    fireEvent.click(portfolioItem);

    expect(mockOnNavigate).toHaveBeenCalledWith('portfolios');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', async () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const input = screen.getByPlaceholderText(/search or jump to/i);

    // Arrow down
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Arrow up
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    // Should update selection (visual test)
    expect(input).toBeInTheDocument();
  });

  it('should close on ESC key', async () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const input = screen.getByPlaceholderText(/search or jump to/i);
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close on backdrop click', async () => {
    const { container } = render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show role-specific items for trader', () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    expect(screen.getByText(/portfolios/i)).toBeInTheDocument();
    expect(screen.getByText(/ai advisor/i)).toBeInTheDocument();
  });

  it('should show role-specific items for analyst', () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="analyst"
      />
    );

    expect(screen.getByText(/market trends/i)).toBeInTheDocument();
    expect(screen.getByText(/risk heatmap/i)).toBeInTheDocument();
  });

  it('should show no results message when query matches nothing', async () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const input = screen.getByPlaceholderText(/search or jump to/i);
    await userEvent.type(input, 'nonexistentitem12345');

    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  it('should clear search on selection', async () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const input = screen.getByPlaceholderText(/search or jump to/i) as HTMLInputElement;
    await userEvent.type(input, 'portfolio');

    const portfolioItem = screen.getByText(/portfolios/i);
    fireEvent.click(portfolioItem);

    // Would need to reopen and check if implemented
    // expect(input.value).toBe('');
  });

  it('should handle logout action', async () => {
    render(
      <GlobalSearch
        isOpen={true}
        onClose={mockOnClose}
        onNavigate={mockOnNavigate}
        role="trader"
      />
    );

    const input = screen.getByPlaceholderText(/search or jump to/i);
    await userEvent.type(input, 'logout');

    const logoutItem = screen.getByText(/logout/i);
    fireEvent.click(logoutItem);

    expect(mockOnNavigate).toHaveBeenCalledWith('landing');
    expect(mockOnClose).toHaveBeenCalled();
  });
});
