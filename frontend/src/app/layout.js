import { Suspense } from 'react';
import './globals.css';
import { ConnectionProvider } from '@/context/ConnectionContext';
export const metadata = {
	title: 'P2P Chat',
	description: 'Peer-to-peer encrypted chat application',
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<div className="matrix-bg min-h-screen">
					<Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
						<ConnectionProvider>
							{children}
						</ConnectionProvider>
					</Suspense>
				</div>
			</body>
		</html>
	);
}