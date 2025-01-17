export default interface IFileService {
  uploadFile(
    file: Express.Multer.File,
    folder: string,
    service: string,
  ): Promise<{ location: string; key: string }>;

  getFile(fileUrl: string, service: string): Promise<Buffer>;
}
