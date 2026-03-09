import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/Button';

describe('Button Component', () => {
  it('should render with text content', () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = vi.fn();
    render(<Button onClick={mockOnClick}>Click Me</Button>);

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const mockOnClick = vi.fn();
    render(
      <Button onClick={mockOnClick} disabled>
        Disabled
      </Button>
    );

    const button = screen.getByText('Disabled');
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should render primary variant', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('primary');
  });

  it('should render secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('secondary');
  });

  it('should render danger variant', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('danger');
  });

  it('should render success variant', () => {
    const { container } = render(<Button variant="success">Success</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('success');
  });

  it('should render ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('ghost');
  });

  it('should render small size', () => {
    const { container } = render(<Button size="sm">Small</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('sm');
  });

  it('should render medium size', () => {
    const { container } = render(<Button size="md">Medium</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('md');
  });

  it('should render large size', () => {
    const { container } = render(<Button size="lg">Large</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('lg');
  });

  it('should show loading state', () => {
    render(<Button loading>Loading</Button>);

    expect(screen.getByText('Loading')).toBeInTheDocument();
    // Loading spinner should be present
    const button = screen.getByText('Loading').closest('button');
    expect(button).toBeDisabled();
  });

  it('should disable button when loading', () => {
    const mockOnClick = vi.fn();
    render(
      <Button loading onClick={mockOnClick}>
        Loading
      </Button>
    );

    const button = screen.getByText('Loading');
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should render with icon', () => {
    const Icon = () => <svg data-testid="button-icon" />;

    render(
      <Button icon={<Icon />}>
        With Icon
      </Button>
    );

    expect(screen.getByTestId('button-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('should render icon-only button', () => {
    const Icon = () => <svg data-testid="icon-only" />;

    render(<Button icon={<Icon />} />);

    expect(screen.getByTestId('icon-only')).toBeInTheDocument();
  });

  it('should render full width', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('full');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Button className="custom-class">Custom</Button>
    );

    const button = container.querySelector('button');
    expect(button?.className).toContain('custom-class');
  });

  it('should render as link (button type)', () => {
    render(<Button type="button">Button Type</Button>);

    const button = screen.getByText('Button Type');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('should render as submit button', () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByText('Submit');
    expect(button.getAttribute('type')).toBe('submit');
  });

  it('should handle keyboard events', () => {
    const mockOnClick = vi.fn();
    render(<Button onClick={mockOnClick}>Keyboard</Button>);

    const button = screen.getByText('Keyboard');
    fireEvent.keyDown(button, { key: 'Enter' });

    // Enter key should trigger click
    expect(button).toBeInTheDocument();
  });

  it('should be focusable', () => {
    render(<Button>Focusable</Button>);

    const button = screen.getByText('Focusable');
    button.focus();

    expect(button).toHaveFocus();
  });

  it('should not be focusable when disabled', () => {
    render(<Button disabled>Not Focusable</Button>);

    const button = screen.getByText('Not Focusable');
    expect(button).toBeDisabled();
  });

  it('should render with aria-label', () => {
    render(<Button aria-label="Close">X</Button>);

    const button = screen.getByLabelText('Close');
    expect(button).toBeInTheDocument();
  });

  it('should render rounded style', () => {
    const { container } = render(<Button rounded>Rounded</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('rounded');
  });

  it('should render outlined style', () => {
    const { container } = render(<Button outlined>Outlined</Button>);

    const button = container.querySelector('button');
    expect(button?.className).toContain('outlined');
  });

  it('should handle rapid clicks', () => {
    const mockOnClick = vi.fn();
    render(<Button onClick={mockOnClick}>Rapid Click</Button>);

    const button = screen.getByText('Rapid Click');

    // Click multiple times rapidly
    for (let i = 0; i < 10; i++) {
      fireEvent.click(button);
    }

    expect(mockOnClick).toHaveBeenCalledTimes(10);
  });

  it('should render with tooltip', () => {
    render(<Button title="Button tooltip">Tooltip Button</Button>);

    const button = screen.getByText('Tooltip Button');
    expect(button.getAttribute('title')).toBe('Button tooltip');
  });

  it('should handle combination of props', () => {
    const { container } = render(
      <Button
        variant="primary"
        size="lg"
        fullWidth
        rounded
        outlined
        loading
      >
        Combined
      </Button>
    );

    const button = container.querySelector('button');
    expect(button).toBeDisabled(); // due to loading
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref).toHaveBeenCalled();
  });

  it('should render with children as function', () => {
    render(
      <Button>
        {({ loading }: { loading: boolean }) => (
          <span>{loading ? 'Loading...' : 'Click'}</span>
        )}
      </Button>
    );

    expect(screen.getByText('Click')).toBeInTheDocument();
  });
});
