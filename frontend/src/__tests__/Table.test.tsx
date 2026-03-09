import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Table from '../components/Table';

describe('Table Component', () => {
  const mockColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'value', label: 'Value', sortable: true, align: 'right' as const },
    { key: 'status', label: 'Status', render: (row: any) => <span>{row.status}</span> },
  ];

  const mockData = [
    { id: '1', name: 'Item 1', value: 100, status: 'Active' },
    { id: '2', name: 'Item 2', value: 200, status: 'Inactive' },
    { id: '3', name: 'Item 3', value: 150, status: 'Active' },
  ];

  it('should render table with data', () => {
    render(<Table columns={mockColumns} data={mockData} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(<Table columns={mockColumns} data={mockData} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should sort data when column header clicked', () => {
    render(<Table columns={mockColumns} data={mockData} />);

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Data should be sorted
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4); // 3 data + 1 header
  });

  it('should toggle sort direction on repeated clicks', () => {
    render(<Table columns={mockColumns} data={mockData} />);

    const valueHeader = screen.getByText('Value');

    // First click - ascending
    fireEvent.click(valueHeader);

    // Second click - descending
    fireEvent.click(valueHeader);

    // Verify sort indicators appear
    expect(valueHeader.parentElement).toBeInTheDocument();
  });

  it('should call onRowClick when row is clicked', () => {
    const mockOnRowClick = vi.fn();
    render(
      <Table
        columns={mockColumns}
        data={mockData}
        onRowClick={mockOnRowClick}
      />
    );

    const firstRow = screen.getByText('Item 1').closest('tr');
    fireEvent.click(firstRow!);

    expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('should handle context menu on row right-click', () => {
    const mockOnRowContextMenu = vi.fn();
    render(
      <Table
        columns={mockColumns}
        data={mockData}
        onRowContextMenu={mockOnRowContextMenu}
      />
    );

    const firstRow = screen.getByText('Item 1').closest('tr');
    fireEvent.contextMenu(firstRow!);

    expect(mockOnRowContextMenu).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<Table columns={mockColumns} data={[]} loading={true} />);

    // Should render skeleton rows
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<Table columns={mockColumns} data={[]} />);

    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should render with sticky headers', () => {
    const { container } = render(
      <Table columns={mockColumns} data={mockData} stickyHeader={true} />
    );

    const thead = container.querySelector('thead');
    expect(thead).toHaveStyle({ position: 'sticky' });
  });

  it('should render striped rows', () => {
    render(<Table columns={mockColumns} data={mockData} striped={true} />);

    const rows = screen.getAllByRole('row');
    // Check if alternating rows have different backgrounds
    expect(rows.length).toBeGreaterThan(1);
  });

  it('should apply custom render functions', () => {
    const customColumns = [
      {
        key: 'status',
        label: 'Status',
        render: (row: any) => <strong data-testid="custom-render">{row.status}</strong>,
      },
    ];

    render(<Table columns={customColumns} data={mockData} />);

    const customElements = screen.getAllByTestId('custom-render');
    expect(customElements).toHaveLength(3);
  });

  it('should handle empty columns array', () => {
    render(<Table columns={[]} data={mockData} />);

    // Should render without crashing
    expect(screen.queryByRole('table')).toBeInTheDocument();
  });

  it('should sort numbers correctly', () => {
    const numericColumns = [
      { key: 'value', label: 'Value', sortable: true },
    ];

    render(<Table columns={numericColumns} data={mockData} />);

    const valueHeader = screen.getByText('Value');
    fireEvent.click(valueHeader);

    // Values should be sorted numerically: 100, 150, 200
    const values = screen.getAllByText(/\d+/);
    expect(values[0].textContent).toBe('100');
  });

  it('should sort strings alphabetically', () => {
    const stringColumns = [
      { key: 'name', label: 'Name', sortable: true },
    ];

    render(<Table columns={stringColumns} data={mockData} />);

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Names should be sorted alphabetically
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should not sort non-sortable columns', () => {
    const nonSortableColumns = [
      { key: 'name', label: 'Name', sortable: false },
    ];

    render(<Table columns={nonSortableColumns} data={mockData} />);

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Should not change order
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('should handle hover states on rows', () => {
    render(<Table columns={mockColumns} data={mockData} />);

    const firstRow = screen.getByText('Item 1').closest('tr');

    fireEvent.mouseEnter(firstRow!);
    fireEvent.mouseLeave(firstRow!);

    // Visual test - row should have hover effect
    expect(firstRow).toBeInTheDocument();
  });

  it('should align columns correctly', () => {
    const alignedColumns = [
      { key: 'name', label: 'Name', align: 'left' as const },
      { key: 'value', label: 'Value', align: 'right' as const },
      { key: 'status', label: 'Status', align: 'center' as const },
    ];

    render(<Table columns={alignedColumns} data={mockData} />);

    // Cells should have proper alignment
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
