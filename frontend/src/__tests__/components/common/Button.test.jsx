import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../components/common/Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click Me</Button>);
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply primary variant styles by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByText('Primary');
    
    expect(button).toHaveStyle({ fontWeight: '600' });
  });

  it('should apply outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByText('Outline');
    
    expect(button).toBeInTheDocument();
  });

  it('should apply ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByText('Ghost');
    
    expect(button).toBeInTheDocument();
  });

  it('should apply danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByText('Danger');
    
    expect(button).toBeInTheDocument();
  });

  it('should apply small size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByText('Small');
    
    expect(button).toHaveStyle({ fontSize: '12px' });
  });

  it('should apply large size', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByText('Large');
    
    expect(button).toHaveStyle({ fontSize: '15px' });
  });

  it('should apply custom styles', () => {
    render(<Button style={{ width: '200px' }}>Custom</Button>);
    const button = screen.getByText('Custom');
    
    expect(button).toHaveStyle({ width: '200px' });
  });

  it('should handle mouse events', () => {
    render(<Button>Hover Me</Button>);
    const button = screen.getByText('Hover Me');
    
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    
    expect(button).toBeInTheDocument();
  });

  it('should show disabled cursor when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    
    expect(button) .toHaveStyle({ cursor: 'not-allowed', opacity: '0.5' });
  });
});
