import { Request, Response } from 'express';
import { ValidationError } from 'joi';
import { ApiResponse, ErrorResponse } from '@shared/types/response.types';

export abstract class BaseController {
  protected sendSuccessResponse<T>(
    res: Response, 
    data: T, 
    message: string, 
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      data,
      message,
      status: 'success'
    };
    res.status(statusCode).json(response);
  }

  protected sendErrorResponse(
    res: Response,
    message: string,
    errorCode: string,
    statusCode: number = 400,
    details?: string[]
  ): void {
    const errorResponse: ErrorResponse = {
      data: null,
      message,
      status: 'error',
      error: {
        code: errorCode,
        ...(details && { details })
      }
    };
    res.status(statusCode).json(errorResponse);
  }

  protected handleValidationError(
    res: Response,
    error: ValidationError
  ): void {
    const details = error.details.map(detail => detail.message);
    this.sendErrorResponse(
      res,
      'Datos de entrada inválidos',
      'VALIDATION_ERROR',
      400,
      details
    );
  }

  protected handleQueryValidationError(
    res: Response,
    error: ValidationError
  ): void {
    const details = error.details.map(detail => detail.message);
    this.sendErrorResponse(
      res,
      'Parámetros de consulta inválidos',
      'QUERY_VALIDATION_ERROR',
      400,
      details
    );
  }

  protected handleServiceError(
    res: Response,
    error: Error,
    defaultMessage: string = 'Error interno del servidor'
  ): void {
    const message = error.message || defaultMessage;
    this.sendErrorResponse(
      res,
      message,
      'SERVICE_ERROR',
      500
    );
  }

  protected validateRequiredParam(
    res: Response,
    param: any,
    paramName: string
  ): boolean {
    if (!param) {
      this.sendErrorResponse(
        res,
        `${paramName} es requerido`,
        `MISSING_${paramName.toUpperCase()}`
      );
      return false;
    }
    return true;
  }

  protected validateRequiredBody(
    res: Response,
    body: any,
    fieldName: string
  ): boolean {
    if (!body || !body[fieldName]) {
      this.sendErrorResponse(
        res,
        `${fieldName} es requerido`,
        `MISSING_${fieldName.toUpperCase()}`
      );
      return false;
    }
    return true;
  }
} 