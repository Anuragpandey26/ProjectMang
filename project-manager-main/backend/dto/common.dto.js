export class ApiResponse {
  constructor(success, message, data = null) {
    this.success = success;
    this.message = message;
    if (data) this.data = data;
  }
}

export class ErrorResponse {
  constructor(message, statusCode, errors = null) {
    this.success = false;
    this.message = message;
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
  }
}
