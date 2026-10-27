import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { MAX_IMAGE_BYTES, processPhoto } from '../src/photos.js'

const asData = (bytes, type = 'jpeg') => `data:image/${type};base64,${bytes.toString('base64')}`
const raster = (width = 80, height = 60) => sharp({ create: { width, height, channels: 3, background: '#426536' } })

test('decodes pixels, corrects orientation, limits dimensions and removes private metadata/trailing data', async () => {
  const original = await raster(2000, 1000).withMetadata({ orientation: 6 }).withExif({ IFD0: { Artist: 'private-person', Copyright: 'private-location' } }).jpeg().toBuffer()
  const photo = await processPhoto(asData(Buffer.concat([original, Buffer.from('<script>never-store-this</script>')])))
  const meta = await sharp(photo.data).metadata()
  assert.equal(meta.format, 'webp')
  assert.equal(meta.width, 800)
  assert.equal(meta.height, 1600)
  assert.equal(meta.orientation, undefined)
  assert.equal(meta.exif, undefined)
  assert.equal(meta.xmp, undefined)
  assert.equal(meta.icc, undefined)
  assert.equal(photo.data.includes(Buffer.from('never-store-this')), false)
  assert.equal(photo.data.includes(Buffer.from('private-person')), false)
})

test('accepts exactly 2 MiB, rejects larger, corrupt, mislabeled and non-canonical data', async () => {
  const jpeg = await raster().jpeg().toBuffer()
  const exact = Buffer.concat([jpeg, Buffer.alloc(MAX_IMAGE_BYTES - jpeg.length)])
  assert.ok((await processPhoto(asData(exact))).size > 0)
  for (const value of [asData(Buffer.concat([exact, Buffer.from([0])])), asData(jpeg.subarray(0, 30)), asData(jpeg, 'png'), asData(Buffer.from('<svg/>'), 'png'), asData(jpeg) + '=', '']) {
    await assert.rejects(() => processPhoto(value), error => error.status === 422 && Boolean(error.fields.photos))
  }
})

test('rejects decompression bombs and animated images', async () => {
  const tooManyPixels = await raster(6000, 4001).png().toBuffer()
  await assert.rejects(() => processPhoto(asData(tooManyPixels, 'png')), error => error.status === 422)
  const pixels = Buffer.from([255, 0, 0, 0, 255, 0])
  const animated = await sharp(pixels, { raw: { width: 1, height: 2, channels: 3, pageHeight: 1 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer()
  assert.equal((await sharp(animated).metadata()).pages, 2)
  await assert.rejects(() => processPhoto(asData(animated, 'webp')), error => error.status === 422)
})
