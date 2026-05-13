'use client'

interface DrawerBackdropProps {
  isOpen: boolean
  onClose: () => void
}

export default function DrawerBackdrop({ isOpen, onClose }: DrawerBackdropProps) {
  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 40,
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
    />
  )
}
