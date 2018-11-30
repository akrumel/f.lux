

export default function isPrimitive(v) {
	return v === null ||
		v === undefined ||
		typeof v === 'number' ||
		typeof v === 'string' ||
		typeof v === 'boolean' ||
		typeof v === 'number' ||
		v instanceof Date;
}