import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const server = vi.hoisted(() => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/time-capsule/server', () => server)

import { POST } from '@/app/api/community/media/route'
import { MAX_MULTIPART_UPLOAD_SIZE } from '@/lib/validations/upload'

function makeClient(insertResult: { data: Record<string, unknown> | null; error: Error | null } = { data: { id: 1, object_path: 'images/id.png' }, error: null }) {
  const remove = vi.fn().mockResolvedValue({ error: null })
  const upload = vi.fn().mockResolvedValue({ error: null })
  const single = vi.fn().mockResolvedValue(insertResult)
  const client = {
    storage: { from: vi.fn(() => ({ upload, remove, getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/media' } }) })) },
    from: vi.fn(() => ({ insert: vi.fn(() => ({ select: vi.fn(() => ({ single })) })) })),
  }
  server.createServiceClient.mockReturnValue(client)
  return { client, upload, remove, single }
}

// 本物の PNG 構造（シグネチャ + IHDR + IEND）を持つ実内容
const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // signature
  0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, // length + 'IHDR'
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0, 0, 0, 0, 0, // IHDR data + CRC
  0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82, // length + 'IEND' + CRC
])

// PNG シグネチャだけを持ち、IHDR / IEND を持たない偽装内容
const FAKE_PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xff, 0xff, 0xff,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
])

// 実内容 video/mp4（サイズ整合するトップレベルボックス: ftyp + mdat）
const MP4_BYTES = Uint8Array.from([
  0, 0, 0, 32, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, // size=32, 'ftyp', brand 'isom'
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // ftyp payload 16 bytes
  0, 0, 0, 8, 0x6d, 0x64, 0x61, 0x74, // size=8, 'mdat' (payload 0)
])

function request(fields: Record<string, string>, file?: File) {
  const body = new FormData()
  Object.entries(fields).forEach(([key, value]) => body.set(key, value))
  if (file) body.set('file', file)
  return { formData: async () => body } as unknown as NextRequest
}

// テスト用 File は PNG のマジックナンバーを持つ実内容にする
function pngFile(name = 'cake.png'): File {
  return new File([PNG_BYTES], name, { type: 'image/png' })
}

beforeEach(() => vi.resetAllMocks())

describe('POST /api/community/media', () => {
  it('validates before creating a service client', async () => {
    makeClient()
    const response = await POST(request({ sender: '花子' }, new File(['x'], 'bad.exe', { type: 'application/octet-stream' })))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('uploads and inserts media, returning its public URL', async () => {
    const { client, upload } = makeClient()
    const response = await POST(request({ sender: '花子', description: 'ケーキ' }, pngFile()))

    expect(response.status).toBe(201)
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^images\//), expect.any(File), { contentType: 'image/png', upsert: false })
    expect(client.from).toHaveBeenCalledWith('media_submissions')
    await expect(response.json()).resolves.toEqual({ data: expect.objectContaining({ id: 1, media_url: 'https://example.com/media' }) })
  })

  it('rejects files above the multipart threshold before creating a service client', async () => {
    makeClient()
    const file = new File([new Uint8Array(MAX_MULTIPART_UPLOAD_SIZE + 1)], 'large.png', { type: 'image/png' })

    const response = await POST(request({ sender: '花子' }, file))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('uses the inspected content type for path, upload, and metadata when declaration differs', async () => {
    const { client, upload } = makeClient()
    // PNG と宣言して video/mp4 の実内容を送るケース
    const file = new File([MP4_BYTES], 'cake.png', { type: 'image/png' })

    const response = await POST(request({ sender: '花子' }, file))

    expect(response.status).toBe(201)
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^videos\/.+\.mp4$/), expect.any(File), { contentType: 'video/mp4', upsert: false })
    expect(client.from).toHaveBeenCalledWith('media_submissions')
    await expect(response.json()).resolves.toEqual({ data: expect.objectContaining({ id: 1, media_url: 'https://example.com/media' }) })
  })

  it('rejects files whose declared type is allowlisted but content is not inspected media', async () => {
    makeClient()
    // 拡張子 .png・宣言 image/png だが実内容は実行形式バイナリ
    const file = new File([Uint8Array.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00])], 'evil.png', { type: 'image/png' })

    const response = await POST(request({ sender: '花子' }, file))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects content that only carries the declared signature without a valid container', async () => {
    makeClient()
    // PNG シグネチャだけを持ち、IHDR / IEND を持たない偽装内容は不正として扱う
    const file = new File([FAKE_PNG_BYTES], 'fake.png', { type: 'image/png' })

    const response = await POST(request({ sender: '花子' }, file))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects truncated video content that only carries the ftyp signature', async () => {
    makeClient()
    // ftyp だけを持ち mdat / moov を持たない内容は不正として扱う
    const truncated = MP4_BYTES.slice(0, 32)
    const file = new File([truncated], 'clip.mp4', { type: 'video/mp4' })

    const response = await POST(request({ sender: '花子' }, file))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('rejects content whose box sizes are inconsistent with the payload length', async () => {
    makeClient()
    // ftyp + mdat を含むが、ボックスの size が実際のバイト列と整合しない内容は不正として扱う
    const malformed = Uint8Array.from([
      0, 0, 0, 99, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, // size=99 は実長と不一致
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 8, 0x6d, 0x64, 0x61, 0x74,
    ])
    const file = new File([malformed], 'clip.mp4', { type: 'video/mp4' })

    const response = await POST(request({ sender: '花子' }, file))

    expect(response.status).toBe(400)
    expect(server.createServiceClient).not.toHaveBeenCalled()
  })

  it('returns a safe error when storage upload fails without cleanup', async () => {
    const { upload, remove } = makeClient()
    upload.mockResolvedValueOnce({ error: new Error('upload failed') })

    const response = await POST(request({ sender: '花子' }, pngFile()))

    expect(response.status).toBe(500)
    expect(remove).not.toHaveBeenCalled()
  })

  it('cleans up after a definite metadata insert failure', async () => {
    const insertError = new Error('insert failed')
    const { upload, remove } = makeClient({ data: null, error: insertError })
    const response = await POST(request({ sender: '花子' }, pngFile()))

    expect(response.status).toBe(500)
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0][0]])
  })

  it('does not clean up when metadata transport rejects', async () => {
    const { client, remove } = makeClient()
    client.from.mockImplementation(() => ({ insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockRejectedValue(new Error('transport')) })) })) }))
    const response = await POST(request({ sender: '花子' }, pngFile()))

    expect(response.status).toBe(500)
    expect(remove).not.toHaveBeenCalled()
  })

  it('does not clean up when the metadata response is unusable', async () => {
    const { remove } = makeClient({ data: null, error: null })
    const response = await POST(request({ sender: '花子' }, pngFile()))

    expect(response.status).toBe(500)
    expect(remove).not.toHaveBeenCalled()
  })
})

