// Mongoose duplicate-key errors are plain objects with a numeric `code`, not
// a typed Error subclass — `catch` variables are `unknown` under strict
// mode, so this narrows without an `any` escape hatch at every call site.
export function isDuplicateKeyError(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 11000
}
