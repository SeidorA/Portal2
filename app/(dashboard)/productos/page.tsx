'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button, Drawer, Tabs, Toggle } from 'caralstable'
import { Brand, CaralIcon } from 'iconcaral2'
import FileUploader from '@/app/components/FileUploader'
import IconPickerModal from '@/app/components/IconPickerModal'
import { useTranslation } from '@/app/context/LanguageContext'

const ApiFeaturePreview = ({ url, apiScript }: { url: string, apiScript?: string }) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('Error al cargar URL')
        let json = await res.json()
        if (apiScript) {
          try {
            // eslint-disable-next-line no-new-func
            const transformFn = new Function('data', apiScript)
            json = transformFn(json)
          } catch (err: any) {
            throw new Error(`Error en script: ${err.message}`)
          }
        }
        if (isMounted) setData(json)
      } catch (e: any) {
        if (isMounted) setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    const timeout = setTimeout(fetchData, 500)
    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [url, apiScript])

  if (!url) return null
  if (loading) return <div className="text-xs text-neutral-800 mt-2">Cargando preview...</div>
  if (error) return <div className="text-xs text-red-500 mt-2">Error: {error}</div>
  if (data === undefined || data === null) return <div className="text-xs text-neutral-800 mt-2">No se encontraron datos en esa ruta.</div>

  const isArray = Array.isArray(data)

  const renderItem = (item: any) => {
    if (typeof item === 'object' && item !== null) {
      if (item.label) return item.label
      if (item.title) return item.title
      if (item.name) return item.name
    }
    return String(item)
  }

  return (
    <div className="mt-2 text-neutral-700 dark:text-neutral-300">
      {isArray ? (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {data.map((item: any, i: number) => (
            <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full">
              {renderItem(item)}
            </span>
          ))}
        </div>
      ) : (
        <pre className="text-[10px] text-neutral-600 dark:text-neutral-400 m-0 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

const ApiDependencySelector = ({ url, apiScript, value, onChange }: { url: string, apiScript?: string, value: string, onChange: (v: string) => void }) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedValues = value.split(',').map(v => v.trim()).filter(Boolean)

  useEffect(() => {
    if (!url) return
    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('Error al cargar URL')
        let json = await res.json()
        if (apiScript) {
          try {
            // eslint-disable-next-line no-new-func
            const transformFn = new Function('data', apiScript)
            json = transformFn(json)
          } catch (err: any) {
            throw new Error(`Error en script: ${err.message}`)
          }
        }
        if (isMounted) setData(json)
      } catch (e: any) {
        if (isMounted) setError(e.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    const timeout = setTimeout(fetchData, 500)
    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [url, apiScript])

  if (!url) return null
  if (loading) return <div className="text-xs text-neutral-500 py-2">Cargando opciones...</div>
  if (error) return <div className="text-xs text-red-500 py-2">Error: {error}</div>
  if (!Array.isArray(data)) return <div className="text-xs text-neutral-500 py-2">La API no retornó una lista.</div>

  const handleToggle = (optValue: string) => {
    let newSelected = [...selectedValues]
    if (newSelected.includes(optValue)) {
      newSelected = newSelected.filter(v => v !== optValue)
    } else {
      newSelected.push(optValue)
    }
    onChange(newSelected.join(','))
  }

  return (
    <div className="max-h-48 overflow-y-auto border border-neutral-300 dark:border-neutral-700 rounded-md bg-container p-2 flex flex-col gap-1.5">
      {data.map((opt: any, i: number) => {
        const optValue = typeof opt === 'object' && opt !== null ? String(opt.value || opt.id || opt.name || JSON.stringify(opt)) : String(opt)
        const optLabel = typeof opt === 'object' && opt !== null ? String(opt.label || opt.title || opt.name || opt.id || JSON.stringify(opt)) : String(opt)
        const isChecked = selectedValues.includes(optValue)
        return (
          <label key={i} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 p-1 rounded">
            <input type="checkbox" checked={isChecked} onChange={() => handleToggle(optValue)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300" />
            <span>{optLabel}</span>
          </label>
        )
      })}
    </div>
  )
}

export interface DownloadableAsset {
  id: string
  url: string
  name: string
  format: string
  size?: string
}

interface ProductAssetsState {
  logo_type?: 'brand' | 'custom'
  brand_icon?: string
  brand_is_color?: boolean
  custom_logo?: string
  custom_logo_dark?: string
  theme_base?: 'caral' | 'custom'
  enable_graphic_module?: boolean
  downloadable_assets?: DownloadableAsset[]
  brand_info?: string
  isotype_info?: string
  safety_zone_info?: string
  positive_negative_info?: string
  color_palette_info?: string
  typography_info?: string
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    bg_light?: string
    bg_dark?: string
    text_main?: string
    [key: string]: string | undefined
  }
  color_tokens?: {
    primary?: string
    secondary?: string
    accent?: string
    bg_light?: string
    text_main?: string
    [key: string]: string | undefined
  }
  logo_light?: string
  logo_dark?: string
  logo_positive_bw?: string
  logo_negative_bw?: string
  safety_zone_image?: string
  icon_dark?: string
  cover_images?: string[]
  use_brand?: boolean
  [key: string]: any
}

export const CARAL_COLOR_SLOTS = [
  { key: 'primary', label: 'Primary', defaultName: 'Seidor Main', defaultHex: '#07153A' },
  { key: 'secondary', label: 'Secondary', defaultName: 'Seidor Hard', defaultHex: '#1F3A70' },
  { key: 'accent', label: 'Assent', defaultName: 'Info main', defaultHex: '#0085FF' },
  { key: 'text_main', label: 'Text', defaultName: 'Neutral 900', defaultHex: '#18181B' },
  { key: 'bg_light', label: 'Background', defaultName: 'Neutral 100', defaultHex: '#F4F4F5' },
] as const

export const CARAL_COLOR_LIBRARY = [
  // Seidor
  { name: 'Seidor Main', hex: '#07153A', group: 'Seidor' },
  { name: 'Seidor Hard', hex: '#1F3A70', group: 'Seidor' },
  { name: 'Seidor ligth', hex: '#6DB4FE', group: 'Seidor' },
  // Info
  { name: 'Info Main', hex: '#0085FF', group: 'Info' },
  { name: 'info hard', hex: '#005BB5', group: 'Info' },
  { name: 'info ligth', hex: '#99D5FF', group: 'Info' },
  // Success
  { name: 'Success Main', hex: '#00E19B', group: 'Success' },
  { name: 'Success Hard', hex: '#009668', group: 'Success' },
  { name: 'Success ligth', hex: '#99F5D7', group: 'Success' },
  // Warning
  { name: 'Warning Main', hex: '#FFB81C', group: 'Warning' },
  { name: 'Warning Hard', hex: '#B87D00', group: 'Warning' },
  { name: 'Warning ligth', hex: '#FFE3A3', group: 'Warning' },
  // Danger
  { name: 'Danger Main', hex: '#FF3B30', group: 'Danger' },
  { name: 'Danger Hard', hex: '#B81A12', group: 'Danger' },
  { name: 'Danger ligth', hex: '#FFB2AD', group: 'Danger' },
  // Indigo
  { name: 'Indigo Main', hex: '#6366F1', group: 'Indigo' },
  { name: 'Indigo Hard', hex: '#4338CA', group: 'Indigo' },
  { name: 'Indigo ligth', hex: '#C7D2FE', group: 'Indigo' },
  // Sakura
  { name: 'Sakura Main', hex: '#EC4899', group: 'Sakura' },
  { name: 'Sakura Hard', hex: '#BE185D', group: 'Sakura' },
  { name: 'Sakura ligth', hex: '#FBCFE8', group: 'Sakura' },
  // Neutral
  { name: 'Neutral 900', hex: '#18181B', group: 'Neutral' },
  { name: 'Neutral 800', hex: '#27272A', group: 'Neutral' },
  { name: 'Neutral 500', hex: '#71717A', group: 'Neutral' },
  { name: 'Neutral 400', hex: '#A1A1AA', group: 'Neutral' },
  { name: 'Neutral 100', hex: '#F4F4F5', group: 'Neutral' },
]

const COLOR_PRESETS = [
  {
    name: 'Caral Clásico',
    key: 'presetCaral',
    primary: '#07153A',
    secondary: '#1F3A70',
    accent: '#0085FF',
    bg_light: '#F4F4F5',
    bg_dark: '#0B1329',
    text_main: '#18181B'
  },
  {
    name: 'Seidor Corporate',
    key: 'presetSeidor',
    primary: '#001A70',
    secondary: '#00A3E0',
    accent: '#FFB81C',
    bg_light: '#FFFFFF',
    bg_dark: '#0A1128',
    text_main: '#0F172A'
  },
  {
    name: 'Ocean Blue',
    key: 'presetOcean',
    primary: '#0F172A',
    secondary: '#3B82F6',
    accent: '#38BDF8',
    bg_light: '#F0F9FF',
    bg_dark: '#0C192C',
    text_main: '#0F172A'
  },
  {
    name: 'Emerald Tech',
    key: 'presetEmerald',
    primary: '#064E3B',
    secondary: '#059669',
    accent: '#34D399',
    bg_light: '#F0FDF4',
    bg_dark: '#06281E',
    text_main: '#064E3B'
  },
  {
    name: 'Crimson Red',
    key: 'presetCrimson',
    primary: '#4C0519',
    secondary: '#E11D48',
    accent: '#FB7185',
    bg_light: '#FFF1F2',
    bg_dark: '#1F060D',
    text_main: '#4C0519'
  },
  {
    name: 'Amber Spark',
    key: 'presetAmber',
    primary: '#451A03',
    secondary: '#D97706',
    accent: '#FBBF24',
    bg_light: '#FFFBEB',
    bg_dark: '#1C0F02',
    text_main: '#451A03'
  }
]

export default function ProductosPage() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Drawer & Tabs State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'general' | 'visibility' | 'requirements' | 'features' | 'assets'>('general')
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<any[]>([])

  // Assets State
  const [newAssets, setNewAssets] = useState<ProductAssetsState>({
    logo_type: 'brand',
    brand_icon: '',
    brand_is_color: true,
    theme_base: 'caral',
    colors: {
      primary: '#07153A',
      secondary: '#1F3A70',
      accent: '#0085FF',
      bg_light: '#F4F4F5',
      bg_dark: '#0F172A',
      text_main: '#18181B'
    },
    color_tokens: {
      primary: 'Seidor Main',
      secondary: 'Seidor Hard',
      accent: 'Info main',
      bg_light: 'Neutral 100',
      text_main: 'Neutral 900'
    },
    logo_light: '',
    logo_dark: '',
    logo_positive_bw: '',
    logo_negative_bw: '',
    safety_zone_image: '',
    icon_dark: '',
    cover_images: [],
    use_brand: true,
    enable_graphic_module: true,
    downloadable_assets: []
  })
  const [isUploadingAssets, setIsUploadingAssets] = useState(false)
  const [isDraggingRack, setIsDraggingRack] = useState(false)
  const [activeColorSlot, setActiveColorSlot] = useState<'primary' | 'secondary' | 'accent' | 'text_main' | 'bg_light' | null>(null)
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')

  // Create Form State
  const [newTitle, setNewTitle] = useState('')
  const [newStatus, setNewStatus] = useState('Publicada')
  const [newDesc, setNewDesc] = useState('')
  const [newLightImage, setNewLightImage] = useState('')
  const [newDarkImage, setNewDarkImage] = useState('')
  const [newLink, setNewLink] = useState('')
  const [newLinkDemo, setNewLinkDemo] = useState('')
  const [newLinkLanding, setNewLinkLanding] = useState('')
  const [newLinkDocs, setNewLinkDocs] = useState('')
  const [newCategory, setNewCategory] = useState('own_tech')
  const [newIsSuper, setNewIsSuper] = useState(false)
  const [newHideInBento, setNewHideInBento] = useState(false)
  const [newIconName, setNewIconName] = useState('')
  const [newUseBrand, setNewUseBrand] = useState(false)
  const [newRolePermissions, setNewRolePermissions] = useState<Record<string, string>>({})

  // Requisitos State
  const [newRequirements, setNewRequirements] = useState<{ id: string, title: string, description: string, is_mandatory: boolean, type?: 'text' | 'options' | 'tasklist' | 'boolean' | 'feature_question', options?: string[], tags?: string[], boolean_label?: string, depends_on?: any, linked_feature_id?: string }[]>([])
  const [newReqTitle, setNewReqTitle] = useState('')
  const [newReqDesc, setNewReqDesc] = useState('')
  const [newReqMandatory, setNewReqMandatory] = useState(false)
  const [newReqType, setNewReqType] = useState<'text' | 'options' | 'tasklist' | 'boolean' | 'feature_question'>('text')
  const [newReqLinkedFeatureId, setNewReqLinkedFeatureId] = useState('')
  const [newReqBooleanLabel, setNewReqBooleanLabel] = useState('')
  const [newReqOptions, setNewReqOptions] = useState<string[]>([])
  const [newReqOptionInput, setNewReqOptionInput] = useState('')
  const [newReqTags, setNewReqTags] = useState<string[]>([])
  const [newReqTagInput, setNewReqTagInput] = useState('')
  const [editingReqIndex, setEditingReqIndex] = useState<number | null>(null)
  const [isCreatingReq, setIsCreatingReq] = useState(false)
  const [newReqDependsOnId, setNewReqDependsOnId] = useState('')
  const [newReqDependsOnValue, setNewReqDependsOnValue] = useState('')
  const [newReqIsConditional, setNewReqIsConditional] = useState(false)

  // Features State (Form Engine)
  const [newFeatures, setNewFeatures] = useState<{ id: string, title: string, description: string, is_mandatory: boolean, type?: 'text' | 'options' | 'tasklist' | 'boolean' | 'api_select', options?: string[], tags?: string[], boolean_label?: string, depends_on?: any, api_url?: string, api_script?: string }[]>([])
  const [newFeatTitle, setNewFeatTitle] = useState('')
  const [newFeatDesc, setNewFeatDesc] = useState('')
  const [newFeatMandatory, setNewFeatMandatory] = useState(false)
  const [newFeatType, setNewFeatType] = useState<'text' | 'options' | 'tasklist' | 'boolean' | 'api_select'>('text')
  const [newFeatBooleanLabel, setNewFeatBooleanLabel] = useState('')
  const [newFeatOptions, setNewFeatOptions] = useState<string[]>([])
  const [newFeatOptionInput, setNewFeatOptionInput] = useState('')
  const [newFeatTags, setNewFeatTags] = useState<string[]>([])
  const [newFeatTagInput, setNewFeatTagInput] = useState('')
  const [editingFeatIndex, setEditingFeatIndex] = useState<number | null>(null)
  const [isCreatingFeat, setIsCreatingFeat] = useState(false)
  const [newFeatDependsOnId, setNewFeatDependsOnId] = useState('')
  const [newFeatDependsOnValue, setNewFeatDependsOnValue] = useState('')
  const [newFeatIsConditional, setNewFeatIsConditional] = useState(false)
  const [newFeatApiUrl, setNewFeatApiUrl] = useState('')
  const [newFeatApiScript, setNewFeatApiScript] = useState('')

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  useEffect(() => {
    fetchProducts()
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    const { data } = await supabase.from('roles').select('*').order('name', { ascending: true })
    if (data) setAvailableRoles(data.filter((r: any) => r.name.toLowerCase() !== 'admin' && r.name.toLowerCase() !== 'administrador'))
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('products').select('*').order('order_index', { ascending: true }).order('created_at', { ascending: false })

      if (error) throw error

      if (data) setProducts(data)
    } catch (error: any) {
      console.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const openCreateDrawer = () => {
    setEditingId(null)
    setNewTitle('')
    setNewStatus('Publicada')
    setNewDesc('')
    setNewLightImage('')
    setNewDarkImage('')
    setNewLink('')
    setNewLinkDemo('')
    setNewLinkLanding('')
    setNewLinkDocs('')
    setNewCategory('own_tech')
    setNewIsSuper(false)
    setNewHideInBento(false)
    setNewIconName('')
    setNewUseBrand(false)
    setNewRolePermissions({})
    setNewRequirements([])
    setNewReqTitle('')
    setNewReqDesc('')
    setNewReqMandatory(false)
    setNewReqType('text')
    setNewReqOptions([])
    setNewReqOptionInput('')
    setNewReqBooleanLabel('')
    setEditingReqIndex(null)
    setNewFeatures([])
    setNewFeatTitle('')
    setNewFeatDesc('')
    setNewFeatMandatory(false)
    setNewFeatType('text')
    setNewFeatOptions([])
    setNewFeatOptionInput('')
    setNewFeatBooleanLabel('')
    setNewFeatTags([])
    setNewFeatTagInput('')
    setEditingFeatIndex(null)
    setIsCreatingFeat(false)
    setNewFeatDependsOnId('')
    setNewFeatDependsOnValue('')
    setNewFeatIsConditional(false)
    setNewFeatApiUrl('')
    setNewFeatApiScript('')
    setNewAssets({
      logo_type: 'brand',
      brand_icon: '',
      brand_is_color: true,
      custom_logo: '',
      custom_logo_dark: '',
      theme_base: 'caral',
      colors: {
        primary: '#07153A',
        secondary: '#1F3A70',
        accent: '#0085FF',
        bg_light: '#F4F4F5',
        bg_dark: '#0F172A',
        text_main: '#18181B'
      },
      color_tokens: {
        primary: 'Seidor Main',
        secondary: 'Seidor Hard',
        accent: 'Info main',
        bg_light: 'Neutral 100',
        text_main: 'Neutral 900'
      },
      logo_light: '',
      logo_dark: '',
      logo_positive_bw: '',
      logo_negative_bw: '',
      safety_zone_image: '',
      icon_dark: '',
      cover_images: [],
      use_brand: true,
      enable_graphic_module: true,
      downloadable_assets: [],
      brand_info: '',
      isotype_info: '',
      safety_zone_info: '',
      positive_negative_info: '',
      color_palette_info: '',
      typography_info: ''
    })
    setActiveColorSlot(null)
    setDrawerTab('general')
    setIsDrawerOpen(true)
  }

  const handleUploadDownloadableAssets = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    if (fileList.length === 0) return

    setIsUploadingAssets(true)
    try {
      const uploadPromises = fileList.map(async (file) => {
        try {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
          const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
          const filePath = `downloadable-assets/${cleanFileName}`

          const { error } = await supabase.storage.from('portal-assets').upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

          if (error) {
            console.error('Error uploading file:', file.name, error)
            return null
          }

          const { data: { publicUrl } } = supabase.storage.from('portal-assets').getPublicUrl(filePath)

          const formatSize = (bytes: number) => {
            if (bytes < 1024) return `${bytes} B`
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
          }

          return {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            url: publicUrl,
            name: file.name,
            format: ext.toUpperCase(),
            size: formatSize(file.size)
          } as DownloadableAsset
        } catch (err) {
          console.error('Error processing file:', file.name, err)
          return null
        }
      })

      const results = await Promise.all(uploadPromises)
      const validItems = results.filter((item): item is DownloadableAsset => item !== null)

      if (validItems.length > 0) {
        setNewAssets(prev => ({
          ...prev,
          downloadable_assets: [...(prev.downloadable_assets || []), ...validItems]
        }))
      }
    } catch (err: any) {
      alert(err.message || 'Error al subir los archivos')
    } finally {
      setIsUploadingAssets(false)
    }
  }

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      const finalAssets = {
        ...newAssets,
        use_brand: newAssets.logo_type === 'brand' ? (newAssets.brand_is_color ?? true) : false,
        brand_icon: newAssets.logo_type === 'brand' ? (newAssets.brand_icon || newIconName) : undefined,
        brand_is_color: newAssets.brand_is_color ?? true
      }

      let productId = editingId
      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update({
            title: newTitle,
            slug: newLink,
            status: newStatus,
            description: newDesc,
            link: newLink,
            category: newCategory,
            is_super: newIsSuper,
            light_image: newLightImage || '',
            dark_image: newDarkImage || '',
            link_demo: newLinkDemo,
            link_landing: newLinkLanding,
            link_docs: newLinkDocs,
            icon_name: newAssets.logo_type === 'brand' ? (newAssets.brand_icon || newIconName) : (newIconName || ''),
            hide_in_bento: newHideInBento || false,
            requirements: newRequirements,
            features: newFeatures,
            assets: finalAssets
          })
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([
            {
              title: newTitle,
              slug: newLink,
              status: newStatus,
              description: newDesc,
              link: newLink,
              category: newCategory,
              is_super: newIsSuper,
              light_image: newLightImage || '',
              dark_image: newDarkImage || '',
              order_index: products.length,
              link_demo: newLinkDemo,
              link_landing: newLinkLanding,
              link_docs: newLinkDocs,
              icon_name: newAssets.logo_type === 'brand' ? (newAssets.brand_icon || newIconName) : (newIconName || ''),
              hide_in_bento: newHideInBento,
              requirements: newRequirements,
              features: newFeatures,
              assets: finalAssets
            }
          ]).select()
        if (error) throw error
        productId = data[0].id
        alert(t('products.productCreated', '¡Producto creado!'))
      }

      if (productId) {
        const { error: deleteError } = await supabase.from('access_policies').delete().eq('resource_type', 'product').eq('resource_id', productId)
        if (deleteError) throw deleteError

        const newPolicies = Object.entries(newRolePermissions)
          .filter(([_, level]) => level !== 'Sin acceso')
          .map(([roleName, level]) => ({
            resource_type: 'product',
            resource_id: productId,
            role_name: roleName,
            access_level: level
          }))
        if (newPolicies.length > 0) {
          const { error: insertError } = await supabase.from('access_policies').insert(newPolicies)
          if (insertError) throw insertError
        }
      }

      setIsDrawerOpen(false)
      setEditingId(null)
      fetchProducts()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('products.confirmDelete', '¿Estás seguro de eliminar este producto?'))) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      fetchProducts()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const startEditing = async (p: any) => {
    setEditingId(p.id)
    setNewTitle(p.title || '')
    setNewStatus(p.status || 'Publicada')
    setNewDesc(p.description || '')
    setNewLink(p.slug || p.link || '')
    setNewLinkDemo(p.link_demo || '')
    setNewLinkLanding(p.link_landing || '')
    setNewLinkDocs(p.link_docs || '')
    setNewCategory(p.category || 'own_tech')
    setNewIsSuper(p.is_super || false)
    setNewHideInBento(p.hide_in_bento || false)
    setNewIconName(p.icon_name || '')
    setNewUseBrand(p.assets?.use_brand ?? true)
    setNewLightImage(p.light_image || '')
    setNewDarkImage(p.dark_image || '')
    setNewRequirements(p.requirements || [])
    setNewReqTitle('')
    setNewReqDesc('')
    setNewReqMandatory(false)
    setNewReqType('text')
    setNewReqOptions([])
    setNewReqOptionInput('')
    setNewReqBooleanLabel('')
    setEditingReqIndex(null)
    setNewFeatures(p.features || [])
    setNewFeatTitle('')
    setNewFeatDesc('')
    setNewFeatMandatory(false)
    setNewFeatType('text')
    setNewFeatOptions([])
    setNewFeatOptionInput('')
    setNewFeatBooleanLabel('')
    setNewFeatTags([])
    setNewFeatTagInput('')
    setEditingFeatIndex(null)
    setIsCreatingFeat(false)
    setNewFeatDependsOnId('')
    setNewFeatDependsOnValue('')
    setNewFeatIsConditional(false)
    setNewFeatApiUrl('')
    setNewFeatApiScript('')
    const assetsData = p.assets || {}
    const hasBrand = Boolean(assetsData.brand_icon || p.icon_name)
    const initialLogoType: 'brand' | 'custom' = assetsData.logo_type || (hasBrand ? 'brand' : (assetsData.custom_logo ? 'custom' : 'brand'))

    setNewAssets({
      logo_type: initialLogoType,
      brand_icon: assetsData.brand_icon || p.icon_name || '',
      brand_is_color: assetsData.brand_is_color ?? (assetsData.use_brand ?? true),
      custom_logo: assetsData.custom_logo || '',
      custom_logo_dark: assetsData.custom_logo_dark || '',
      theme_base: assetsData.theme_base || 'caral',
      colors: {
        primary: assetsData.colors?.primary || '#07153A',
        secondary: assetsData.colors?.secondary || '#1F3A70',
        accent: assetsData.colors?.accent || '#0085FF',
        bg_light: assetsData.colors?.bg_light || '#F4F4F5',
        bg_dark: assetsData.colors?.bg_dark || '#0F172A',
        text_main: assetsData.colors?.text_main || '#18181B',
        ...(assetsData.colors || {})
      },
      color_tokens: {
        primary: assetsData.color_tokens?.primary || 'Seidor Main',
        secondary: assetsData.color_tokens?.secondary || 'Seidor Hard',
        accent: assetsData.color_tokens?.accent || 'Info main',
        bg_light: assetsData.color_tokens?.bg_light || 'Neutral 100',
        text_main: assetsData.color_tokens?.text_main || 'Neutral 900',
        ...(assetsData.color_tokens || {})
      },
      logo_light: assetsData.logo_light || '',
      logo_dark: assetsData.logo_dark || '',
      logo_positive_bw: assetsData.logo_positive_bw || '',
      logo_negative_bw: assetsData.logo_negative_bw || '',
      safety_zone_image: assetsData.safety_zone_image || '',
      icon_dark: assetsData.icon_dark || '',
      cover_images: assetsData.cover_images || [],
      use_brand: assetsData.use_brand ?? true,
      enable_graphic_module: assetsData.enable_graphic_module ?? true,
      downloadable_assets: assetsData.downloadable_assets || [],
      brand_info: assetsData.brand_info || '',
      isotype_info: assetsData.isotype_info || '',
      safety_zone_info: assetsData.safety_zone_info || '',
      positive_negative_info: assetsData.positive_negative_info || '',
      color_palette_info: assetsData.color_palette_info || '',
      typography_info: assetsData.typography_info || ''
    })
    setActiveColorSlot(null)
    setDrawerTab('general')
    setIsDrawerOpen(true)

    const { data: policies } = await supabase.from('access_policies').select('*').eq('resource_type', 'product').eq('resource_id', p.id)
    const perms: Record<string, string> = {}
    if (policies) {
      policies.forEach((pol: any) => {
        perms[pol.role_name] = pol.access_level
      })
    }
    setNewRolePermissions(perms)
  }

  // Eliminated drag and drop functions since they are handled in the bento layout page now

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-8 px-4 md:px-8 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full max-w-5xl mx-auto">
        <h1 className="text-3xl text-neutral-900 dark:text-white font-poppins font-bold">
          {t('products.title', 'Gestión de Productos')}
        </h1>
        <Button onClick={openCreateDrawer}>
          {t('products.newProduct', 'Nuevo Producto')}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p>{t('common.loading', 'Cargando...')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {products.map((p, index) => (
              <div
                key={p.id}
                className={`
                  border rounded-xl p-4 flex gap-4 relative transition-all
                  border-neutral-200 dark:border-neutral-800 bg-container
                  hover:shadow-md
                `}
              >



                <>
                  {p.is_super && (
                    <span className="absolute top-2 right-2 text-[10px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full font-bold uppercase">
                      Super
                    </span>
                  )}

                  {/* Replaced Image logic with Circle Icon logic */}
                  {p.icon_name ? (
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex shrink-0 items-center justify-center text-blue-600 dark:text-blue-400">
                      {(p.assets?.use_brand ?? true) ? (
                        <Brand name={p.icon_name as any} size={32} />
                      ) : (
                        <CaralIcon name={p.icon_name as any} size={32} />
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex shrink-0 items-center justify-center text-neutral-800 text-xs font-bold uppercase">
                      {p.category === 'actin' ? 'ACT' : 'OWN'}
                    </div>
                  )}

                  <div className="flex-1 pr-12 flex flex-col justify-center ml-2">
                    <h3 className="font-semibold font-poppins text-lg leading-tight">{p.title}</h3>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {p.link && <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded">Link</span>}
                      {p.link_demo && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">Demo</span>}
                      {p.link_landing && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">Landing</span>}
                      {p.link_docs && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded">Docs</span>}
                    </div>

                    <p className="text-sm text-neutral-800 line-clamp-2 mt-2">{p.description}</p>

                    <div className="flex gap-4 mt-3">
                      <Button
                        onClick={() => startEditing(p)}
                        variant='light'
                        hasBorder
                        size='sm'
                      >
                        {t('common.edit', 'Editar')}
                      </Button>
                    </div>
                  </div>
                </>

              </div>
            ))}
          </div>
        )}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingId ? t('products.editProduct', 'Editar Producto') : t('products.createProduct', 'Crear Nuevo Producto')}
        size="lg"
      >
        <div className="w-full mb-6">
          <Tabs
            tabs={[
              { label: t('products.tabGeneral', 'General') },
              { label: t('products.tabVisibility', 'Visibilidad') },
              { label: t('products.tabRequirements', 'Requisitos') },
              { label: t('products.tabFeatures', 'Features') },
              { label: t('products.tabAssets', 'Assets') }
            ]}
            activeIndex={drawerTab === 'general' ? 0 : drawerTab === 'visibility' ? 1 : drawerTab === 'requirements' ? 2 : drawerTab === 'features' ? 3 : 4}
            onChange={(idx) => setDrawerTab(idx === 0 ? 'general' : idx === 1 ? 'visibility' : idx === 2 ? 'requirements' : idx === 3 ? 'features' : 'assets')}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {drawerTab === 'general' && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 px-1">
              {/* Fila 1: Icono, Título, Título (Slug) */}
              <div className="grid grid-cols-[auto_1fr_1fr] gap-4">
                <div className="flex flex-col pt-6">
                  <button
                    type="button"
                    onClick={() => setIsIconPickerOpen(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-container hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {newIconName ? (
                      newUseBrand ? (
                        <Brand name={newIconName as any} size={20} />
                      ) : (
                        <CaralIcon name={newIconName as any} size={20} className="text-blue-600" />
                      )
                    ) : (
                      <CaralIcon name="image" size={20} className="text-neutral-400" />
                    )}
                  </button>
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    {t('products.titleField', 'Titulo')}
                  </label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-container text-sm focus:outline-none focus:border-blue-500"
                    placeholder={t('products.titlePlaceholder', 'Ej: Crestone')}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    {t('products.slugField', 'Titulo (Slug)')}
                  </label>
                  <input
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-container text-sm focus:outline-none focus:border-blue-500"
                    placeholder={t('products.slugPlaceholder', 'Ej: crestone')}
                  />
                </div>
              </div>

              {/* Fila 2: Descripción */}
              <div className="grid grid-cols-[auto_1fr_1fr] gap-4">
                <div className="w-10 invisible"></div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    {t('products.descField', 'Descripcion')}
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-container text-sm focus:outline-none focus:border-blue-500 h-28 resize-none"
                    placeholder={t('products.productDesc', 'Descripción del producto...')}
                  />
                </div>
              </div>

              {/* Fila 3: Estado, Categoría */}
              <div className="grid grid-cols-[auto_1fr_1fr] gap-4">
                <div className="w-10 invisible"></div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    {t('products.statusField', 'Estado')}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-container text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Publicada">{t('products.statusPublished', 'Publicada')}</option>
                    <option value="Borrador">{t('products.statusDraft', 'Borrador')}</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    {t('products.categoryField', 'Categoria')}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-container text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="own_tech">Own Tech</option>
                    <option value="actin">Act-in</option>
                  </select>
                </div>
              </div>

              {/* Links Section */}
              <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="bg-[#EAF0F6] dark:bg-neutral-800/50 px-4 py-2 font-semibold text-[#667C99] dark:text-neutral-300 text-sm">
                  {t('products.links', 'Links')}
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 bg-container/20">
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Live Demo</label>
                    <input
                      value={newLinkDemo}
                      onChange={(e) => setNewLinkDemo(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-container text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Crestone.io"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Landing</label>
                    <input
                      value={newLinkLanding}
                      onChange={(e) => setNewLinkLanding(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-container text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Crestone"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                      {t('sidebar.documentation', 'Documentacion')}
                    </label>
                    <input
                      value={newLinkDocs}
                      onChange={(e) => setNewLinkDocs(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-container text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Crestone-help.com"
                    />
                  </div>
                </div>
              </div>

              {/* Mostrar en el Inicio Section */}
              <div className="mt-2 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="bg-[#EAF0F6] dark:bg-neutral-800/50 px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-[#667C99] dark:text-neutral-300 text-sm">
                    {t('products.showOnHome', 'Mostrar en el Inicio')}
                  </span>
                  <Toggle
                    checked={!newHideInBento}
                    onChange={(checked) => setNewHideInBento(!checked)}
                  />
                </div>

                {!newHideInBento && (
                  <div className="p-4 bg-container/20">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-[#869AB5] dark:text-neutral-400 mb-2">
                          {t('products.featuredLight', 'Destacada (Modo Claro)')}
                        </label>
                        <div className="h-32 rounded-lg bg-[#EAEFF4] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-[#869AB5] dark:text-neutral-400 overflow-hidden relative">
                          {newLightImage ? (
                            <>
                              <img src={newLightImage} alt="Preview Claro" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setNewLightImage('')} className="absolute top-2 right-2 bg-white/80 p-1 rounded text-red-500 hover:bg-white cursor-pointer">
                                {t('products.remove', 'Quitar')}
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center flex-col scale-75 opacity-70 hover:opacity-100 transition-opacity">
                              <FileUploader onUploadSuccess={(url) => setNewLightImage(url)} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#869AB5] dark:text-neutral-400 mb-2">
                          {t('products.featuredDark', 'Destacada (Modo oscuro)')}
                        </label>
                        <div className="h-32 rounded-lg bg-[#EAEFF4] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-[#869AB5] dark:text-neutral-400 overflow-hidden relative">
                          {newDarkImage ? (
                            <>
                              <img src={newDarkImage} alt="Preview Oscuro" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setNewDarkImage('')} className="absolute top-2 right-2 bg-white/80 p-1 rounded text-red-500 hover:bg-white cursor-pointer">
                                {t('products.remove', 'Quitar')}
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center flex-col scale-75 opacity-70 hover:opacity-100 transition-opacity">
                              <FileUploader onUploadSuccess={(url) => setNewDarkImage(url)} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Toggle
                        checked={newIsSuper}
                        onChange={setNewIsSuper}
                        label={t('products.superMode', 'Activar modo Super')}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="min-w-[120px]">
                  {editingId ? t('products.saveChanges', 'Guardar Cambios') : t('products.createProduct', 'Crear Producto')}
                </Button>
              </div>

              {/* Zona de peligro */}
              {editingId && (
                <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {t('common.dangerZone', 'Zona de peligro')}
                  </h3>
                  <p className="text-sm text-neutral-800 mb-4">
                    {t('common.dangerZoneNotice', 'Tenga cuidado con las siguientes funciones ya que no se pueden deshacer.')}
                  </p>

                  <div className="border border-red-200 dark:border-red-900/50 bg-[#FDEEED] dark:bg-red-950/20 rounded-md p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-[#641A1B] dark:text-red-400 mb-1">
                        {t('products.deleteProduct', 'Eliminar Producto')}
                      </h4>
                      <p className="text-sm text-[#641A1B] dark:text-red-500 font-medium">
                        {t('products.deleteWarning', 'El producto no estará más disponible y todo su contenido creado quedará huérfano.')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        handleDelete(editingId)
                        setIsDrawerOpen(false)
                      }}
                      variant='danger'
                      iconName='trash'
                    >
                      {t('common.delete', 'Eliminar')}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          )}

          {drawerTab === 'visibility' && (
            <div className="flex flex-col gap-6 px-1">
              <div className="bg-container rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  {t('products.visibilityTitle', 'Visibilidad por Roles')}
                </h3>
                <p className="text-sm text-neutral-800 mb-6">
                  {t('products.visibilitySubtitle', 'Selecciona los roles que tendrán acceso de lectura a este producto.')}
                </p>

                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <input
                    type="checkbox"
                    id="role-all"
                    checked={availableRoles.length > 0 && availableRoles.every(r => newRolePermissions[r.name] === 'Lectura' || newRolePermissions[r.name] === 'Edición' || newRolePermissions[r.name] === 'Total')}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      const newPerms = { ...newRolePermissions };
                      availableRoles.forEach(r => {
                        newPerms[r.name] = isChecked ? 'Lectura' : 'Sin acceso';
                      });
                      setNewRolePermissions(newPerms);
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="role-all" className="text-sm font-bold text-neutral-900 dark:text-white cursor-pointer">
                    {t('products.selectAll', 'Seleccionar todos')}
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableRoles.map(role => {
                    const isChecked = newRolePermissions[role.name] === 'Lectura' || newRolePermissions[role.name] === 'Edición' || newRolePermissions[role.name] === 'Total'
                    return (
                      <div key={role.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`role-${role.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            setNewRolePermissions({
                              ...newRolePermissions,
                              [role.name]: e.target.checked ? 'Lectura' : 'Sin acceso'
                            })
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`role-${role.id}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                          {role.name}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={() => handleFormSubmit()} className="min-w-[120px]">
                  {editingId ? t('products.saveChanges', 'Guardar Cambios') : t('products.createProduct', 'Crear Producto')}
                </Button>
              </div>
            </div>
          )}

          {drawerTab === 'requirements' && (
            <div className="flex flex-col gap-6 px-1">
              <div className="bg-container rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{t('products.reqTitle', 'Requisitos')}</h3>
                <p className="text-sm text-neutral-800 mb-6">{t('products.reqSubtitle', 'Administra los requisitos técnicos de este producto.')}</p>

                <div className="flex flex-col gap-2">
                  {(() => {
                    const renderRequirementForm = () => (
                      <div className="border border-blue-500 bg-blue-50/10 p-5 rounded-xl flex flex-col gap-4 relative z-20 shadow-sm mt-2 mb-2">
                        <h4 className="font-semibold text-neutral-900 dark:text-white">{editingReqIndex !== null ? t('products.editReqHeader', "Editar requisito") : t('products.addReqHeader', "Añadir nuevo requisito")}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.titleField', 'Título')}</label>
                            <input type="text" value={newReqTitle} onChange={(e) => setNewReqTitle(e.target.value)} placeholder="Ej: Entornos soportados" className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.reqType', 'Tipo de Requisito')}</label>
                            <select
                              value={newReqType}
                              onChange={(e: any) => setNewReqType(e.target.value)}
                              className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                            >
                              <option value="text">{t('products.reqTypeDesc', 'Texto Descriptivo')}</option>
                              <option value="options">{t('products.reqTypeOptions', 'Lista de Opciones')}</option>
                              <option value="tasklist">{t('products.reqTypeTasklist', 'Lista de Tareas (Checklist)')}</option>
                              <option value="boolean">{t('products.reqTypeBoolean', 'Casilla (Checkbox)')}</option>
                              <option value="feature_question">{t('products.reqTypeFeatureQuestion', 'Pregunta de Feature')}</option>
                            </select>
                          </div>
                          {newReqType !== 'feature_question' && (
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.reqDescInstructions', 'Descripción / Instrucciones')}</label>
                              <input type="text" value={newReqDesc} onChange={(e) => setNewReqDesc(e.target.value)} placeholder="Ej: Seleccione al menos uno" className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm" />
                            </div>
                          )}
                        </div>

                        {newReqType === 'feature_question' && (
                          <div className="flex flex-col gap-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.selectLinkedFeature', 'Selecciona la Feature Comercial vinculada')}</label>
                            <select
                              value={newReqLinkedFeatureId}
                              onChange={(e) => setNewReqLinkedFeatureId(e.target.value)}
                              className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                            >
                              <option value="">{t('products.selectFeaturePlaceholder', 'Selecciona una feature...')}</option>
                              {newFeatures.map(f => (
                                <option key={f.id} value={f.id}>{f.title}</option>
                              ))}
                            </select>
                            <p className="text-xs text-neutral-500 mt-1">{t('products.linkedFeatureNotice', 'Este requisito heredará las opciones y lógica de la Feature seleccionada y siempre será opcional en la matriz.')}</p>
                          </div>
                        )}

                        {newReqType === 'boolean' && (
                          <div className="flex flex-col gap-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.checkboxText', 'Texto de la Casilla')}</label>
                            <input type="text" value={newReqBooleanLabel} onChange={(e) => setNewReqBooleanLabel(e.target.value)} placeholder="Ej: Confirmo que he verificado..." className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm" />
                          </div>
                        )}

                        {(newReqType === 'options' || newReqType === 'tasklist') && (
                          <div className="flex flex-col gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {newReqType === 'options' ? t('products.selectableOptions', 'Opciones Seleccionables') : t('products.listItems', 'Elementos de la Lista')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {newReqOptions.map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                                  {tag}
                                  <button type="button" onClick={() => setNewReqOptions(newReqOptions.filter((_, idx) => idx !== i))} className="hover:text-blue-900">
                                    <CaralIcon name="x" size={10} />
                                  </button>
                                </span>
                              ))}
                              {newReqOptions.length === 0 && <span className="text-xs text-neutral-800">{t('products.addItemsBelow', 'Agrega elementos abajo...')}</span>}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newReqOptionInput}
                                onChange={(e) => setNewReqOptionInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    if (newReqOptionInput.trim()) {
                                      setNewReqOptions([...newReqOptions, newReqOptionInput.trim()])
                                      setNewReqOptionInput('')
                                    }
                                  }
                                }}
                                placeholder={newReqType === 'options' ? "Ej: AWS, presiona Enter" : "Ej: 5432: PostgreSQL, presiona Enter"}
                                className="flex-1 h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                              />
                              <Button
                                type="button"
                                variant="light"
                                onClick={() => {
                                  if (newReqOptionInput.trim()) {
                                    setNewReqOptions([...newReqOptions, newReqOptionInput.trim()])
                                    setNewReqOptionInput('')
                                  }
                                }}
                              >
                                {t('products.add', 'Añadir')}
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <input id="req-conditional" type="checkbox" checked={newReqIsConditional} onChange={(e) => {
                              setNewReqIsConditional(e.target.checked)
                              if (!e.target.checked) {
                                setNewReqDependsOnId('')
                                setNewReqDependsOnValue('')
                              }
                            }} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="req-conditional" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">{t('products.isConditionalReq', 'Es condicional (depende de otro requisito)')}</label>
                          </div>

                          {newReqIsConditional && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{t('products.parentReq', 'Requisito Padre')}</label>
                                <select
                                  value={newReqDependsOnId}
                                  onChange={(e: any) => {
                                    setNewReqDependsOnId(e.target.value)
                                    setNewReqDependsOnValue('')
                                  }}
                                  className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                                >
                                  <option value="">{t('products.selectOptionsReq', 'Selecciona un requisito de opciones...')}</option>
                                  {newRequirements.filter(r => r.type === 'options' && r.id !== (editingReqIndex !== null ? newRequirements[editingReqIndex].id : '')).map(req => (
                                    <option key={req.id} value={req.id}>{req.title}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{t('products.whenValueIs', 'Cuando el valor sea...')}</label>
                                <select
                                  value={newReqDependsOnValue}
                                  onChange={(e: any) => setNewReqDependsOnValue(e.target.value)}
                                  disabled={!newReqDependsOnId}
                                  className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                                >
                                  <option value="">{t('products.selectAnOption', 'Selecciona una opción...')}</option>
                                  {newRequirements.find(r => r.id === newReqDependsOnId)?.options?.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 mt-1 mb-2">
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.tags', 'Etiquetas (Tags)')}</label>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {newReqTags.map((tag, i) => (
                              <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {tag}
                                <button type="button" onClick={() => setNewReqTags(newReqTags.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                                  <CaralIcon name="x" size={10} />
                                </button>
                              </span>
                            ))}
                            {newReqTags.length === 0 && <span className="text-[10px] text-neutral-500 italic mt-1">{t('products.tagsDefaultNotice', "Si no agregas nada, se asignará 'General' por defecto al guardar.")}</span>}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newReqTagInput}
                              onChange={(e) => setNewReqTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  if (newReqTagInput.trim()) {
                                    setNewReqTags([...newReqTags, newReqTagInput.trim()])
                                    setNewReqTagInput('')
                                  }
                                }
                              }}
                              placeholder="Ej: Networking, Seguridad..."
                              className="flex-1 h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                            />
                            <Button
                              type="button"
                              variant="light"
                              onClick={() => {
                                if (newReqTagInput.trim()) {
                                  setNewReqTags([...newReqTags, newReqTagInput.trim()])
                                  setNewReqTagInput('')
                                }
                              }}
                            >
                              {t('products.addTag', 'Añadir Tag')}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input id="req-mandatory" type="checkbox" checked={newReqMandatory} onChange={(e) => setNewReqMandatory(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                          <label htmlFor="req-mandatory" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">{t('products.isMandatory', 'Es obligatorio')}</label>
                        </div>


                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="light" onClick={() => {
                            setNewReqTitle('')
                            setNewReqDesc('')
                            setNewReqMandatory(false)
                            setNewReqType('text')
                            setNewReqOptions([])
                            setNewReqOptionInput('')
                            setNewReqBooleanLabel('')
                            setNewReqTags([])
                            setNewReqTagInput('')
                            setNewReqIsConditional(false)
                            setNewReqDependsOnId('')
                            setNewReqDependsOnValue('')
                            setNewReqLinkedFeatureId('')
                            setEditingReqIndex(null)
                            setIsCreatingReq(false)
                          }}>
                            {t('products.cancel', 'Cancelar')}
                          </Button>
                          <Button type="button" variant="light" hasBorder onClick={() => {
                            if (newReqTitle) {
                              if ((newReqType === 'options' || newReqType === 'tasklist') && newReqOptions.length === 0) {
                                alert(t('products.alertAddOption', "Agrega al menos una opción/elemento o cambia el tipo a Texto."))
                                return
                              }
                              if (newReqType === 'feature_question' && !newReqLinkedFeatureId) {
                                alert(t('products.alertSelectFeature', "Debes seleccionar a qué Feature apunta esta pregunta."))
                                return
                              }

                              if (newReqIsConditional && (!newReqDependsOnId || !newReqDependsOnValue)) {
                                alert(t('products.alertReqParent', "Debes seleccionar el requisito padre y el valor requerido para la condición."))
                                return
                              }

                              const newReq: any = {
                                id: editingReqIndex !== null ? newRequirements[editingReqIndex].id : Date.now().toString(),
                                title: newReqTitle,
                                description: newReqType === 'feature_question' ? '' : newReqDesc,
                                is_mandatory: newReqType === 'feature_question' ? false : newReqMandatory,
                                type: newReqType,
                                options: (newReqType === 'options' || newReqType === 'tasklist') ? [...newReqOptions] : undefined,
                                tags: newReqTags.length > 0 ? [...newReqTags] : ['General'],
                                boolean_label: newReqType === 'boolean' ? newReqBooleanLabel : undefined,
                                linked_feature_id: newReqType === 'feature_question' ? newReqLinkedFeatureId : undefined
                              }

                              if (newReqIsConditional) {
                                newReq.depends_on = {
                                  requirement_id: newReqDependsOnId,
                                  value: newReqDependsOnValue
                                }
                              }

                              if (editingReqIndex !== null) {
                                const updated = [...newRequirements]
                                updated[editingReqIndex] = newReq
                                setNewRequirements(updated)
                                setNewRequirements(updated)
                                setEditingReqIndex(null)
                              } else {
                                setNewRequirements([...newRequirements, newReq])
                                setIsCreatingReq(false)
                              }

                              setNewReqTitle('')
                              setNewReqDesc('')
                              setNewReqMandatory(false)
                              setNewReqType('text')
                              setNewReqOptions([])
                              setNewReqOptionInput('')
                              setNewReqBooleanLabel('')
                              setNewReqTags([])
                              setNewReqTagInput('')
                              setNewReqIsConditional(false)
                              setNewReqDependsOnId('')
                              setNewReqDependsOnValue('')
                              setNewReqLinkedFeatureId('')
                            } else {
                              alert(t('products.alertTitleRequired', "El título es obligatorio"))
                            }
                          }}>{editingReqIndex !== null ? t('products.saveChanges', "Guardar Cambios") : t('products.addToList', "Añadir a la lista")}</Button>
                        </div>
                      </div>
                    )

                    const renderRequirementNode = (req: any, depth: number = 0) => {
                      const originalIdx = newRequirements.findIndex(r => r.id === req.id)
                      if (editingReqIndex === originalIdx) {
                        return <div key={req.id}>{renderRequirementForm()}</div>
                      }
                      const dependentsByOption: Record<string, any[]> = {}
                      if (req.type === 'options' && req.options) {
                        req.options.forEach((opt: string) => {
                          dependentsByOption[opt] = newRequirements.filter(r => r.depends_on?.requirement_id === req.id && r.depends_on?.value === opt)
                        })
                      }

                      return (
                        <div key={req.id} className={`flex flex-col ${depth > 0 ? 'mt-2' : 'mb-2'}`} style={{ marginLeft: depth > 0 ? `${depth * 2}rem` : '0' }}>
                          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-start justify-between bg-container shadow-sm relative z-10">
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-neutral-900 dark:text-white">{req.title}</h4>
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{t('products.reqBadge', 'Requisito')}</span>
                                {req.is_mandatory && req.type !== 'feature_question' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">{t('products.mandatoryBadge', 'Obligatorio')}</span>}
                                {req.type === 'options' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium uppercase">{t('products.optionsBadge', 'Opciones')}</span>}
                                {req.type === 'tasklist' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium uppercase">{t('products.checklistBadge', 'Checklist')}</span>}
                                {req.type === 'boolean' && <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-medium uppercase">{t('products.booleanBadge', 'Casilla')}</span>}
                                {req.type === 'feature_question' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium uppercase">{t('products.featureQuestionBadge', 'Pregunta Feature')}</span>}
                                {(req.tags || ['General']).map((tag: string, i: number) => (
                                  <span key={i} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                                ))}
                              </div>
                              {req.type !== 'feature_question' && <p className="text-sm text-neutral-800">{req.description}</p>}

                              {req.type === 'feature_question' && (
                                <div className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 bg-amber-50/50 p-2 rounded border border-amber-200/50">
                                  {t('products.linkedToFeature', 'Vinculado a la feature comercial:')} <strong className="font-semibold">{newFeatures.find(f => f.id === req.linked_feature_id)?.title || t('products.unknown', 'Desconocida')}</strong>
                                </div>
                              )}

                              {(req.type === 'options' || req.type === 'tasklist') && req.options && req.options.length > 0 && (
                                <div className={req.type === 'options' ? "mt-2 flex flex-wrap gap-1.5" : "mt-2 flex flex-col gap-2 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded border border-neutral-200 dark:border-neutral-800"}>
                                  {req.options.map((opt: string, i: number) => (
                                    req.type === 'options' ? (
                                      <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full">{opt}</span>
                                    ) : (
                                      <div key={i} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                                        <input type="checkbox" disabled className="w-3.5 h-3.5 mt-0.5 rounded border-neutral-300 text-blue-600" />
                                        <span>{opt}</span>
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}

                              {req.type === 'boolean' && (
                                <div className="mt-2 flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded border border-neutral-200 dark:border-neutral-800">
                                  <input type="checkbox" disabled className="w-3.5 h-3.5 mt-0.5 rounded border-neutral-300 text-blue-600" />
                                  <span>{req.boolean_label || req.title}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="light" hasBorder size="sm" onClick={() => {
                                setNewReqTitle(req.title)
                                setNewReqDesc(req.description)
                                setNewReqMandatory(req.is_mandatory)
                                setNewReqType(req.type || 'text')
                                setNewReqOptions(req.options || [])
                                setNewReqOptionInput('')
                                setNewReqBooleanLabel(req.boolean_label || '')
                                setNewReqTags(req.tags || ['General'])
                                setNewReqTagInput('')
                                setNewReqLinkedFeatureId(req.linked_feature_id || '')
                                if (req.depends_on) {
                                  setNewReqIsConditional(true)
                                  setNewReqDependsOnId(req.depends_on.requirement_id)
                                  setNewReqDependsOnValue(req.depends_on.value)
                                } else {
                                  setNewReqIsConditional(false)
                                  setNewReqDependsOnId('')
                                  setNewReqDependsOnValue('')
                                }
                                setEditingReqIndex(originalIdx)
                              }}>
                                {t('products.edit', 'Editar')}
                              </Button>
                              <Button variant="danger" iconName="trash" size="sm" onClick={() => setNewRequirements(newRequirements.filter((_, i) => i !== originalIdx))} />
                            </div>
                          </div>

                          {Object.entries(dependentsByOption).map(([opt, deps]) => {
                            if (!deps || deps.length === 0) return null
                            return (
                              <div key={opt} className="ml-8 mt-3 relative">
                                <div className="absolute -left-4 top-4 w-4 h-px bg-neutral-300 dark:bg-neutral-700"></div>
                                <div className="absolute -left-4 -top-4 bottom-0 w-px bg-neutral-300 dark:bg-neutral-700"></div>
                                <div className="mb-2 relative z-10">
                                  <span className="text-[11px] font-semibold bg-container text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                    {opt}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-0 border-l border-neutral-200 dark:border-neutral-700 ml-3 pl-5 py-1">
                                  {deps.map((depReq: any) => renderRequirementNode(depReq, depth + 1))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    }

                    const rootReqs = newRequirements.filter(r => !r.depends_on || !newRequirements.find(p => p.id === r.depends_on?.requirement_id))
                    return (
                      <>
                        <div className="flex flex-col gap-2">
                          {rootReqs.map(r => renderRequirementNode(r, 0))}
                        </div>

                        {isCreatingReq ? (
                          <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-6">
                            {renderRequirementForm()}
                          </div>
                        ) : (
                          <div className="mt-6 flex justify-center border-t border-neutral-200 dark:border-neutral-800 pt-6">
                            <Button variant="light" hasBorder onClick={() => {
                              setNewReqTitle('')
                              setNewReqDesc('')
                              setNewReqMandatory(false)
                              setNewReqType('text')
                              setNewReqOptions([])
                              setNewReqOptionInput('')
                              setNewReqIsConditional(false)
                              setNewReqDependsOnId('')
                              setNewReqDependsOnValue('')
                              setEditingReqIndex(null)
                              setIsCreatingReq(true)
                            }}>
                              {t('products.addNewReq', '+ Añadir Nuevo Requisito')}
                            </Button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={() => handleFormSubmit()} className="min-w-[120px]">{editingId ? t('products.saveChanges', 'Guardar Cambios') : t('products.createProduct', 'Crear Producto')}</Button>
              </div>
            </div>
          )}

          {drawerTab === 'features' && (
            <div className="flex flex-col gap-6 px-1">
              <div className="bg-container rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{t('products.featuresTitle', 'Features')}</h3>
                <p className="text-sm text-neutral-800 mb-6">{t('products.featuresSubtitle', 'Administra los features técnicos de este producto.')}</p>

                <div className="flex flex-col gap-2">
                  {(() => {
                    const renderFeatureForm = () => (
                      <div className="border border-blue-500 bg-blue-50/10 p-5 rounded-xl flex flex-col gap-4 relative z-20 shadow-sm mt-2 mb-2">
                        <h4 className="font-semibold text-neutral-900 dark:text-white">{editingFeatIndex !== null ? t('products.editFeatureHeader', "Editar feature") : t('products.addFeatureHeader', "Añadir nuevo feature")}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.titleField', 'Título')}</label>
                            <input type="text" value={newFeatTitle} onChange={(e) => setNewFeatTitle(e.target.value)} placeholder="Ej: Entornos soportados" className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.featureType', 'Tipo de Feature')}</label>
                            <select
                              value={newFeatType}
                              onChange={(e: any) => setNewFeatType(e.target.value)}
                              className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                            >
                              <option value="text">{t('products.reqTypeDesc', 'Texto Descriptivo')}</option>
                              <option value="options">{t('products.reqTypeOptions', 'Lista de Opciones')}</option>
                              <option value="tasklist">{t('products.reqTypeTasklist', 'Lista de Tareas (Checklist)')}</option>
                              <option value="boolean">{t('products.reqTypeBoolean', 'Casilla (Checkbox)')}</option>
                              <option value="api_select">{t('products.featureTypeApi', 'Selección desde API Externa')}</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.reqDescInstructions', 'Descripción / Instrucciones')}</label>
                            <input type="text" value={newFeatDesc} onChange={(e) => setNewFeatDesc(e.target.value)} placeholder="Ej: Seleccione al menos uno" className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm" />
                          </div>
                        </div>

                        {newFeatType === 'boolean' && (
                          <div className="flex flex-col gap-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.checkboxText', 'Texto de la Casilla')}</label>
                            <input type="text" value={newFeatBooleanLabel} onChange={(e) => setNewFeatBooleanLabel(e.target.value)} placeholder="Ej: Confirmo que he verificado..." className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm" />
                          </div>
                        )}

                        {newFeatType === 'api_select' && (
                          <div className="flex flex-col gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.apiOriginUrl', 'URL del origen JSON (API)')}</label>
                              <input
                                type="url"
                                value={newFeatApiUrl}
                                onChange={(e) => setNewFeatApiUrl(e.target.value)}
                                placeholder="https://.../api/data.json"
                                className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.transformScript', 'Transform Script (JavaScript)')} <span className="text-neutral-400 font-normal text-xs">{t('products.optional', '(Opcional)')}</span></label>
                              <textarea
                                value={newFeatApiScript}
                                onChange={(e) => setNewFeatApiScript(e.target.value)}
                                placeholder="return data.items.map(item => ({ value: item.id, label: item.name }));"
                                className="h-24 p-3 font-mono rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-xs text-neutral-800 dark:text-neutral-200"
                              />
                              <p className="text-xs text-neutral-800 mt-1">{t('products.scriptHelper', "Escribe código JS para transformar 'data' en un array de objetos con `value` y `label`, o un array simple de strings.")}</p>
                            </div>
                          </div>
                        )}

                        {(newFeatType === 'options' || newFeatType === 'tasklist') && (
                          <div className="flex flex-col gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {newFeatType === 'options' ? t('products.selectableOptions', 'Opciones Seleccionables') : t('products.listItems', 'Elementos de la Lista')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {newFeatOptions.map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                                  {tag}
                                  <button type="button" onClick={() => setNewFeatOptions(newFeatOptions.filter((_, idx) => idx !== i))} className="hover:text-blue-900">
                                    <CaralIcon name="x" size={10} />
                                  </button>
                                </span>
                              ))}
                              {newFeatOptions.length === 0 && <span className="text-xs text-neutral-800">{t('products.addItemsBelow', 'Agrega elementos abajo...')}</span>}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newFeatOptionInput}
                                onChange={(e) => setNewFeatOptionInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    if (newFeatOptionInput.trim()) {
                                      setNewFeatOptions([...newFeatOptions, newFeatOptionInput.trim()])
                                      setNewFeatOptionInput('')
                                    }
                                  }
                                }}
                                placeholder={newFeatType === 'options' ? "Ej: AWS, presiona Enter" : "Ej: 5432: PostgreSQL, presiona Enter"}
                                className="flex-1 h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                              />
                              <Button
                                type="button"
                                variant="light"
                                onClick={() => {
                                  if (newFeatOptionInput.trim()) {
                                    setNewFeatOptions([...newFeatOptions, newFeatOptionInput.trim()])
                                    setNewFeatOptionInput('')
                                  }
                                }}
                              >
                                {t('products.add', 'Añadir')}
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <input id="req-conditional" type="checkbox" checked={newFeatIsConditional} onChange={(e) => {
                              setNewFeatIsConditional(e.target.checked)
                              if (!e.target.checked) {
                                setNewFeatDependsOnId('')
                                setNewFeatDependsOnValue('')
                              }
                            }} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="req-conditional" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">{t('products.isConditionalFeature', 'Es condicional (depende de otro feature)')}</label>
                          </div>

                          {newFeatIsConditional && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{t('products.parentFeature', 'Feature Padre')}</label>
                                <select
                                  value={newFeatDependsOnId}
                                  onChange={(e: any) => {
                                    setNewFeatDependsOnId(e.target.value)
                                    setNewFeatDependsOnValue('')
                                  }}
                                  className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                                >
                                  <option value="">{t('products.selectParentFeature', 'Selecciona un feature padre...')}</option>
                                  {newFeatures.filter(r => (r.type === 'options' || r.type === 'api_select') && r.id !== (editingFeatIndex !== null ? newFeatures[editingFeatIndex].id : '')).map(req => (
                                    <option key={req.id} value={req.id}>{req.title}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{t('products.whenValueIs', 'Cuando el valor sea...')}</label>
                                {(() => {
                                  const parentFeat = newFeatures.find(r => r.id === newFeatDependsOnId);
                                  if (parentFeat?.type === 'api_select') {
                                    return (
                                      <ApiDependencySelector
                                        url={parentFeat.api_url || ''}
                                        apiScript={parentFeat.api_script}
                                        value={newFeatDependsOnValue}
                                        onChange={(v) => setNewFeatDependsOnValue(v)}
                                      />
                                    )
                                  }
                                  return (
                                    <select
                                      value={newFeatDependsOnValue}
                                      onChange={(e: any) => setNewFeatDependsOnValue(e.target.value)}
                                      disabled={!newFeatDependsOnId}
                                      className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                                    >
                                      <option value="">{t('products.selectAnOption', 'Selecciona una opción...')}</option>
                                      {parentFeat?.options?.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  )
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 mt-1 mb-2">
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('products.tags', 'Etiquetas (Tags)')}</label>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {newFeatTags.map((tag, i) => (
                              <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {tag}
                                <button type="button" onClick={() => setNewFeatTags(newFeatTags.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                                  <CaralIcon name="x" size={10} />
                                </button>
                              </span>
                            ))}
                            {newFeatTags.length === 0 && <span className="text-[10px] text-neutral-500 italic mt-1">{t('products.tagsDefaultNotice', "Si no agregas nada, se asignará 'General' por defecto al guardar.")}</span>}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newFeatTagInput}
                              onChange={(e) => setNewFeatTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  if (newFeatTagInput.trim()) {
                                    setNewFeatTags([...newFeatTags, newFeatTagInput.trim()])
                                    setNewFeatTagInput('')
                                  }
                                }
                              }}
                              placeholder="Ej: Networking, Seguridad..."
                              className="flex-1 h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-container text-sm"
                            />
                            <Button
                              type="button"
                              variant="light"
                              onClick={() => {
                                if (newFeatTagInput.trim()) {
                                  setNewFeatTags([...newFeatTags, newFeatTagInput.trim()])
                                  setNewFeatTagInput('')
                                }
                              }}
                            >
                              {t('products.addTag', 'Añadir Tag')}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input id="req-mandatory" type="checkbox" checked={newFeatMandatory} onChange={(e) => setNewFeatMandatory(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                          <label htmlFor="req-mandatory" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">{t('products.isMandatory', 'Es obligatorio')}</label>
                        </div>


                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="light" onClick={() => {
                            setNewFeatTitle('')
                            setNewFeatDesc('')
                            setNewFeatMandatory(false)
                            setNewFeatType('text')
                            setNewFeatOptions([])
                            setNewFeatOptionInput('')
                            setNewFeatBooleanLabel('')
                            setNewFeatTags([])
                            setNewFeatTagInput('')
                            setNewFeatIsConditional(false)
                            setNewFeatDependsOnId('')
                            setNewFeatDependsOnValue('')
                            setNewFeatApiUrl('')
                            setNewFeatApiScript('')
                            setEditingFeatIndex(null)
                            setIsCreatingFeat(false)
                          }}>
                            {t('products.cancel', 'Cancelar')}
                          </Button>
                          <Button type="button" variant="light" hasBorder onClick={() => {
                            if (newFeatTitle) {
                              if ((newFeatType === 'options' || newFeatType === 'tasklist') && newFeatOptions.length === 0) {
                                alert(t('products.alertAddOption', "Agrega al menos una opción/elemento o cambia el tipo a Texto."))
                                return
                              }

                              if (newFeatIsConditional && (!newFeatDependsOnId || !newFeatDependsOnValue)) {
                                alert(t('products.alertFeatParent', "Debes seleccionar el feature padre y el valor requerido para la condición."))
                                return
                              }

                              const newFeat: any = {
                                id: editingFeatIndex !== null ? newFeatures[editingFeatIndex].id : Date.now().toString(),
                                title: newFeatTitle,
                                description: newFeatDesc,
                                is_mandatory: newFeatMandatory,
                                type: newFeatType,
                                options: (newFeatType === 'options' || newFeatType === 'tasklist') ? [...newFeatOptions] : undefined,
                                tags: newFeatTags.length > 0 ? [...newFeatTags] : ['General'],
                                boolean_label: newFeatType === 'boolean' ? newFeatBooleanLabel : undefined,
                                api_url: newFeatType === 'api_select' ? newFeatApiUrl : undefined,
                                api_script: newFeatType === 'api_select' ? newFeatApiScript : undefined
                              }

                              if (newFeatIsConditional) {
                                newFeat.depends_on = {
                                  requirement_id: newFeatDependsOnId,
                                  value: newFeatDependsOnValue
                                }
                              }

                              if (editingFeatIndex !== null) {
                                const updated = [...newFeatures]
                                updated[editingFeatIndex] = newFeat
                                setNewFeatures(updated)
                                setEditingFeatIndex(null)
                              } else {
                                setNewFeatures([...newFeatures, newFeat])
                                setIsCreatingFeat(false)
                              }

                              setNewFeatTitle('')
                              setNewFeatDesc('')
                              setNewFeatMandatory(false)
                              setNewFeatType('text')
                              setNewFeatOptions([])
                              setNewFeatOptionInput('')
                              setNewFeatBooleanLabel('')
                              setNewFeatTags([])
                              setNewFeatTagInput('')
                              setNewFeatIsConditional(false)
                              setNewFeatDependsOnId('')
                              setNewFeatDependsOnValue('')
                              setNewFeatApiUrl('')
                              setNewFeatApiScript('')
                            } else {
                              alert(t('products.alertTitleRequired', "El título es obligatorio"))
                            }
                          }}>{editingFeatIndex !== null ? t('products.saveChanges', "Guardar Cambios") : t('products.addToList', "Añadir a la lista")}</Button>
                        </div>
                      </div>
                    )

                    const renderFeatureNode = (req: any, depth: number = 0) => {
                      const originalIdx = newFeatures.findIndex(r => r.id === req.id)
                      if (editingFeatIndex === originalIdx) {
                        return <div key={req.id}>{renderFeatureForm()}</div>
                      }
                      const dependentsByOption: Record<string, any[]> = {}
                      newFeatures.filter(r => r.depends_on?.requirement_id === req.id).forEach(dep => {
                        const val = dep.depends_on.value || 'Condicional'
                        if (!dependentsByOption[val]) dependentsByOption[val] = []
                        dependentsByOption[val].push(dep)
                      })

                      return (
                        <div key={req.id} className={`flex flex-col ${depth > 0 ? 'mt-2' : 'mb-2'}`} style={{ marginLeft: depth > 0 ? `${depth * 2}rem` : '0' }}>
                          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-start justify-between bg-container shadow-sm relative z-10">
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-neutral-900 dark:text-white">{req.title}</h4>
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">{t('products.featureBadge', 'Feature')}</span>
                                {req.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">{t('products.mandatoryBadge', 'Obligatorio')}</span>}
                                {req.type === 'options' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium uppercase">{t('products.optionsBadge', 'Opciones')}</span>}
                                {req.type === 'tasklist' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium uppercase">{t('products.checklistBadge', 'Checklist')}</span>}
                                {req.type === 'boolean' && <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-medium uppercase">{t('products.booleanBadge', 'Casilla')}</span>}
                                {req.type === 'api_select' && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium uppercase">{t('products.apiBadge', 'API')}</span>}
                                {(req.tags || ['General']).map((tag: string, i: number) => (
                                  <span key={i} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                                ))}
                              </div>
                              <p className="text-sm text-neutral-800">{req.description}</p>

                              {(req.type === 'options' || req.type === 'tasklist') && req.options && req.options.length > 0 && (
                                <div className={req.type === 'options' ? "mt-2 flex flex-wrap gap-1.5" : "mt-2 flex flex-col gap-2 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded border border-neutral-200 dark:border-neutral-800"}>
                                  {req.options.map((opt: string, i: number) => (
                                    req.type === 'options' ? (
                                      <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full">{opt}</span>
                                    ) : (
                                      <div key={i} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                                        <input type="checkbox" disabled className="w-3.5 h-3.5 mt-0.5 rounded border-neutral-300 text-blue-600" />
                                        <span>{opt}</span>
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}

                              {req.type === 'boolean' && (
                                <div className="mt-2 flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded border border-neutral-200 dark:border-neutral-800">
                                  <input type="checkbox" disabled className="w-3.5 h-3.5 mt-0.5 rounded border-neutral-300 text-blue-600" />
                                  <span>{req.boolean_label || req.title}</span>
                                </div>
                              )}

                              {req.type === 'api_select' && (
                                <div className="w-full">
                                  {req.api_url && <ApiFeaturePreview url={req.api_url} apiScript={req.api_script} />}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="light" hasBorder size="sm" onClick={() => {
                                setNewFeatTitle(req.title)
                                setNewFeatDesc(req.description)
                                setNewFeatMandatory(req.is_mandatory)
                                setNewFeatType(req.type || 'text')
                                setNewFeatOptions(req.options || [])
                                setNewFeatOptionInput('')
                                setNewFeatBooleanLabel(req.boolean_label || '')
                                setNewFeatTags(req.tags || ['General'])
                                setNewFeatTagInput('')
                                setNewFeatApiUrl(req.api_url || '')
                                setNewFeatApiScript(req.api_script || '')
                                if (req.depends_on) {
                                  setNewFeatIsConditional(true)
                                  setNewFeatDependsOnId(req.depends_on.requirement_id)
                                  setNewFeatDependsOnValue(req.depends_on.value)
                                } else {
                                  setNewFeatIsConditional(false)
                                  setNewFeatDependsOnId('')
                                  setNewFeatDependsOnValue('')
                                }
                                setEditingFeatIndex(originalIdx)
                              }}>
                                {t('products.edit', 'Editar')}
                              </Button>
                              <Button variant="danger" iconName="trash" size="sm" onClick={() => setNewFeatures(newFeatures.filter((_, i) => i !== originalIdx))} />
                            </div>
                          </div>

                          {Object.entries(dependentsByOption).map(([opt, deps]) => {
                            if (!deps || deps.length === 0) return null
                            return (
                              <div key={opt} className="ml-8 mt-3 relative">
                                <div className="absolute -left-4 top-4 w-4 h-px bg-neutral-300 dark:bg-neutral-700"></div>
                                <div className="absolute -left-4 -top-4 bottom-0 w-px bg-neutral-300 dark:bg-neutral-700"></div>
                                <div className="mb-2 relative z-10">
                                  <span className="text-[11px] font-semibold bg-container text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                    {opt}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-0 border-l border-neutral-200 dark:border-neutral-700 ml-3 pl-5 py-1">
                                  {deps.map((depReq: any) => renderFeatureNode(depReq, depth + 1))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    }
                    const rootReqs = newFeatures.filter(r => !r.depends_on || !newFeatures.find(p => p.id === r.depends_on?.requirement_id))
                    return (
                      <>
                        <div className="flex flex-col gap-2">
                          {rootReqs.map(r => renderFeatureNode(r, 0))}
                        </div>

                        {isCreatingFeat ? (
                          <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-6">
                            {renderFeatureForm()}
                          </div>
                        ) : (
                          <div className="mt-6 flex justify-center border-t border-neutral-200 dark:border-neutral-800 pt-6">
                            <Button variant="light" hasBorder onClick={() => {
                              setNewFeatTitle('')
                              setNewFeatDesc('')
                              setNewFeatMandatory(false)
                              setNewFeatType('text')
                              setNewFeatOptions([])
                              setNewFeatOptionInput('')
                              setNewFeatIsConditional(false)
                              setNewFeatDependsOnId('')
                              setNewFeatDependsOnValue('')
                              setEditingFeatIndex(null)
                              setIsCreatingFeat(true)
                            }}>
                              {t('products.addNewFeature', '+ Añadir Nuevo Feature')}
                            </Button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={() => handleFormSubmit()} className="min-w-[120px]">{editingId ? t('products.saveChanges', 'Guardar Cambios') : t('products.createProduct', 'Crear Producto')}</Button>
              </div>
            </div>
          )}

          {drawerTab === 'assets' && (
            <div className="flex flex-col gap-8 px-2 py-4">
              {/* Header */}
              <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <CaralIcon name="eye" size={24} className="text-blue-600 dark:text-blue-400" />
                  {t('products.assetsTitle', 'Identidad Gráfica & Assets del Producto')}
                </h3>
                <p className="text-xs text-neutral-700 mt-1">
                  {t('products.assetsSubtitle', 'Configura el logotipo, tema base, paleta de colores y recursos de marca del producto.')}
                </p>
              </div>

              {/* 1. Origen del Logo / Isotipo */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">1</span>
                    {t('products.logoOriginSection', '1. Origen del Logo / Isotipo')}
                  </h4>
                  <p className="text-xs text-neutral-800">
                    {t('products.logoOriginDesc', 'Define si el producto utilizará un ícono de Brand de iconcaral2 o un logotipo personalizado.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opción A: Brand de iconcaral2 */}
                  <div
                    onClick={() => setNewAssets(prev => ({ ...prev, logo_type: 'brand' }))}
                    className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col gap-3 ${(newAssets.logo_type ?? 'brand') === 'brand'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-container'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <CaralIcon name="check" size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                            {t('products.logoOriginBrand', 'Brand de iconcaral2')}
                          </span>
                          <span className="text-[11px] text-neutral-800">
                            {t('products.logoOriginBrandDesc', 'Selecciona entre la biblioteca corporativa de Brand')}
                          </span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${(newAssets.logo_type ?? 'brand') === 'brand' ? 'border-blue-600 bg-blue-600' : 'border-neutral-400'
                        }`}>
                        {(newAssets.logo_type ?? 'brand') === 'brand' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    {(newAssets.logo_type ?? 'brand') === 'brand' && (
                      <div className="mt-2 flex flex-col gap-3">
                        {/* Selector de Ícono Brand Principal */}
                        <div className="pt-3 border-t border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 dark:bg-neutral-900/70 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                              {(newAssets.brand_icon || newIconName) ? (
                                (newAssets.brand_is_color ?? newUseBrand) ? (
                                  <Brand name={(newAssets.brand_icon || newIconName) as any} size={28} />
                                ) : (
                                  <CaralIcon name={(newAssets.brand_icon || newIconName) as any} size={28} className="text-blue-600 dark:text-blue-400" />
                                )
                              ) : (
                                <CaralIcon name="image" size={24} className="text-neutral-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                {(newAssets.brand_icon || newIconName) || t('products.noIconSelected', 'Sin ícono seleccionado')}
                              </p>
                              <p className="text-[10px] text-neutral-500">
                                {(newAssets.brand_is_color ?? newUseBrand) ? t('products.brandColorMode', 'Modo Color') : t('products.brandMonoMode', 'Modo Monocromático')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const nextColor = !(newAssets.brand_is_color ?? true)
                                setNewAssets(prev => ({ ...prev, brand_is_color: nextColor }))
                                setNewUseBrand(nextColor)
                              }}
                              className="px-2.5 py-1.5 text-[11px] font-medium rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                              {(newAssets.brand_is_color ?? newUseBrand) ? '🎨 Color' : '⬛ Mono'}
                            </button>
                            <Button
                              type="button"
                              size="sm"
                              variant="info"
                              onClick={(e: any) => {
                                e.stopPropagation()
                                setIsIconPickerOpen(true)
                              }}
                            >
                              {(newAssets.brand_icon || newIconName) ? t('products.changeBrandIcon', 'Cambiar Ícono') : t('products.selectBrandIcon', 'Seleccionar Ícono')}
                            </Button>
                          </div>
                        </div>

                        {/* Versión Dark del Isotipo (Carga de archivo para modo oscuro) */}
                        <div className="p-3 bg-neutral-900/90 dark:bg-neutral-950 border border-neutral-700/80 rounded-lg flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                              <span className="text-xs font-bold text-neutral-100">
                                {t('products.brandDarkVersion', 'Versión Dark del Isotipo (Modo Oscuro)')}
                              </span>
                            </div>
                            <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono">
                              Dark Isotype
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            {t('products.brandDarkVersionDesc', 'Carga un archivo de imagen (SVG/PNG) optimizado para fondos oscuros.')}
                          </p>

                          <div className="h-24 rounded-lg bg-[#0F172A] border border-neutral-700/60 flex flex-col items-center justify-center overflow-hidden relative">
                            {newAssets?.icon_dark ? (
                              <>
                                <img src={newAssets.icon_dark} alt="Icon Dark" className="w-full h-full object-contain p-2" />
                                <button
                                  type="button"
                                  onClick={() => setNewAssets(prev => ({ ...prev, icon_dark: '' }))}
                                  className="absolute top-1.5 right-1.5 bg-neutral-800/90 hover:bg-neutral-800 text-red-400 text-xs font-bold px-2 py-0.5 rounded shadow-xs transition-colors"
                                >
                                  {t('products.removeAsset', 'Quitar')}
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center flex-col opacity-80 hover:opacity-100 transition-opacity">
                                <FileUploader onUploadSuccess={(url) => setNewAssets(prev => ({ ...prev, icon_dark: url }))} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Opción B: Subir Logo Personalizado */}
                  <div
                    onClick={() => setNewAssets(prev => ({ ...prev, logo_type: 'custom' }))}
                    className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col gap-3 ${newAssets.logo_type === 'custom'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-container'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <CaralIcon name="upload" size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                            {t('products.logoOriginCustom', 'Subir Logo Personalizado')}
                          </span>
                          <span className="text-[11px] text-neutral-800">
                            {t('products.logoOriginCustomDesc', 'Carga un archivo de imagen propio (PNG, SVG, WebP)')}
                          </span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${newAssets.logo_type === 'custom' ? 'border-blue-600 bg-blue-600' : 'border-neutral-400'
                        }`}>
                        {newAssets.logo_type === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    {newAssets.logo_type === 'custom' && (
                      <div className="mt-2 pt-3 border-t border-purple-100 dark:border-purple-900/40 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                        {/* Custom Logo (Modo Claro) */}
                        <div className="bg-white/70 dark:bg-neutral-900/70 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              {t('products.customLogoLight', 'Logo Personalizado (Modo Claro)')}
                            </span>
                            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded font-mono">
                              Light
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-800">
                            {t('products.customLogoLightDesc', 'Versión para fondos claros (SVG, PNG, WebP)')}
                          </p>
                          {newAssets.custom_logo ? (
                            <div className="flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <div className="flex items-center gap-3">
                                <img src={newAssets.custom_logo} alt="Custom Logo Light" className="w-10 h-10 object-contain bg-container rounded p-1 border border-neutral-200 dark:border-neutral-700" />
                                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[180px]">Logo Claro Cargado</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setNewAssets(prev => ({ ...prev, custom_logo: '', logo_light: '' }))}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded bg-red-50 dark:bg-red-950/30"
                              >
                                {t('products.removeAsset', 'Quitar')}
                              </button>
                            </div>
                          ) : (
                            <div className="py-2 flex flex-col items-center justify-center">
                              <FileUploader
                                onUploadSuccess={(url) => {
                                  setNewAssets(prev => ({ ...prev, custom_logo: url, logo_light: url, logo_type: 'custom' }))
                                  setNewLightImage(url)
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Custom Logo (Modo Oscuro) */}
                        <div className="bg-neutral-900/90 dark:bg-neutral-950 p-3 rounded-lg border border-neutral-700/80 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-100">
                              {t('products.customLogoDark', 'Logo Personalizado (Modo Oscuro)')}
                            </span>
                            <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono">
                              Dark
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            {t('products.customLogoDarkDesc', 'Versión contrastada para fondos oscuros (SVG, PNG, WebP)')}
                          </p>
                          {newAssets.custom_logo_dark || newAssets.logo_dark ? (
                            <div className="flex items-center justify-between gap-3 bg-[#0F172A] p-2 rounded-lg border border-neutral-700">
                              <div className="flex items-center gap-3">
                                <img src={newAssets.custom_logo_dark || newAssets.logo_dark} alt="Custom Logo Dark" className="w-10 h-10 object-contain bg-neutral-950 rounded p-1 border border-neutral-700" />
                                <span className="text-xs font-medium text-neutral-200 truncate max-w-[180px]">Logo Oscuro Cargado</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setNewAssets(prev => ({ ...prev, custom_logo_dark: '', logo_dark: '' }))}
                                className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded bg-neutral-800"
                              >
                                {t('products.removeAsset', 'Quitar')}
                              </button>
                            </div>
                          ) : (
                            <div className="py-2 flex flex-col items-center justify-center">
                              <FileUploader
                                onUploadSuccess={(url) => {
                                  setNewAssets(prev => ({ ...prev, custom_logo_dark: url, logo_dark: url, logo_type: 'custom' }))
                                  setNewDarkImage(url)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Tema Base */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">2</span>
                    {t('products.themeBaseSection', '2. Tema Base')}
                  </h4>
                  <p className="text-xs text-neutral-800">
                    {t('products.themeBaseDesc', 'Selecciona el sistema de diseño base sobre el que se estructuran los estilos del producto.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Caral Design System */}
                  <div
                    onClick={() => setNewAssets(prev => ({ ...prev, theme_base: 'caral' }))}
                    className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col justify-between gap-3 ${(newAssets.theme_base ?? 'caral') === 'caral'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-container'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          CR
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {t('products.themeBaseCaral', 'Caral Design System')}
                            </span>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                              Oficial
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-800 block mt-0.5">
                            {t('products.themeBaseCaralDesc', 'Tema oficial de Caral con tokens y jerarquía corporativa')}
                          </span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${(newAssets.theme_base ?? 'caral') === 'caral' ? 'border-blue-600 bg-blue-600' : 'border-neutral-400'
                        }`}>
                        {(newAssets.theme_base ?? 'caral') === 'caral' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Custom Theme */}
                  <div
                    onClick={() => setNewAssets(prev => ({ ...prev, theme_base: 'custom' }))}
                    className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col justify-between gap-3 ${newAssets.theme_base === 'custom'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-container'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <CaralIcon name="settings" size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                            {t('products.themeBaseCustom', 'Custom (Personalizado)')}
                          </span>
                          <span className="text-[11px] text-neutral-800 block mt-0.5">
                            {t('products.themeBaseCustomDesc', 'Esquema de diseño completamente libre y personalizado')}
                          </span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${newAssets.theme_base === 'custom' ? 'border-blue-600 bg-blue-600' : 'border-neutral-400'
                        }`}>
                        {newAssets.theme_base === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Paleta de Colores de Marca */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">3</span>
                    {t('products.colorPaletteSection', '3. Paleta de Colores de Marca')}
                  </h4>
                  <p className="text-xs text-neutral-800">
                    {t('products.colorPaletteDesc', 'Establece los colores cromáticos principales para la interfaz y componentes del producto.')}
                  </p>
                </div>

                {(newAssets.theme_base ?? 'caral') === 'caral' ? (
                  activeColorSlot === null ? (
                    /* View 1: 5 Column Palette Bar (Image 1) */
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-5 gap-0 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-container divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                        {CARAL_COLOR_SLOTS.map((slot) => {
                          const hex = (newAssets.colors as any)?.[slot.key] || slot.defaultHex
                          const tokenName = newAssets.color_tokens?.[slot.key] || (CARAL_COLOR_LIBRARY.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.name || slot.defaultName)

                          return (
                            <button
                              key={slot.key}
                              type="button"
                              onClick={() => setActiveColorSlot(slot.key)}
                              className="group flex flex-col text-left transition-all hover:opacity-95 focus:outline-none cursor-pointer"
                            >
                              {/* Header Label (Primary, Secondary, Assent, Text, Background) */}
                              <div className="px-4 py-3 text-xs font-semibold text-neutral-800 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors bg-container">
                                {slot.label}
                              </div>

                              {/* Color Block */}
                              <div
                                className="w-full h-44 sm:h-52 relative transition-transform duration-200 group-hover:scale-[0.99]"
                                style={{ backgroundColor: hex }}
                              >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-neutral-800 text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs transition-opacity shadow-sm">
                                    {t('products.selectColor', 'Cambiar color')}
                                  </span>
                                </div>
                              </div>

                              {/* Token Name & HEX info */}
                              <div className="p-4 flex flex-col gap-1 bg-container border-t border-neutral-100 dark:border-neutral-800">
                                <span className="text-sm font-bold text-neutral-900 truncate">
                                  {tokenName}
                                </span>
                                <span className="text-xs font-mono text-neutral-800 uppercase">
                                  {hex}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    /* View 2: Color Library Selector (Image 2) */
                    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-container shadow-sm">
                      {/* Header with Slot Tabs & Back Button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveColorSlot(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                          >
                            <CaralIcon name="chevronLeft" size={14} />
                            {t('products.backToPalette', 'Volver a la paleta')}
                          </button>
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {CARAL_COLOR_SLOTS.find(s => s.key === activeColorSlot)?.label}
                          </span>
                        </div>

                        {/* Slot Switcher Tabs */}
                        <div className="flex flex-wrap items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                          {CARAL_COLOR_SLOTS.map((slot) => {
                            const isActive = activeColorSlot === slot.key
                            const hex = (newAssets.colors as any)?.[slot.key] || slot.defaultHex
                            return (
                              <button
                                key={slot.key}
                                type="button"
                                onClick={() => setActiveColorSlot(slot.key)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${isActive
                                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                                  : 'text-neutral-800 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                                  }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: hex }} />
                                {slot.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Color Grid matching Image 2 */}
                      <div className="grid grid-cols-3 gap-4 max-h-[440px] overflow-y-auto pr-1">
                        {CARAL_COLOR_LIBRARY.map((color) => {
                          const currentSlotHex = (newAssets.colors as any)?.[activeColorSlot]
                          const isSelected = currentSlotHex?.toLowerCase() === color.hex.toLowerCase()

                          return (
                            <button
                              key={`${color.group}-${color.name}`}
                              type="button"
                              onClick={() => {
                                setNewAssets(prev => ({
                                  ...prev,
                                  colors: {
                                    ...prev.colors,
                                    [activeColorSlot]: color.hex,
                                    ...(activeColorSlot === 'bg_light' && color.hex === '#18181B' ? { bg_dark: '#0B1329' } : {})
                                  },
                                  color_tokens: {
                                    ...prev.color_tokens,
                                    [activeColorSlot]: color.name
                                  }
                                }))
                              }}
                              className={`group flex flex-col gap-2 text-left p-1 rounded-2xl transition-all cursor-pointer ${isSelected
                                ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-900'
                                : 'hover:opacity-90'
                                }`}
                            >
                              {/* Swatch rounded box */}
                              <div
                                className="w-full h-20 rounded-xl shadow-2xs border border-neutral-200/80 dark:border-neutral-700/60 relative overflow-hidden transition-transform duration-200 group-hover:scale-[0.98]"
                                style={{ backgroundColor: color.hex }}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-blue-600 shadow-md flex items-center justify-center">
                                    <CaralIcon name="check" size={12} />
                                  </div>
                                )}
                              </div>

                              {/* Color Token Label */}
                              <span className={`text-xs font-semibold px-0.5 truncate ${isSelected
                                ? 'text-blue-600 dark:text-blue-400 font-bold'
                                : 'text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900'
                                }`}>
                                {color.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  /* Custom Theme Mode: Presets + Custom Color Pickers */
                  <div className="flex flex-col gap-4">
                    {/* Presets Sugeridos */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                        {t('products.palettePresets', 'Presets Sugeridos')}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setNewAssets(prev => ({
                                ...prev,
                                colors: {
                                  ...prev.colors,
                                  primary: preset.primary,
                                  secondary: preset.secondary,
                                  accent: preset.accent,
                                  bg_light: preset.bg_light,
                                  bg_dark: preset.bg_dark,
                                  text_main: preset.text_main
                                }
                              }))
                            }}
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-container hover:border-blue-500 dark:hover:border-blue-500 transition-all text-xs font-medium cursor-pointer shadow-2xs"
                          >
                            <div className="flex items-center -space-x-1">
                              <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900" style={{ backgroundColor: preset.primary }} />
                              <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900" style={{ backgroundColor: preset.secondary }} />
                              <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-neutral-900" style={{ backgroundColor: preset.accent }} />
                            </div>
                            <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {t(`products.${preset.key}`, preset.name)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pickers Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { key: 'primary', label: t('products.colorPrimary', 'Color Principal'), defaultVal: '#002B49' },
                        { key: 'secondary', label: t('products.colorSecondary', 'Color Secundario'), defaultVal: '#0072CE' },
                        { key: 'accent', label: t('products.colorAccent', 'Color de Acento'), defaultVal: '#00E19B' },
                        { key: 'bg_light', label: t('products.colorBgLight', 'Fondo Claro'), defaultVal: '#F8FAFC' },
                        { key: 'bg_dark', label: t('products.colorBgDark', 'Fondo Oscuro'), defaultVal: '#0F172A' },
                        { key: 'text_main', label: t('products.colorText', 'Color de Texto'), defaultVal: '#1E293B' },
                      ].map(({ key, label, defaultVal }) => {
                        const currentColor = (newAssets.colors as any)?.[key] || defaultVal
                        return (
                          <div key={key} className="flex flex-col gap-1.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container">
                            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 truncate" title={label}>
                              {label}
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-neutral-300 dark:border-neutral-700 shadow-2xs cursor-pointer">
                                <div className="w-full h-full" style={{ backgroundColor: currentColor }} />
                                <input
                                  type="color"
                                  value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#0072CE'}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setNewAssets(prev => ({
                                      ...prev,
                                      colors: { ...prev.colors, [key]: val }
                                    }))
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                              </div>
                              <input
                                type="text"
                                value={currentColor}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setNewAssets(prev => ({
                                    ...prev,
                                    colors: { ...prev.colors, [key]: val }
                                  }))
                                }}
                                className="w-full text-xs font-mono px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded focus:outline-none focus:border-blue-500 uppercase"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Live Mockup Preview */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/70 dark:bg-neutral-900/50 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <CaralIcon name="eye" size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-neutral-700">
                        {t('products.previewLiveTitle', 'Vista Previa de Marca')}
                      </span>
                    </div>

                    {/* Selector Modo Claro / Oscuro para la previsualización */}
                    <div className="flex items-center gap-1 bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('light')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${previewMode === 'light'
                          ? 'bg-white text-neutral-900 shadow-2xs'
                          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                          }`}
                      >
                        ☀️ Modo Claro
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('dark')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${previewMode === 'dark'
                          ? 'bg-neutral-900 text-white shadow-2xs'
                          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                          }`}
                      >
                        🌙 Modo Oscuro
                      </button>
                    </div>
                  </div>

                  {/* Simulated Product Card */}
                  <div
                    className="w-full max-w-md mx-auto rounded-xl p-5 shadow-lg border transition-all duration-300"
                    style={{
                      backgroundColor: previewMode === 'dark' ? (newAssets.colors?.bg_dark || '#0B1329') : (newAssets.colors?.bg_light || '#FFFFFF'),
                      borderColor: (newAssets.colors?.secondary || '#0072CE') + (previewMode === 'dark' ? '60' : '40'),
                      color: previewMode === 'dark' ? '#F8FAFC' : (newAssets.colors?.text_main || '#1E293B')
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden"
                          style={{
                            backgroundColor: previewMode === 'dark' ? 'rgba(255,255,255,0.08)' : (newAssets.colors?.primary || '#002B49') + '15',
                            border: `1px solid ${previewMode === 'dark' ? 'rgba(255,255,255,0.15)' : (newAssets.colors?.primary || '#002B49') + '30'}`
                          }}
                        >
                          {previewMode === 'dark' && newAssets.logo_type === 'brand' && newAssets.icon_dark ? (
                            <img src={newAssets.icon_dark} alt="Logo Dark" className="w-8 h-8 object-contain p-0.5" />
                          ) : previewMode === 'dark' && newAssets.logo_type === 'custom' && (newAssets.custom_logo_dark || newAssets.logo_dark) ? (
                            <img src={newAssets.custom_logo_dark || newAssets.logo_dark} alt="Logo Dark" className="w-8 h-8 object-contain p-0.5" />
                          ) : newAssets.logo_type === 'custom' && (newAssets.custom_logo || newAssets.logo_light) ? (
                            <img src={newAssets.custom_logo || newAssets.logo_light} alt="Logo" className="w-8 h-8 object-contain p-0.5" />
                          ) : (newAssets.brand_icon || newIconName) ? (
                            (newAssets.brand_is_color ?? newUseBrand) ? (
                              <Brand name={(newAssets.brand_icon || newIconName) as any} size={28} />
                            ) : (
                              <span style={{ color: previewMode === 'dark' ? '#FFFFFF' : (newAssets.colors?.primary || '#002B49') }}>
                                <CaralIcon name={(newAssets.brand_icon || newIconName) as any} size={28} />
                              </span>
                            )
                          ) : (
                            <span className="font-bold text-sm" style={{ color: previewMode === 'dark' ? '#FFFFFF' : (newAssets.colors?.primary || '#002B49') }}>
                              {newTitle ? newTitle.slice(0, 2).toUpperCase() : 'PR'}
                            </span>
                          )}
                        </div>

                        <div>
                          <h5
                            className="font-bold text-base leading-tight"
                            style={{
                              color: previewMode === 'dark' ? '#FFFFFF' : (newAssets.colors?.primary || '#002B49')
                            }}
                          >
                            {newTitle || 'Nombre del Producto'}
                          </h5>
                          <span
                            className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                            style={{
                              backgroundColor: (newAssets.colors?.accent || '#00E19B') + '25',
                              color: newAssets.colors?.accent || '#00E19B'
                            }}
                          >
                            {newCategory === 'own_tech' ? 'Own Tech' : 'Active Product'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shadow-xs transition-opacity hover:opacity-90"
                        style={{
                          backgroundColor: newAssets.colors?.secondary || '#0072CE'
                        }}
                      >
                        Demo
                      </button>
                    </div>

                    <p
                      className="text-xs mt-3 line-clamp-2"
                      style={{
                        color: previewMode === 'dark' ? 'rgba(248, 250, 252, 0.8)' : (newAssets.colors?.text_main || '#1E293B'),
                        opacity: 0.85
                      }}
                    >
                      {newDesc || 'Descripción general del producto y capacidades del ecosistema corporativo.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Isologos y Variantes de Marca */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">4</span>
                    {t('products.isologosSection', '4. Isologos y Variantes de Marca')}
                  </h4>
                  <p className="text-xs text-neutral-800">
                    {t('products.isologosDesc', 'Carga las diferentes versiones del logotipo para su correcta aplicación en distintos fondos.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logo Completo (Claro) */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {t('products.fullLogoLight', 'Logo Completo (Fondo Claro)')}
                      </span>
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded font-mono">
                        Light Mode
                      </span>
                    </div>
                    <div className="h-36 rounded-lg bg-neutral-50 border border-neutral-200 flex flex-col items-center justify-center overflow-hidden relative">
                      {newAssets?.logo_light ? (
                        <>
                          <img src={newAssets.logo_light} alt="Logo Claro" className="w-full h-full object-contain p-3" />
                          <button
                            type="button"
                            onClick={() => setNewAssets({ ...newAssets, logo_light: '' })}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 text-xs font-bold px-2 py-1 rounded shadow-xs transition-colors"
                          >
                            {t('products.removeAsset', 'Quitar')}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center flex-col opacity-80 hover:opacity-100 transition-opacity">
                          <FileUploader onUploadSuccess={(url) => setNewAssets({ ...newAssets, logo_light: url })} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logo Completo (Oscuro) */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {t('products.fullLogoDark', 'Logo Completo (Fondo Oscuro)')}
                      </span>
                      <span className="text-[10px] bg-neutral-900 text-neutral-300 px-2 py-0.5 rounded font-mono">
                        Dark Mode
                      </span>
                    </div>
                    <div className="h-36 rounded-lg bg-[#0F172A] border border-neutral-700 flex flex-col items-center justify-center overflow-hidden relative">
                      {newAssets?.logo_dark ? (
                        <>
                          <img src={newAssets.logo_dark} alt="Logo Oscuro" className="w-full h-full object-contain p-3" />
                          <button
                            type="button"
                            onClick={() => setNewAssets({ ...newAssets, logo_dark: '' })}
                            className="absolute top-2 right-2 bg-neutral-800/90 hover:bg-neutral-800 text-red-400 text-xs font-bold px-2 py-1 rounded shadow-xs transition-colors"
                          >
                            {t('products.removeAsset', 'Quitar')}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center flex-col opacity-80 hover:opacity-100 transition-opacity">
                          <FileUploader onUploadSuccess={(url) => setNewAssets({ ...newAssets, logo_dark: url })} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blanco y Negro (Positivo) */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                          {t('products.isologoPositiveBw', 'Blanco y Negro (Positivo)')}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {t('products.isologoPositiveBwHint', 'Para fondos claros / impresión en negro')}
                        </span>
                      </div>
                      <span className="text-[10px] bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded font-mono font-bold">
                        B&W (+)
                      </span>
                    </div>
                    <div className="h-36 rounded-lg bg-white border border-neutral-300 flex flex-col items-center justify-center overflow-hidden relative">
                      {newAssets?.logo_positive_bw ? (
                        <>
                          <img src={newAssets.logo_positive_bw} alt="B&W Positivo" className="w-full h-full object-contain p-3" />
                          <button
                            type="button"
                            onClick={() => setNewAssets({ ...newAssets, logo_positive_bw: '' })}
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 text-xs font-bold px-2 py-1 rounded shadow-xs transition-colors"
                          >
                            {t('products.removeAsset', 'Quitar')}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center flex-col opacity-80 hover:opacity-100 transition-opacity">
                          <FileUploader onUploadSuccess={(url) => setNewAssets({ ...newAssets, logo_positive_bw: url })} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blanco y Negro (Negativo) */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                          {t('products.isologoNegativeBw', 'Blanco y Negro (Negativo)')}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {t('products.isologoNegativeBwHint', 'Para fondos oscuros / monocromático en blanco')}
                        </span>
                      </div>
                      <span className="text-[10px] bg-neutral-950 text-white px-2 py-0.5 rounded font-mono font-bold border border-neutral-800">
                        B&W (-)
                      </span>
                    </div>
                    <div className="h-36 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center overflow-hidden relative">
                      {newAssets?.logo_negative_bw ? (
                        <>
                          <img src={newAssets.logo_negative_bw} alt="B&W Negativo" className="w-full h-full object-contain p-3" />
                          <button
                            type="button"
                            onClick={() => setNewAssets({ ...newAssets, logo_negative_bw: '' })}
                            className="absolute top-2 right-2 bg-neutral-900/90 hover:bg-neutral-900 text-red-400 text-xs font-bold px-2 py-1 rounded shadow-xs transition-colors"
                          >
                            {t('products.removeAsset', 'Quitar')}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center flex-col opacity-80 hover:opacity-100 transition-opacity">
                          <FileUploader onUploadSuccess={(url) => setNewAssets({ ...newAssets, logo_negative_bw: url })} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Zona de Seguridad */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">5</span>
                    {t('products.safetyZoneSection', '5. Zona de Seguridad y Proporciones')}
                  </h4>
                  <p className="text-xs text-neutral-800">
                    {t('products.safetyZoneDesc', 'Carga una imagen con el diagrama de márgenes mínimos y zona de protección del logotipo.')}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container flex flex-col gap-3">
                  <div className="h-44 rounded-lg bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:16px_16px] bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center overflow-hidden relative">
                    {newAssets?.safety_zone_image ? (
                      <>
                        <img src={newAssets.safety_zone_image} alt="Zona de Seguridad" className="w-full h-full object-contain p-4" />
                        <button
                          type="button"
                          onClick={() => setNewAssets({ ...newAssets, safety_zone_image: '' })}
                          className="absolute top-2 right-2 bg-white/90 dark:bg-neutral-900/90 hover:bg-white text-red-500 text-xs font-bold px-2 py-1 rounded shadow-xs transition-colors"
                        >
                          {t('products.removeAsset', 'Quitar')}
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center flex-col gap-2 p-4 text-center">
                        <CaralIcon name="grid" size={28} className="text-neutral-400" />
                        <span className="text-xs text-neutral-800 font-medium">
                          {t('products.safetyZoneUpload', 'Diagrama de Zona de Seguridad')}
                        </span>
                        <FileUploader onUploadSuccess={(url) => setNewAssets({ ...newAssets, safety_zone_image: url })} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. Portadas de Documentación / Battlecards */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">6</span>
                    {t('products.coverImagesSection', '6. Portadas y Recursos de Documentación')}
                  </h4>
                  <p className="text-xs text-neutral-800">
                    {t('products.coverImagesDesc', 'Portadas utilizadas para Battlecards, Documentación y Recursos compartidos.')}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-4 flex flex-wrap gap-4 items-center min-h-[140px]">
                  {(newAssets?.cover_images || []).map((coverUrl, idx) => (
                    <div key={idx} className="w-28 h-28 relative rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0 shadow-2xs group">
                      <img src={coverUrl} alt={`Portada ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedCovers = (newAssets.cover_images || []).filter((_, i) => i !== idx);
                          setNewAssets({ ...newAssets, cover_images: updatedCovers });
                        }}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white p-1 rounded-full text-[10px] opacity-80 group-hover:opacity-100 transition-opacity"
                      >
                        <CaralIcon name="x" size={12} />
                      </button>
                    </div>
                  ))}

                  <div className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg shrink-0 opacity-70 hover:opacity-100 transition-opacity bg-white dark:bg-neutral-800/50">
                    <FileUploader
                      onUploadSuccess={(url) => {
                        const updatedCovers = [...(newAssets.cover_images || []), url];
                        setNewAssets({ ...newAssets, cover_images: updatedCovers });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 7. Módulo Gráfico */}
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">7</span>
                      {t('products.graphicModuleTitle', 'Habilitar Módulo Gráfico')}
                    </span>
                    <p className="text-xs text-neutral-800 dark:text-neutral-400">
                      {t('products.graphicModuleDesc', 'Activa la identidad visual, colores y recursos gráficos del producto en la plataforma.')}
                    </p>
                  </div>
                  <Toggle
                    checked={newAssets.enable_graphic_module ?? true}
                    onChange={(checked) => setNewAssets(prev => ({ ...prev, enable_graphic_module: checked }))}
                  />
                </div>
              </div>

              {/* 8. Rack de Archivos Descargables */}
              {(newAssets.enable_graphic_module ?? true) && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">8</span>
                      {t('products.downloadableAssetsSection', '8. Assets y Recursos Descargables')}
                    </h4>
                    <p className="text-xs text-neutral-800 dark:text-neutral-400">
                      {t('products.downloadableAssetsDesc', 'Carga y gestiona el rack de archivos descargables (PNG, JPG, SVG) para este producto.')}
                    </p>
                  </div>

                  <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container flex flex-col gap-4 shadow-2xs">
                    {/* Multi-file Dropzone */}
                    <div className="relative">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDraggingRack(true)
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDraggingRack(true)
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDraggingRack(false)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDraggingRack(false)
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleUploadDownloadableAssets(e.dataTransfer.files)
                          }
                        }}
                        onClick={() => {
                          if (!isUploadingAssets) {
                            document.getElementById('downloadable-rack-input')?.click()
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          isDraggingRack
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                            : isUploadingAssets
                            ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800/60 border-blue-400'
                            : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2 pointer-events-none">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-mono">PNG</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-mono">JPG</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-mono">SVG</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 pointer-events-none text-center">
                          <CaralIcon name="file" size={16} className="text-blue-500" />
                          <span>
                            {isUploadingAssets
                              ? t('products.uploadingFiles', 'Subiendo archivos al rack...')
                              : isDraggingRack
                              ? 'Suelta los archivos aquí para subirlos al rack'
                              : t('products.dropFilesHere', 'Arrastra archivos PNG, JPG o SVG aquí o')}
                          </span>
                          {!isUploadingAssets && !isDraggingRack && (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2">
                              {t('products.browseFiles', 'explora en tu equipo')}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-1 pointer-events-none">
                          Soporta selección múltiple de archivos simultáneamente
                        </span>

                        <input
                          id="downloadable-rack-input"
                          type="file"
                          multiple
                          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                          disabled={isUploadingAssets}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleUploadDownloadableAssets(e.target.files)
                              e.target.value = ''
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Files Rack Grid */}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <CaralIcon name="file" size={14} className="text-neutral-500" />
                          {t('products.filesInRack', 'Archivos en el Rack')} ({newAssets.downloadable_assets?.length || 0})
                        </span>
                      </div>

                      {(!newAssets.downloadable_assets || newAssets.downloadable_assets.length === 0) ? (
                        <div className="p-6 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center gap-1.5 bg-neutral-50/40 dark:bg-neutral-900/30">
                          <CaralIcon name="file" size={24} className="text-neutral-400" />
                          <span className="text-xs text-neutral-500">
                            {t('products.emptyRack', 'No hay archivos en el rack aún. Sube recursos gráficos para habilitar su descarga.')}
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {newAssets.downloadable_assets.map((asset, idx) => {
                            const isSvg = asset.format?.toUpperCase() === 'SVG' || asset.name.toLowerCase().endsWith('.svg')
                            const isJpg = asset.format?.toUpperCase() === 'JPG' || asset.name.toLowerCase().endsWith('.jpg') || asset.name.toLowerCase().endsWith('.jpeg')
                            const badgeColor = isSvg
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                              : isJpg
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'

                            return (
                              <div
                                key={asset.id || idx}
                                className="group p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/80 dark:bg-neutral-800/40 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Thumbnail Preview */}
                                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                    <img
                                      src={asset.url}
                                      alt={asset.name}
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none'
                                      }}
                                    />
                                  </div>

                                  {/* File details */}
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate" title={asset.name}>
                                      {asset.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${badgeColor}`}>
                                        {asset.format || 'IMG'}
                                      </span>
                                      {asset.size && (
                                        <span className="text-[10px] text-neutral-500 font-mono">
                                          {asset.size}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <a
                                    href={asset.url}
                                    download={asset.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors"
                                    title={t('products.downloadAsset', 'Descargar')}
                                  >
                                    <CaralIcon name="arrowDownToLine" size={14} />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (newAssets.downloadable_assets || []).filter((_, i) => i !== idx)
                                      setNewAssets(prev => ({ ...prev, downloadable_assets: updated }))
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                                    title={t('products.deleteAsset', 'Eliminar')}
                                  >
                                    <CaralIcon name="trash" size={14} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 9. Información y Manual de Marca */}
              {(newAssets.enable_graphic_module ?? true) && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">9</span>
                      {t('products.brandGuidelinesSection', '9. Información y Manual de Marca')}
                    </h4>
                    <p className="text-xs text-neutral-800 dark:text-neutral-400">
                      {t('products.brandGuidelinesDesc', 'Documenta las directrices, reglas de aplicación y lineamientos de la identidad visual del producto.')}
                    </p>
                  </div>

                  <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container flex flex-col gap-5 shadow-2xs">
                    {/* 1. Información General de la Marca */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <CaralIcon name="file" size={14} className="text-blue-500" />
                        {t('products.brandInfoLabel', 'Información General de la Marca')}
                      </label>
                      <p className="text-[11px] text-neutral-500">
                        {t('products.brandInfoDesc', 'Historia, valores, tono de comunicación y narrativa de la marca.')}
                      </p>
                      <textarea
                        value={newAssets.brand_info || ''}
                        onChange={(e) => setNewAssets(prev => ({ ...prev, brand_info: e.target.value }))}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 bg-container text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y min-h-[85px]"
                        placeholder={t('products.brandInfoPlaceholder', 'Describe los principios, tono de voz o narrativa general de la marca del producto...')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 2. Información del Isologo / Isotipo */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <CaralIcon name="image" size={14} className="text-indigo-500" />
                          {t('products.isotypeInfoLabel', 'Información del Isologo / Isotipo')}
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          {t('products.isotypeInfoDesc', 'Construcción, reglas de uso y variantes del símbolo gráfico.')}
                        </p>
                        <textarea
                          value={newAssets.isotype_info || ''}
                          onChange={(e) => setNewAssets(prev => ({ ...prev, isotype_info: e.target.value }))}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 bg-container text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y min-h-[80px]"
                          placeholder={t('products.isotypeInfoPlaceholder', 'Especificaciones sobre el uso del símbolo o isotipo, aplicaciones correctas e incorrectas...')}
                        />
                      </div>

                      {/* 3. Información de la Zona de Seguridad */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <CaralIcon name="grid" size={14} className="text-emerald-500" />
                          {t('products.safetyZoneInfoLabel', 'Información de la Zona de Seguridad')}
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          {t('products.safetyZoneInfoDesc', 'Márgenes de resguardo, espaciados mínimos y área de protección.')}
                        </p>
                        <textarea
                          value={newAssets.safety_zone_info || ''}
                          onChange={(e) => setNewAssets(prev => ({ ...prev, safety_zone_info: e.target.value }))}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 bg-container text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y min-h-[80px]"
                          placeholder={t('products.safetyZoneInfoPlaceholder', "Define los márgenes de respeto mínimos (ej. 'x = altura del símbolo') y distancias con otros elementos...")}
                        />
                      </div>

                      {/* 4. Información de Positivo / Negativo */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <CaralIcon name="eye" size={14} className="text-amber-500" />
                          {t('products.positiveNegativeInfoLabel', 'Información de Positivo / Negativo')}
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          {t('products.positiveNegativeInfoDesc', 'Uso sobre fondos oscuros, claros, monocromáticos o fotografías.')}
                        </p>
                        <textarea
                          value={newAssets.positive_negative_info || ''}
                          onChange={(e) => setNewAssets(prev => ({ ...prev, positive_negative_info: e.target.value }))}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 bg-container text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y min-h-[80px]"
                          placeholder={t('products.positiveNegativeInfoPlaceholder', 'Pautas para la aplicación del logotipo en fondos claros (positivo), fondos oscuros (negativo) o monocromo...')}
                        />
                      </div>

                      {/* 5. Información de la Paleta de Color */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <CaralIcon name="settings" size={14} className="text-rose-500" />
                          {t('products.colorPaletteInfoLabel', 'Información de la Paleta de Color')}
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          {t('products.colorPaletteInfoDesc', 'Jerarquías cromáticas, combinaciones recomendadas y reglas de contraste.')}
                        </p>
                        <textarea
                          value={newAssets.color_palette_info || ''}
                          onChange={(e) => setNewAssets(prev => ({ ...prev, color_palette_info: e.target.value }))}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 bg-container text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y min-h-[80px]"
                          placeholder={t('products.colorPaletteInfoPlaceholder', 'Explicación sobre la jerarquía de colores, combinaciones permitidas, proporciones (60-30-10)...')}
                        />
                      </div>
                    </div>

                    {/* 6. Información de la Tipografía */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <CaralIcon name="file" size={14} className="text-purple-500" />
                        {t('products.typographyInfoLabel', 'Información de la Tipografía')}
                      </label>
                      <p className="text-[11px] text-neutral-500">
                        {t('products.typographyInfoDesc', 'Familias tipográficas oficiales, pesos, interlineados y jerarquías.')}
                      </p>
                      <textarea
                        value={newAssets.typography_info || ''}
                        onChange={(e) => setNewAssets(prev => ({ ...prev, typography_info: e.target.value }))}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2.5 bg-container text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y min-h-[85px]"
                        placeholder={t('products.typographyInfoPlaceholder', 'Fuentes tipográficas oficiales (ej. Inter, Poppins), pesos recomendados (Regular, Bold), jerarquías de texto...')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de Guardar */}
              <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                <Button type="button" onClick={() => handleFormSubmit()} className="min-w-[140px]">
                  {editingId ? t('products.saveChanges', 'Guardar Cambios') : t('products.createProduct', 'Crear Producto')}
                </Button>
              </div>
            </div>
          )}

        </div>
      </Drawer>
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        initialIconName={newAssets.brand_icon || newIconName}
        initialIsBrand={newAssets.brand_is_color ?? newUseBrand}
        onSelect={(iconName, isBrand) => {
          setNewIconName(iconName)
          setNewUseBrand(isBrand)
          setNewAssets(prev => ({
            ...prev,
            brand_icon: iconName,
            brand_is_color: isBrand,
            logo_type: 'brand'
          }))
          setIsIconPickerOpen(false)
        }}
      />
    </div>
  )
}
