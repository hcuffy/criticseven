import {NextFunction, Request, Response} from 'express'

/*
 * Secrets travel in upstream request URLs (TMDB api_key is a query param),
 * so anything derived from an error — message, stack, config — is scrubbed
 * before it reaches the server log.
 */
function redactSecrets(text: string): string {
	return text.replace(/api_key=[^&\s'"]+/g, 'api_key=REDACTED')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: Error, request: Request, response: Response, next: NextFunction) {
	const isProduction = process.env.NODE_ENV === 'production'

	console.error(
		`[error] ${request.method} ${request.path}:`,
		redactSecrets(error.message),
		isProduction ? '' : `\n${redactSecrets(error.stack ?? '')}`
	)

	response.status(500).json({
		error: {
			code: 'INTERNAL_ERROR',
			message: isProduction ? 'Internal server error' : redactSecrets(error.message)
		}
	})
}
