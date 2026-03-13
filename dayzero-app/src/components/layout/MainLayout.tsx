import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../common/ToastContainer';

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#FFFFFF', // Setting main area background to white as sidebar is F9FAFB
            fontFamily: 'Pretendard, -apple-system, sans-serif',
            display: 'flex',
        }}>
            <Sidebar />
            <ToastContainer />

            <main style={{
                flex: 1,
                marginLeft: '280px', // width of the sidebar
                padding: '48px 64px',
                minWidth: 0, // prevents flex item from overflowing
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
