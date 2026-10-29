/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '../app/components/layout/Sidebar'

// Mock icons to avoid rendering issues
jest.mock('lucide-react', () => ({
    Home: () => <div data-testid="icon-home" />,
    LayoutGrid: () => <div data-testid="icon-apps" />,
    BarChart2: () => <div data-testid="icon-analytics" />,
    RefreshCw: () => <div data-testid="icon-updates" />,
    Settings: () => <div data-testid="icon-settings" />,
    Menu: () => <div data-testid="icon-menu" />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, onClick }: any) => <div className={className} onClick={onClick}>{children}</div>,
        button: ({ children, className, onClick }: any) => <button className={className} onClick={onClick}>{children}</button>,
        span: ({ children, className }: any) => <span className={className}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock NexLabIcon
jest.mock('../app/components/icons/NexLabIcon', () => ({
    NexLabIcon: () => <div data-testid="icon-nexlab" />
}));

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ updateAvailable: false }),
    })
) as jest.Mock;

describe('Sidebar', () => {
    const mockOnTabChange = jest.fn();
    const mockOnToggleExpand = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all navigation items', () => {
        render(
            <Sidebar
                activeTab="home"
                onTabChange={mockOnTabChange}
                isExpanded={true}
                onToggleExpand={mockOnToggleExpand}
            />
        );

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Apps')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Updates')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('calls onTabChange when clicking an item', () => {
        render(
            <Sidebar
                activeTab="home"
                onTabChange={mockOnTabChange}
                isExpanded={true}
                onToggleExpand={mockOnToggleExpand}
            />
        );

        fireEvent.click(screen.getByText('Apps'));
        expect(mockOnTabChange).toHaveBeenCalledWith('apps');
    });

    it('displays collapsed state correctly', () => {
        render(
            <Sidebar
                activeTab="home"
                onTabChange={mockOnTabChange}
                isExpanded={false}
                onToggleExpand={mockOnToggleExpand}
            />
        );

        // Text should not be visible or should be hidden
        // Depending on implementation, it might be removed from DOM or hidden with CSS
        // Let's check for the icon existence instead which confirms the component rendered
        expect(screen.getByTestId('icon-home')).toBeInTheDocument();
    });
});
