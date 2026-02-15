export { Result, success, failure } from './Result';
export { Http, initHttpClient, getHttp } from './Http';
export { getHttpClient } from './HttpClient';
export { Storage } from './Storage';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

function sanitizeDisplayMessage(msg: string): string {
	if (!msg || typeof msg !== 'string') return GENERIC_ERROR;
	const s = msg.trim();
	// Never show raw API/HTTP or JSON to the user
	if (/HTTP (GET|POST|PUT|PATCH|DELETE) Error/i.test(s)) return GENERIC_ERROR;
	if (s.startsWith('{') && s.includes('"error"')) return GENERIC_ERROR;
	return msg;
}

// Simple message display functions (can be replaced with toast library)
export const showErrorMessage = (message: string) => {
	// In production, never show API or technical error messages
	const safe = !__DEV__ ? GENERIC_ERROR : sanitizeDisplayMessage(message);
	alert(safe);
};

export const showSuccessMessage = (message: string) => {
	console.log('Success:', message);
	// In a real app, you'd use a toast library like react-native-flash-message
	alert(message);
};


