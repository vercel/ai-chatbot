import { ERRORS } from './errors';

export function successResponse(data: any) {
  return Response.json({ data, error: null }, { status: 200 });
}

export function errorResponse(
  error: { type: string; message: string },
  status: number,
) {
  return Response.json({ data: null, error }, { status });
}

export const apiErrors = {
  missingParameter: () => errorResponse(ERRORS.MISSING_PARAMETER, 400),
  unauthorized: () => errorResponse(ERRORS.UNAUTHORIZED, 401),
  documentNotFound: () => errorResponse(ERRORS.DOCUMENT_NOT_FOUND, 404),
  documentForbidden: () => errorResponse(ERRORS.DOCUMENT_FORBIDDEN, 403),
};
