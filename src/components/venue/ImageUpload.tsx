import { useRef, useState } from 'react'

interface Props {
  onUpload: (file: File) => Promise<void>
  currentUrl?: string | null
  label?: string
}

export default function ImageUpload({ onUpload, currentUrl, label = 'Upload billede' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      style={{
        border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--r)', padding: preview ? 0 : 32,
        cursor: 'pointer', textAlign: 'center', position: 'relative',
        background: dragOver ? 'rgba(212,100,10,0.05)' : 'var(--surface2)',
        overflow: 'hidden', minHeight: 120,
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {preview ? (
        <img src={preview} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div>
          <p style={{ fontSize: 24, marginBottom: 8 }}>&#128247;</p>
          <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>{label}</p>
          <p style={{ color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: 11, marginTop: 4 }}>
            Klik eller træk fil hertil
          </p>
        </div>
      )}
      {uploading && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(14,12,9,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif', fontSize: 13 }}>Uploader...</p>
        </div>
      )}
    </div>
  )
}
