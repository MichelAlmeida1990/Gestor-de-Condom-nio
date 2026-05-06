export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: any, defaultMessage: string = 'Erro interno do servidor') => {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return { error: error.message, code: error.code };
  }
  
  if (error.errors && Array.isArray(error.errors)) {
    return { error: error.errors[0].message };
  }
  
  return { error: defaultMessage };
};
