// lib/b2.ts — Backblaze B2 via S3-compatible API. Nunca importar no cliente.
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomBytes } from 'crypto'

export const b2Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT!,
  region: process.env.B2_REGION ?? 'auto',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
})

// Upload de buffer direto → B2. Retorna a object key (não a URL).
export async function uploadImageBuffer(
  buffer: Buffer,
  userId: string,
  mimeType = 'image/png',
): Promise<string> {
  const ext = mimeType.includes('jpeg') ? 'jpg' : (mimeType.split('/')[1] ?? 'png')
  const key = `images/${userId}/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`

  await b2Client.send(new PutObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }))

  return key
}

// Gera presigned URL válida por 1h. Usada server-side — nunca expõe credentials ao cliente.
export async function getPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(
    b2Client,
    new GetObjectCommand({ Bucket: process.env.B2_BUCKET_NAME!, Key: key }),
    { expiresIn: 3600 },
  )
}

// Resolve storage_path para URL exibível:
// - URL direta (http) → retorna como está (fallback de temp URLs)
// - key B2 → gera presigned URL
export async function resolveImageUrl(storagePath: string): Promise<string> {
  if (storagePath.startsWith('http')) return storagePath
  return getPresignedUrl(storagePath)
}
