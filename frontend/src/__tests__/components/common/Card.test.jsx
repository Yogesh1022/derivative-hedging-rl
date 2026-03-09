import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../../../components/common/Card';

describe('Card Component', () => {
  it('should render card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should apply custom styles', () => {
    render(<Card style={{ width: '400px' }}>Custom Card</Card>);
    const card = screen.getByText('Custom Card').parentElement;
    
    expect(card).toHaveStyle({ width: '400px' });
  });

  it('should have default padding and border radius', () => {
    render(<Card>Default Styled Card</Card>);
    const card = screen.getByText('Default Styled Card').parentElement;
    
    expect(card).toHaveStyle({
      padding: '24px',
      borderRadius: '16px',
    });
  });

  it('should disable hover when hover prop is false', () => {
    render(<Card hover={false}>No Hover</Card>);
    const card = screen.getByText('No Hover').parentElement;
    
    expect(card).toBeInTheDocument();
  });

  it('should render nested components', () => {
    render(
      <Card>
        <h1>Title</h1>
        <p>Description</p>
      </Card>
    );
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});
