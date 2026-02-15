import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ScanQRErrorFallback } from './ScanQRErrorFallback';

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
}

/**
 * Catches errors when loading or rendering Scan QR (e.g. expo-camera "unknown module")
 * and shows a friendly fallback instead of the red error screen.
 */
export class ScanQRErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.warn('[ScanQRErrorBoundary]', error?.message ?? error, errorInfo?.componentStack);
	}

	render() {
		if (this.state.hasError) {
			return <ScanQRErrorFallback />;
		}
		return this.props.children;
	}
}
