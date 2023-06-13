export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors: any[] = []
  ) {
    super(message);
    (this.status = status), (this.errors = errors);
  }

  public static BadRequest(message: string, errors: any[] = []) {
    return new ApiError(400, message, errors);
  }
}
