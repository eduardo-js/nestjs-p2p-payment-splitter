export default class ExpenseUploadEvent {
  constructor(
    public readonly file: Express.Multer.File,
    public readonly folder: string,
  ) {}
}
