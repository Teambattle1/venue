import { useRef, useState } from 'react'

interface ImageItem {
  id: string
  file?: File
  url: string
  preview: string
}

interface Props {
  images: ImageItem[]
  onChange: (images: ImageItem[]) => void
}

export default function MultiImageUpload({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newItems: ImageItem[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (!f.type.startsWith('image/')) continue
      newItems.push({
        id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        file: f,
        url: '',
        preview: URL.createObjectURL(f),
      })
    }
    if (newItems.length > 0) {
      onChange([...images, ...newItems])
    }
  }

  function removeImage(id: string) {
    const item = images.find(i => i.id === id)
    if (item?.preview && item.file) URL.revokeObjectURL(item.preview)
    onChange(images.filter(i => i.id !== id))
  }

  return (
    <div>
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8,
        WebkitOverflowScrolling: 'touch',
      }}>
        {images.map((img) => (
          <div key={img.id} style={{
            position: 'relative', flexShrink: 0, width: 100, height: 100,
            borderRadius: 'var(--r)', overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            <img
              src={img.preview || img.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button onClick={() => removeImage(img.id)} style={{
              position: 'absolute', top: 4, right: 4,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 14, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              &times;
            </button>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            flexShrink: 0, width: 100, height: 100,
            borderRadius: 'var(--r)', border: '2px dashed var(--border)',
            background: 'var(--surface2)', color: 'var(--muted)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            fontFamily: 'Outfit, sans-serif', fontSize: 11,
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>&#128247;</span>
          Tilføj
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}

export type { ImageItem }
