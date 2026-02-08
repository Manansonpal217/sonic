export interface UpdateLocationApiParams {
	latitude: number;
	longitude: number;
	address?: string;
}

export interface UpdateLocationApiResponse {
	message: string;
	session: any;
}
