export const utils = {
	emailRegex: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	phoneNoRegexNoSpace: () => /^[0-9]{10}$/,
	get: () => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
};
