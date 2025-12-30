export { Result, success, failure } from './Result';
export { Http, initHttpClient, getHttp } from './Http';
export { getHttpClient } from './HttpClient';
export { Storage } from './Storage';

// Simple message display functions (can be replaced with toast library)
export const showErrorMessage = (message: string) => {
	console.error('Error:', message);
	// In a real app, you'd use a toast library like react-native-flash-message
	alert(message);
};

export const showSuccessMessage = (message: string) => {
	console.log('Success:', message);
	// In a real app, you'd use a toast library like react-native-flash-message
	alert(message);
};


