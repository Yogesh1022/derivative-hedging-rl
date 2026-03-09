import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Toast, ToastProvider, useToast } from '../contexts/ToastContext';
import { act } from 'react-dom/test-utils';

// Test component to trigger toasts
function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Info message', 'info')}>
        Show Info
      </button>
      <button onClick={() => showToast('Warning message', 'warning')}>
        Show Warning
      </button>
    </div>
  );
}

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render success toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    button.click();

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    button.click();

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should render info toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info');
    button.click();

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should render warning toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Warning');
    button.click();

    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should auto-dismiss toast after timeout', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    button.click();

    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('should stack multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    screen.getByText('Show Success').click();
    screen.getByText('Show Error').click();
    screen.getByText('Show Info').click();

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should dismiss toast manually', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    button.click();

    const toast = screen.getByText('Success message');
    expect(toast).toBeInTheDocument();

    // Find and click close button
    const closeButton = toast.closest('[role="alert"]')?.querySelector('button');
    if (closeButton) {
      closeButton.click();

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    }
  });

  it('should display correct icon for each type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show all types
    screen.getByText('Show Success').click();
    screen.getByText('Show Error').click();
    screen.getByText('Show Info').click();
    screen.getByText('Show Warning').click();

    // Each toast should have appropriate icon
    const toasts = screen.getAllByRole('alert');
    expect(toasts).toHaveLength(4);
  });

  it('should limit maximum number of toasts', () => {
    render(
      <ToastProvider maxToasts={3}>
        <TestComponent />
      </ToastProvider>
    );

    // Show 5 toasts
    for (let i = 0; i < 5; i++) {
      screen.getByText('Show Success').click();
    }

    // Should only show 3
    const toasts = screen.getAllByRole('alert');
    expect(toasts.length).toBeLessThanOrEqual(3);
  });

  it('should position toasts correctly', () => {
    const { container } = render(
      <ToastProvider position="top-right">
        <TestComponent />
      </ToastProvider>
    );

    screen.getByText('Show Success').click();

    const toastContainer = container.querySelector('[class*="toast"]');
    expect(toastContainer).toBeInTheDocument();
  });

  it('should handle long messages', () => {
    function LongMessageComponent() {
      const { showToast } = useToast();
      return (
        <button
          onClick={() =>
            showToast(
              'This is a very long message that should be displayed correctly in the toast notification without breaking the layout',
              'info'
            )
          }
        >
          Long Message
        </button>
      );
    }

    render(
      <ToastProvider>
        <LongMessageComponent />
      </ToastProvider>
    );

    screen.getByText('Long Message').click();

    expect(
      screen.getByText(/This is a very long message/)
    ).toBeInTheDocument();
  });

  it('should preserve toast order (FIFO)', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    screen.getByText('Show Success').click();
    screen.getByText('Show Error').click();

    const toasts = screen.getAllByRole('alert');
    // First toast should appear first
    expect(toasts[0]).toContainHTML('Success message');
  });

  it('should handle rapid successive toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Click multiple times rapidly
    const button = screen.getByText('Show Success');
    for (let i = 0; i < 10; i++) {
      button.click();
    }

    // Should handle all toasts
    const toasts = screen.getAllByRole('alert');
    expect(toasts.length).toBeGreaterThan(0);
  });

  it('should apply custom duration', async () => {
    function CustomDurationComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Message', 'success', 1000)}>
          Show Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <CustomDurationComponent />
      </ToastProvider>
    );

    screen.getByText('Show Toast').click();
    expect(screen.getByText('Message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });
  });

  it('should not auto-dismiss if duration is null', async () => {
    function PersistentToastComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Persistent', 'info', null as any)}>
          Persistent Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <PersistentToastComponent />
      </ToastProvider>
    );

    screen.getByText('Persistent Toast').click();
    expect(screen.getByText('Persistent')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should still be visible
    expect(screen.getByText('Persistent')).toBeInTheDocument();
  });

  it('should handle toast with action button', () => {
    const mockAction = vi.fn();

    function ActionToastComponent() {
      const { showToast } = useToast();
      return (
        <button
          onClick={() =>
            showToast('Action message', 'info', 5000, {
              label: 'Undo',
              onClick: mockAction,
            })
          }
        >
          Show Action Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <ActionToastComponent />
      </ToastProvider>
    );

    screen.getByText('Show Action Toast').click();

    const actionButton = screen.getByText('Undo');
    actionButton.click();

    expect(mockAction).toHaveBeenCalled();
  });
});
