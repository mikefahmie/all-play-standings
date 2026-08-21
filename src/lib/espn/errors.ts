export class EspnAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EspnAuthError";
  }
}
