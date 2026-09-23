import React, { useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'

const MAX_DIMENSION = 900
const WEBP_QUALITY = 0.82

/** Client-side resize + WebP compression, so a base64 data URL comfortably fits the
 * draft's ~2MB budget before it ever reaches the network. */
function compressToWebp(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That does not look like a valid image'))
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Image processing is not supported on this device'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/webp', WEBP_QUALITY))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function PhotoUploadField({
  value,
  onChange,
}: {
  value: string
  onChange: (dataUrl: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose a JPEG or PNG image')
      return
    }
    setBusy(true)
    setError('')
    try {
      const dataUrl = await compressToWebp(file)
      onChange(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process that photo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-royal-gold/30 bg-white/5 p-4">
      <p className="font-medium text-elite-text">Profile Picture</p>
      <p className="mt-1 text-sm text-elite-muted">JPEG or PNG — resized and compressed automatically</p>

      {value ? (
        <div className="mt-3 flex items-center gap-3">
          <img src={value} alt="Profile preview" className="h-16 w-16 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-elite-muted transition-colors hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      ) : (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-royal-gold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span className="text-sm">{busy ? 'Processing…' : 'Choose a photo'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
