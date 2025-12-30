export type Result<T> = {
	isSuccess: boolean;
	data?: T;
	error?: string;
	message?: string;
};

export const success = <T>(data?: T, message?: string): Result<T> => ({
	isSuccess: true,
	data,
	message,
});

export const failure = <T>(error: string, message?: string): Result<T> => ({
	isSuccess: false,
	error,
	message,
});


