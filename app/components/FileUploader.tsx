'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from 'caralstable'

interface FileUploaderProps {
  bucket?: string;
  folder?: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUploader({ 
  bucket = 'portal-assets', 
  folder = 'uploads',
  onUploadSuccess,
  onUploadError 
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para subir.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      if (onUploadSuccess) {
        onUploadSuccess(publicUrl)
      }

    } catch (error: any) {
      if (onUploadError) {
        onUploadError(error.message)
      } else {
        alert(error.message)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label 
        className={`
          flex justify-center items-center px-4 py-2 border border-dashed rounded-md cursor-pointer
          ${uploading ? 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-neutral-300 dark:border-neutral-700'}
        `}
      >
        <span className="font-poppins text-sm text-neutral-600 dark:text-neutral-400">
          {uploading ? 'Subiendo archivo...' : 'Seleccionar archivo (o arrastrar)'}
        </span>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadFile}
          disabled={uploading}
        />
      </label>
    </div>
  )
}
