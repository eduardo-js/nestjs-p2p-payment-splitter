export default interface IS3Service {
  uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ location: string; key: string }>;

  getFileFromS3(key: string): Promise<Buffer>;

  onModuleInit(): Promise<void>;
}
