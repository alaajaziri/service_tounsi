import { useRef } from 'react'
import { useStatus } from '../contexts/StatusContext'

export default function ImageUploader({ onImageSelected }) {
  const fileInputRef = useRef()
  const { setStatus } = useStatus()

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageSelected?.(file)
      setStatus(`Selected: ${file.name}`)
    }
  }

  return (
    <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/20 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 gold-gradient opacity-5"></div>
      <div
        onClick={handleClick}
        className="relative z-10 border-2 border-dashed border-outline-variant/30 rounded-2xl p-12 flex flex-col items-center justify-center bg-background/40 hover:bg-background/60 transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-6xl text-primary mb-6 scale-110 group-hover:scale-125 transition-transform" style={{fontVariationSettings: `'FILL' 1`}}>
          photo_camera
        </span>
        <p className="text-2xl font-bold mb-2">اضغط لتحميل صورتك</p>
        <p className="text-on-surface-variant text-sm">PNG, JPG up to 10MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
