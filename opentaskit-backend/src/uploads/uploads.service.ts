import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly isConfigured: boolean = false;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (
      cloudName &&
      apiKey &&
      apiSecret &&
      !apiKey.includes('your_') &&
      !cloudName.includes('your_')
    ) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(`Cloudinary client initialized for cloud: "${cloudName}"`);
    } else {
      this.logger.error(
        'Cloudinary credentials are not properly configured in .env. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }
  }

  /**
   * Upload single or multiple image files to Cloudinary CDN
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'opentaskit/tasks',
  ): Promise<string[]> {
    if (!this.isConfigured) {
      throw new InternalServerErrorException(
        'Cloudinary storage is not configured. Please check your backend .env file.',
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    const uploadPromises = files.map(async (file) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Unsupported file format (${file.mimetype}). Allowed types: JPG, PNG, WEBP, GIF.`,
        );
      }

      // Max 10MB per file
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new BadRequestException(
          `File "${file.originalname}" exceeds the maximum allowed size of 10MB.`,
        );
      }

      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result) {
              this.logger.error('Cloudinary upload error:', error);
              return reject(
                new InternalServerErrorException(
                  `Failed to upload image to Cloudinary: ${error?.message || 'Unknown error'}`,
                ),
              );
            }
            resolve(result.secure_url);
          },
        );

        const stream = new Readable();
        stream.push(file.buffer);
        stream.push(null);
        stream.pipe(uploadStream);
      });
    });

    return Promise.all(uploadPromises);
  }
}
