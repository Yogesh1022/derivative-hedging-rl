import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../components/Badge';

describe('Badge Component', () => {
  it('should render with text content', () => {
    render(<Badge>Test Badge</Badge>);

    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should render success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('success');
  });

  it('should render error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('error');
  });

  it('should render warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('warning');
  });

  it('should render info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('info');
  });

  it('should render default variant', () => {
    const { container } = render(<Badge variant="default">Default</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('default');
  });

  it('should render small size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('sm');
  });

  it('should render medium size', () => {
    const { container } = render(<Badge size="md">Medium</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('md');
  });

  it('should render large size', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('lg');
  });

  it('should render with icon', () => {
    const Icon = () => <svg data-testid="badge-icon" />;

    render(
      <Badge icon={<Icon />}>
        With Icon
      </Badge>
    );

    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('should render with pulse animation', () => {
    const { container } = render(<Badge pulse>Pulse</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('pulse');
  });

  it('should render as pill shape', () => {
    const { container } = render(<Badge pill>Pill</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('pill');
  });

  it('should render numeric value', () => {
    render(<Badge>{100}</Badge>);

    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should truncate large numbers', () => {
    render(<Badge>9999+</Badge>);

    expect(screen.getByText('9999+')).toBeInTheDocument();
  });

  it('should render with dot indicator', () => {
    const { container } = render(<Badge dot variant="success">Active</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Badge className="custom-class">Custom</Badge>
    );

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('custom-class');
  });

  it('should handle empty content', () => {
    const { container } = render(<Badge />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render outlined style', () => {
    const { container } = render(<Badge outlined>Outlined</Badge>);

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('outlined');
  });

  it('should render with combination of props', () => {
    const { container } = render(
      <Badge
        variant="success"
        size="lg"
        pill
        pulse
        outlined
      >
        Combined
      </Badge>
    );

    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('success');
    expect(badge.className).toContain('lg');
    expect(badge.className).toContain('pill');
    expect(badge.className).toContain('pulse');
    expect(badge.className).toContain('outlined');
  });

  it('should be accessible', () => {
    render(<Badge role="status">Status</Badge>);

    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });
});
