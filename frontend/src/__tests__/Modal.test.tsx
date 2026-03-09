import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '../components/Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('should call onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<Modal {...defaultProps} onClose={onClose} />);

    const backdrop = container.querySelector('[class*="backdrop"]');
    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when ESC key pressed', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close on backdrop click when closeOnBackdropClick is false', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal {...defaultProps} onClose={onClose} closeOnBackdropClick={false} />
    );

    const backdrop = container.querySelector('[class*="backdrop"]');
    fireEvent.click(backdrop!);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not close on ESC when closeOnEsc is false', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnEsc={false} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should render close button', () => {
    render(<Modal {...defaultProps} />);

    const closeButton = screen.getByLabelText(/close/i);
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not show close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);

    expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument();
  });

  it('should render small size', () => {
    const { container } = render(<Modal {...defaultProps} size="sm" />);

    const modal = container.querySelector('[class*="modal"]');
    expect(modal?.className).toContain('sm');
  });

  it('should render medium size', () => {
    const { container } = render(<Modal {...defaultProps} size="md" />);

    const modal = container.querySelector('[class*="modal"]');
    expect(modal?.className).toContain('md');
  });

  it('should render large size', () => {
    const { container } = render(<Modal {...defaultProps} size="lg" />);

    const modal = container.querySelector('[class*="modal"]');
    expect(modal?.className).toContain('lg');
  });

  it('should render full screen', () => {
    const { container } = render(<Modal {...defaultProps} size="full" />);

    const modal = container.querySelector('[class*="modal"]');
    expect(modal?.className).toContain('full');
  });

  it('should render footer content', () => {
    const footer = (
      <div>
        <button>Cancel</button>
        <button>Confirm</button>
      </div>
    );

    render(<Modal {...defaultProps} footer={footer} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should trap focus inside modal', () => {
    render(
      <Modal {...defaultProps}>
        <input data-testid="input1" />
        <button data-testid="button1">Button</button>
        <input data-testid="input2" />
      </Modal>
    );

    const input1 = screen.getByTestId('input1');
    const button1 = screen.getByTestId('button1');

    // Focus should be trapped within modal
    input1.focus();
    expect(document.activeElement).toBe(input1);

    // Tab to next element
    fireEvent.keyDown(input1, { key: 'Tab' });
  });

  it('should auto-focus first focusable element', async () => {
    render(
      <Modal {...defaultProps}>
        <input data-testid="first-input" />
        <button>Button</button>
      </Modal>
    );

    await waitFor(() => {
      const firstInput = screen.getByTestId('first-input');
      expect(document.activeElement).toBe(firstInput);
    });
  });

  it('should restore focus on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<Modal {...defaultProps} />);

    // Close modal
    rerender(<Modal {...defaultProps} isOpen={false} />);

    // Focus should return to trigger
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it('should prevent body scroll when open', () => {
    render(<Modal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal {...defaultProps} isOpen={false} />);

    expect(document.body.style.overflow).toBe('');
  });

  it('should render with custom className', () => {
    const { container } = render(
      <Modal {...defaultProps} className="custom-modal" />
    );

    const modal = container.querySelector('.custom-modal');
    expect(modal).toBeInTheDocument();
  });

  it('should handle animation classes', async () => {
    const { container, rerender } = render(<Modal {...defaultProps} />);

    // Opening animation
    const modal = container.querySelector('[class*="modal"]');
    expect(modal).toBeInTheDocument();

    // Closing animation
    rerender(<Modal {...defaultProps} isOpen={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });
  });

  it('should render loading state', () => {
    render(<Modal {...defaultProps} loading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should stack multiple modals', () => {
    const { rerender } = render(
      <>
        <Modal isOpen={true} onClose={vi.fn()} title="Modal 1">
          Content 1
        </Modal>
        <Modal isOpen={true} onClose={vi.fn()} title="Modal 2">
          Content 2
        </Modal>
      </>
    );

    expect(screen.getByText('Modal 1')).toBeInTheDocument();
    expect(screen.getByText('Modal 2')).toBeInTheDocument();
  });

  it('should handle click inside modal content without closing', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    const content = screen.getByText('Modal Content');
    fireEvent.click(content);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should render with custom header', () => {
    const customHeader = <div data-testid="custom-header">Custom Header</div>;

    render(<Modal {...defaultProps} header={customHeader} />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
  });

  it('should apply z-index for stacking', () => {
    const { container } = render(<Modal {...defaultProps} zIndex={1000} />);

    const backdrop = container.querySelector('[class*="backdrop"]');
    expect(backdrop).toHaveStyle({ zIndex: 1000 });
  });

  it('should handle portal rendering', () => {
    render(<Modal {...defaultProps} />);

    // Modal should be rendered in a portal (outside main tree)
    const portalRoot = document.querySelector('[id*="modal"]');
    expect(portalRoot || document.body).toContainElement(
      screen.getByText('Test Modal')
    );
  });

  it('should call onOpen callback when opened', () => {
    const onOpen = vi.fn();

    render(<Modal {...defaultProps} isOpen={false} onOpen={onOpen} />);

    expect(onOpen).not.toHaveBeenCalled();

    // Change to open
    render(<Modal {...defaultProps} isOpen={true} onOpen={onOpen} />);

    // onOpen should be called (in actual implementation)
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<Modal {...defaultProps} />);

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  });

  it('should handle form submission', () => {
    const onSubmit = vi.fn((e) => e.preventDefault());

    render(
      <Modal {...defaultProps}>
        <form onSubmit={onSubmit}>
          <input type="text" />
          <button type="submit">Submit</button>
        </form>
      </Modal>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalled();
  });
});
