'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button, Drawer, Tabs, Toggle } from 'caralstable'
import { Brand, CaralIcon } from 'iconcaral2'
import FileUploader from '@/app/components/FileUploader'
import IconPickerModal from '@/app/components/IconPickerModal'

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
    <div className="max-h-48 overflow-y-auto border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 p-2 flex flex-col gap-1.5">
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

export default function ProductosPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Drawer & Tabs State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'general' | 'visibility' | 'requirements' | 'features' | 'assets'>('general')
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<any[]>([])

  // Assets State
  const [newAssets, setNewAssets] = useState<{ logo_light?: string, logo_dark?: string, icon_dark?: string, cover_images?: string[] }>({})

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
    setNewAssets({})
    setDrawerTab('general')
    setIsDrawerOpen(true)
  }

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
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
            light_image: newLightImage,
            dark_image: newDarkImage,
            link_demo: newLinkDemo,
            link_landing: newLinkLanding,
            link_docs: newLinkDocs,
            icon_name: newIconName,
            hide_in_bento: newHideInBento || false,
            requirements: newRequirements,
            features: newFeatures,
            assets: { ...newAssets, use_brand: newUseBrand }
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
              light_image: newLightImage,
              dark_image: newDarkImage,
              order_index: products.length,
              link_demo: newLinkDemo,
              link_landing: newLinkLanding,
              link_docs: newLinkDocs,
              icon_name: newIconName,
              hide_in_bento: newHideInBento,
              requirements: newRequirements,
              features: newFeatures,
              assets: { ...newAssets, use_brand: newUseBrand }
            }
          ]).select()
        if (error) throw error
        productId = data[0].id
        alert('Producto creado!')
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
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
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
    setNewAssets(p.assets || {})
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
          Gestión de Productos
        </h1>
        <Button onClick={openCreateDrawer}>
          Nuevo Producto
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {products.map((p, index) => (
              <div
                key={p.id}
                className={`
                  border rounded-xl p-4 flex gap-4 relative transition-all
                  border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900
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
                        Editar
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
        title={editingId ? "Editar Producto" : "Crear Nuevo Producto"}
        size="lg"
      >
        <div className="w-full mb-6">
          <Tabs
            tabs={[{ label: 'General' }, { label: 'Visibilidad' }, { label: 'Requisitos' }, { label: 'Features' }, { label: 'Assets' }]}
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
                    className="w-10 h-10 flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
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
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Titulo</label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Ej: Crestone"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Titulo (Slug)</label>
                  <input
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Ej: crestone"
                  />
                </div>
              </div>

              {/* Fila 2: Descripción */}
              <div className="grid grid-cols-[auto_1fr_1fr] gap-4">
                <div className="w-10 invisible"></div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Descripcion</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500 h-28 resize-none"
                    placeholder="Descripción del producto..."
                  />
                </div>
              </div>

              {/* Fila 3: Estado, Categoría */}
              <div className="grid grid-cols-[auto_1fr_1fr] gap-4">
                <div className="w-10 invisible"></div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Estado</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Publicada">Publicada</option>
                    <option value="Borrador">Borrador</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="own_tech">Own Tech</option>
                    <option value="actin">Act-in</option>
                  </select>
                </div>
              </div>

              {/* Links Section */}
              <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="bg-[#EAF0F6] dark:bg-neutral-800/50 px-4 py-2 font-semibold text-[#667C99] dark:text-neutral-300 text-sm">
                  Links
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 bg-white dark:bg-neutral-900/20">
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Live Demo</label>
                    <input
                      value={newLinkDemo}
                      onChange={(e) => setNewLinkDemo(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Crestone.io"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Landing</label>
                    <input
                      value={newLinkLanding}
                      onChange={(e) => setNewLinkLanding(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Crestone"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Documentacion</label>
                    <input
                      value={newLinkDocs}
                      onChange={(e) => setNewLinkDocs(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Crestone-help.com"
                    />
                  </div>
                </div>
              </div>

              {/* Mostrar en el Inicio Section */}
              <div className="mt-2 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="bg-[#EAF0F6] dark:bg-neutral-800/50 px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-[#667C99] dark:text-neutral-300 text-sm">Mostrar en el Inicio</span>
                  <Toggle
                    checked={!newHideInBento}
                    onChange={(checked) => setNewHideInBento(!checked)}
                  />
                </div>

                {!newHideInBento && (
                  <div className="p-4 bg-white dark:bg-neutral-900/20">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-[#869AB5] dark:text-neutral-400 mb-2">Destacada (Modo Claro)</label>
                        <div className="h-32 rounded-lg bg-[#EAEFF4] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-[#869AB5] dark:text-neutral-400 overflow-hidden relative">
                          {newLightImage ? (
                            <>
                              <img src={newLightImage} alt="Preview Claro" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setNewLightImage('')} className="absolute top-2 right-2 bg-white/80 p-1 rounded text-red-500 hover:bg-white">Quitar</button>
                            </>
                          ) : (
                            <div className="flex items-center flex-col scale-75 opacity-70 hover:opacity-100 transition-opacity">
                              <FileUploader onUploadSuccess={(url) => setNewLightImage(url)} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#869AB5] dark:text-neutral-400 mb-2">Destacada (Modo oscuro)</label>
                        <div className="h-32 rounded-lg bg-[#EAEFF4] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-[#869AB5] dark:text-neutral-400 overflow-hidden relative">
                          {newDarkImage ? (
                            <>
                              <img src={newDarkImage} alt="Preview Oscuro" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setNewDarkImage('')} className="absolute top-2 right-2 bg-white/80 p-1 rounded text-red-500 hover:bg-white">Quitar</button>
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
                        label="Activar modo Super"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="min-w-[120px]">{editingId ? "Guardar Cambios" : "Crear Producto"}</Button>
              </div>

              {/* Zona de peligro */}
              {editingId && (
                <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Zona de peligro</h3>
                  <p className="text-sm text-neutral-800 mb-4">Tenga cuidado con las siguientes funciones ya que no se pueden deshacer.</p>

                  <div className="border border-red-200 dark:border-red-900/50 bg-[#FDEEED] dark:bg-red-950/20 rounded-md p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-[#641A1B] dark:text-red-400 mb-1">Eliminar Producto</h4>
                      <p className="text-sm text-[#641A1B] dark:text-red-500 font-medium">El producto no estará más disponible y todo su contenido creado quedará huérfano.</p>
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

                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </form>
          )}

          {drawerTab === 'visibility' && (
            <div className="flex flex-col gap-6 px-1">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Visibilidad por Roles</h3>
                <p className="text-sm text-neutral-800 mb-6">Selecciona los roles que tendrán acceso de lectura a este producto.</p>

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
                    Seleccionar todos
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
                <Button type="button" onClick={() => handleFormSubmit()} className="min-w-[120px]">{editingId ? "Guardar Cambios" : "Crear Producto"}</Button>
              </div>
            </div>
          )}

          {drawerTab === 'requirements' && (
            <div className="flex flex-col gap-6 px-1">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Requisitos</h3>
                <p className="text-sm text-neutral-800 mb-6">Administra los requisitos técnicos de este producto.</p>

                <div className="flex flex-col gap-2">
                  {(() => {
                    const renderRequirementForm = () => (
                      <div className="border border-blue-500 bg-blue-50/10 p-5 rounded-xl flex flex-col gap-4 relative z-20 shadow-sm mt-2 mb-2">
                        <h4 className="font-semibold text-neutral-900 dark:text-white">{editingReqIndex !== null ? "Editar requisito" : "Añadir nuevo requisito"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Título</label>
                            <input type="text" value={newReqTitle} onChange={(e) => setNewReqTitle(e.target.value)} placeholder="Ej: Entornos soportados" className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tipo de Requisito</label>
                            <select
                              value={newReqType}
                              onChange={(e: any) => setNewReqType(e.target.value)}
                              className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                            >
                              <option value="text">Texto Descriptivo</option>
                              <option value="options">Lista de Opciones</option>
                              <option value="tasklist">Lista de Tareas (Checklist)</option>
                              <option value="boolean">Casilla (Checkbox)</option>
                              <option value="feature_question">Pregunta de Feature</option>
                            </select>
                          </div>
                          {newReqType !== 'feature_question' && (
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Descripción / Instrucciones</label>
                              <input type="text" value={newReqDesc} onChange={(e) => setNewReqDesc(e.target.value)} placeholder="Ej: Seleccione al menos uno" className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                            </div>
                          )}
                        </div>

                        {newReqType === 'feature_question' && (
                          <div className="flex flex-col gap-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Selecciona la Feature Comercial vinculada</label>
                            <select
                              value={newReqLinkedFeatureId}
                              onChange={(e) => setNewReqLinkedFeatureId(e.target.value)}
                              className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                            >
                              <option value="">Selecciona una feature...</option>
                              {newFeatures.map(f => (
                                <option key={f.id} value={f.id}>{f.title}</option>
                              ))}
                            </select>
                            <p className="text-xs text-neutral-500 mt-1">Este requisito heredará las opciones y lógica de la Feature seleccionada y siempre será opcional en la matriz.</p>
                          </div>
                        )}

                        {newReqType === 'boolean' && (
                          <div className="flex flex-col gap-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Texto de la Casilla</label>
                            <input type="text" value={newReqBooleanLabel} onChange={(e) => setNewReqBooleanLabel(e.target.value)} placeholder="Ej: Confirmo que he verificado..." className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                          </div>
                        )}

                        {(newReqType === 'options' || newReqType === 'tasklist') && (
                          <div className="flex flex-col gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {newReqType === 'options' ? 'Opciones Seleccionables' : 'Elementos de la Lista'}
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
                              {newReqOptions.length === 0 && <span className="text-xs text-neutral-800">Agrega elementos abajo...</span>}
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
                                className="flex-1 h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
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
                                Añadir
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
                            <label htmlFor="req-conditional" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Es condicional (depende de otro requisito)</label>
                          </div>

                          {newReqIsConditional && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Requisito Padre</label>
                                <select
                                  value={newReqDependsOnId}
                                  onChange={(e: any) => {
                                    setNewReqDependsOnId(e.target.value)
                                    setNewReqDependsOnValue('')
                                  }}
                                  className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                                >
                                  <option value="">Selecciona un requisito de opciones...</option>
                                  {newRequirements.filter(r => r.type === 'options' && r.id !== (editingReqIndex !== null ? newRequirements[editingReqIndex].id : '')).map(req => (
                                    <option key={req.id} value={req.id}>{req.title}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Cuando el valor sea...</label>
                                <select
                                  value={newReqDependsOnValue}
                                  onChange={(e: any) => setNewReqDependsOnValue(e.target.value)}
                                  disabled={!newReqDependsOnId}
                                  className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                                >
                                  <option value="">Selecciona una opción...</option>
                                  {newRequirements.find(r => r.id === newReqDependsOnId)?.options?.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 mt-1 mb-2">
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Etiquetas (Tags)</label>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {newReqTags.map((tag, i) => (
                              <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {tag}
                                <button type="button" onClick={() => setNewReqTags(newReqTags.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                                  <CaralIcon name="x" size={10} />
                                </button>
                              </span>
                            ))}
                            {newReqTags.length === 0 && <span className="text-[10px] text-neutral-500 italic mt-1">Si no agregas nada, se asignará 'General' por defecto al guardar.</span>}
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
                              className="flex-1 h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
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
                              Añadir Tag
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input id="req-mandatory" type="checkbox" checked={newReqMandatory} onChange={(e) => setNewReqMandatory(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                          <label htmlFor="req-mandatory" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">Es obligatorio</label>
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
                            Cancelar
                          </Button>
                          <Button type="button" variant="light" hasBorder onClick={() => {
                            if (newReqTitle) {
                              if ((newReqType === 'options' || newReqType === 'tasklist') && newReqOptions.length === 0) {
                                alert("Agrega al menos una opción/elemento o cambia el tipo a Texto.")
                                return
                              }
                              if (newReqType === 'feature_question' && !newReqLinkedFeatureId) {
                                alert("Debes seleccionar a qué Feature apunta esta pregunta.")
                                return
                              }

                              if (newReqIsConditional && (!newReqDependsOnId || !newReqDependsOnValue)) {
                                alert("Debes seleccionar el requisito padre y el valor requerido para la condición.")
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
                              alert("El título es obligatorio")
                            }
                          }}>{editingReqIndex !== null ? "Guardar Cambios" : "Añadir a la lista"}</Button>
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
                          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-start justify-between bg-white dark:bg-neutral-900 shadow-sm relative z-10">
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-neutral-900 dark:text-white">{req.title}</h4>
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">Requisito</span>
                                {req.is_mandatory && req.type !== 'feature_question' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">Obligatorio</span>}
                                {req.type === 'options' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium uppercase">Opciones</span>}
                                {req.type === 'tasklist' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium uppercase">Checklist</span>}
                                {req.type === 'boolean' && <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-medium uppercase">Casilla</span>}
                                {req.type === 'feature_question' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium uppercase">Pregunta Feature</span>}
                                {(req.tags || ['General']).map((tag: string, i: number) => (
                                  <span key={i} className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                                ))}
                              </div>
                              {req.type !== 'feature_question' && <p className="text-sm text-neutral-800">{req.description}</p>}
                              
                              {req.type === 'feature_question' && (
                                <div className="mt-2 text-xs text-neutral-700 dark:text-neutral-300 bg-amber-50/50 p-2 rounded border border-amber-200/50">
                                  Vinculado a la feature comercial: <strong className="font-semibold">{newFeatures.find(f => f.id === req.linked_feature_id)?.title || 'Desconocida'}</strong>
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
                                Editar
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
                                  <span className="text-[11px] font-semibold bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
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
                              setNewReqCategory('requisito')
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
                              + Añadir Nuevo Requisito
                            </Button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={() => handleFormSubmit()} className="min-w-[120px]">{editingId ? "Guardar Cambios" : "Crear Producto"}</Button>
              </div>
            </div>
          )}

          {drawerTab === 'features' && (
            <div className="flex flex-col gap-6 px-1">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Features</h3>
                <p className="text-sm text-neutral-800 mb-6">Administra los features técnicos de este producto.</p>

                <div className="flex flex-col gap-2">
                  {(() => {
                    const renderFeatureForm = () => (
                      <div className="border border-blue-500 bg-blue-50/10 p-5 rounded-xl flex flex-col gap-4 relative z-20 shadow-sm mt-2 mb-2">
                        <h4 className="font-semibold text-neutral-900 dark:text-white">{editingFeatIndex !== null ? "Editar feature" : "Añadir nuevo feature"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Título</label>
                            <input type="text" value={newFeatTitle} onChange={(e) => setNewFeatTitle(e.target.value)} placeholder="Ej: Entornos soportados" className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tipo de Feature</label>
                            <select
                              value={newFeatType}
                              onChange={(e: any) => setNewFeatType(e.target.value)}
                              className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                            >
                              <option value="text">Texto Descriptivo</option>
                              <option value="options">Lista de Opciones</option>
                              <option value="tasklist">Lista de Tareas (Checklist)</option>
                              <option value="boolean">Casilla (Checkbox)</option>
                              <option value="api_select">Selección desde API Externa</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Descripción / Instrucciones</label>
                            <input type="text" value={newFeatDesc} onChange={(e) => setNewFeatDesc(e.target.value)} placeholder="Ej: Seleccione al menos uno" className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                          </div>
                        </div>

                        {newFeatType === 'boolean' && (
                          <div className="flex flex-col gap-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Texto de la Casilla</label>
                            <input type="text" value={newFeatBooleanLabel} onChange={(e) => setNewFeatBooleanLabel(e.target.value)} placeholder="Ej: Confirmo que he verificado..." className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm" />
                          </div>
                        )}

                        {newFeatType === 'api_select' && (
                          <div className="flex flex-col gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 mb-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">URL del origen JSON (API)</label>
                              <input
                                type="url"
                                value={newFeatApiUrl}
                                onChange={(e) => setNewFeatApiUrl(e.target.value)}
                                placeholder="https://.../api/data.json"
                                className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Transform Script (JavaScript) <span className="text-neutral-400 font-normal text-xs">(Opcional)</span></label>
                              <textarea
                                value={newFeatApiScript}
                                onChange={(e) => setNewFeatApiScript(e.target.value)}
                                placeholder="return data.items.map(item => ({ value: item.id, label: item.name }));"
                                className="h-24 p-3 font-mono rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200"
                              />
                              <p className="text-xs text-neutral-800 mt-1">Escribe código JS para transformar 'data' en un array de objetos con `value` y `label`, o un array simple de strings.</p>
                            </div>
                          </div>
                        )}

                        {(newFeatType === 'options' || newFeatType === 'tasklist') && (
                          <div className="flex flex-col gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {newFeatType === 'options' ? 'Opciones Seleccionables' : 'Elementos de la Lista'}
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
                              {newFeatOptions.length === 0 && <span className="text-xs text-neutral-800">Agrega elementos abajo...</span>}
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
                                className="flex-1 h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
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
                                Añadir
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
                            <label htmlFor="req-conditional" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">Es condicional (depende de otro feature)</label>
                          </div>

                          {newFeatIsConditional && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Feature Padre</label>
                                <select
                                  value={newFeatDependsOnId}
                                  onChange={(e: any) => {
                                    setNewFeatDependsOnId(e.target.value)
                                    setNewFeatDependsOnValue('')
                                  }}
                                  className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                                >
                                  <option value="">Selecciona un feature padre...</option>
                                  {newFeatures.filter(r => (r.type === 'options' || r.type === 'api_select') && r.id !== (editingFeatIndex !== null ? newFeatures[editingFeatIndex].id : '')).map(req => (
                                    <option key={req.id} value={req.id}>{req.title}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Cuando el valor sea...</label>
                                {(() => {
                                  const parentFeat = newFeatures.find(r => r.id === newFeatDependsOnId);
                                  if (parentFeat?.type === 'api_select') {
                                    return (
                                      <ApiDependencySelector 
                                        url={parentFeat.api_url} 
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
                                      className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                                    >
                                      <option value="">Selecciona una opción...</option>
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
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Etiquetas (Tags)</label>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {newFeatTags.map((tag, i) => (
                              <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {tag}
                                <button type="button" onClick={() => setNewFeatTags(newFeatTags.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                                  <CaralIcon name="x" size={10} />
                                </button>
                              </span>
                            ))}
                            {newFeatTags.length === 0 && <span className="text-[10px] text-neutral-500 italic mt-1">Si no agregas nada, se asignará 'General' por defecto al guardar.</span>}
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
                              className="flex-1 h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
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
                              Añadir Tag
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input id="req-mandatory" type="checkbox" checked={newFeatMandatory} onChange={(e) => setNewFeatMandatory(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                          <label htmlFor="req-mandatory" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">Es obligatorio</label>
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
                            Cancelar
                          </Button>
                          <Button type="button" variant="light" hasBorder onClick={() => {
                            if (newFeatTitle) {
                              if ((newFeatType === 'options' || newFeatType === 'tasklist') && newFeatOptions.length === 0) {
                                alert("Agrega al menos una opción/elemento o cambia el tipo a Texto.")
                                return
                              }

                              if (newFeatIsConditional && (!newFeatDependsOnId || !newFeatDependsOnValue)) {
                                alert("Debes seleccionar el feature padre y el valor requerido para la condición.")
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
                              alert("El título es obligatorio")
                            }
                          }}>{editingFeatIndex !== null ? "Guardar Cambios" : "Añadir a la lista"}</Button>
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
                          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-start justify-between bg-white dark:bg-neutral-900 shadow-sm relative z-10">
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-neutral-900 dark:text-white">{req.title}</h4>
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">Feature</span>
                                {req.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">Obligatorio</span>}
                                {req.type === 'options' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium uppercase">Opciones</span>}
                                {req.type === 'tasklist' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium uppercase">Checklist</span>}
                                {req.type === 'boolean' && <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-medium uppercase">Casilla</span>}
                                {req.type === 'api_select' && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium uppercase">API</span>}
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
                                Editar
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
                                  <span className="text-[11px] font-semibold bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
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
                              setNewFeatCategory('feature')
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
                              + Añadir Nuevo Feature
                            </Button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={() => handleFormSubmit()} className="min-w-[120px]">{editingId ? "Guardar Cambios" : "Crear Producto"}</Button>
              </div>
            </div>
          )}

          {drawerTab === 'assets' && (
            <div className="flex flex-col gap-6 px-4 py-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Assets del Producto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Light */}
                <div>
                  <label className="block text-sm font-bold text-[#869AB5] dark:text-neutral-400 mb-2">Logo Completo (Claro)</label>
                  <div className="h-40 rounded-lg bg-[#EAEFF4] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center overflow-hidden relative">
                    {newAssets?.logo_light ? (
                      <>
                        <img src={newAssets.logo_light} alt="Logo Claro" className="w-full h-full object-contain p-2" />
                        <button type="button" onClick={() => setNewAssets({...newAssets, logo_light: ''})} className="absolute top-2 right-2 bg-white/80 p-1 rounded text-red-500 hover:bg-white">Quitar</button>
                      </>
                    ) : (
                      <div className="flex items-center flex-col opacity-70 hover:opacity-100 transition-opacity">
                        <FileUploader onUploadSuccess={(url) => setNewAssets({...newAssets, logo_light: url})} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo Dark */}
                <div>
                  <label className="block text-sm font-bold text-[#869AB5] dark:text-neutral-400 mb-2">Logo Completo (Oscuro)</label>
                  <div className="h-40 rounded-lg bg-[#EAEFF4] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center overflow-hidden relative">
                    {newAssets?.logo_dark ? (
                      <>
                        <img src={newAssets.logo_dark} alt="Logo Oscuro" className="w-full h-full object-contain p-2 bg-neutral-900" />
                        <button type="button" onClick={() => setNewAssets({...newAssets, logo_dark: ''})} className="absolute top-2 right-2 bg-white/80 p-1 rounded text-red-500 hover:bg-white">Quitar</button>
                      </>
                    ) : (
                      <div className="flex items-center flex-col opacity-70 hover:opacity-100 transition-opacity">
                        <FileUploader onUploadSuccess={(url) => setNewAssets({...newAssets, logo_dark: url})} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Icon Dark */}
                <div>
                  <label className="block text-sm font-bold text-[#869AB5] dark:text-neutral-400 mb-2">Icono (Oscuro)</label>
                  <div className="h-40 rounded-lg bg-[#EAEFF4] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center overflow-hidden relative">
                    {newAssets?.icon_dark ? (
                      <>
                        <img src={newAssets.icon_dark} alt="Icono Oscuro" className="w-full h-full object-contain p-2 bg-neutral-900" />
                        <button type="button" onClick={() => setNewAssets({...newAssets, icon_dark: ''})} className="absolute top-2 right-2 bg-white/80 p-1 rounded text-red-500 hover:bg-white">Quitar</button>
                      </>
                    ) : (
                      <div className="flex items-center flex-col opacity-70 hover:opacity-100 transition-opacity">
                        <FileUploader onUploadSuccess={(url) => setNewAssets({...newAssets, icon_dark: url})} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Images */}
                <div>
                  <label className="block text-sm font-bold text-[#869AB5] dark:text-neutral-400 mb-2">Portadas (Battlecards / Docs)</label>
                  <div className="rounded-lg bg-[#EAEFF4] dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 flex flex-wrap gap-4 items-center min-h-[160px]">
                    {(newAssets?.cover_images || []).map((coverUrl, idx) => (
                      <div key={idx} className="w-24 h-24 relative rounded overflow-hidden border border-neutral-300 dark:border-neutral-600 shrink-0">
                        <img src={coverUrl} alt={`Portada ${idx + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => {
                            const updatedCovers = (newAssets.cover_images || []).filter((_, i) => i !== idx);
                            setNewAssets({...newAssets, cover_images: updatedCovers});
                          }} 
                          className="absolute top-1 right-1 bg-white/80 p-0.5 rounded text-red-500 hover:bg-white text-[10px]"
                        >
                          X
                        </button>
                      </div>
                    ))}
                    
                    <div className="w-24 h-24 flex items-center justify-center border border-dashed border-neutral-400 dark:border-neutral-600 rounded shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                      <FileUploader 
                        onUploadSuccess={(url) => {
                          const updatedCovers = [...(newAssets.cover_images || []), url];
                          setNewAssets({...newAssets, cover_images: updatedCovers});
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={() => handleFormSubmit()} className="min-w-[120px]">{editingId ? "Guardar Cambios" : "Crear Producto"}</Button>
              </div>
            </div>
          )}

        </div>
      </Drawer>
      <IconPickerModal 
        isOpen={isIconPickerOpen} 
        onClose={() => setIsIconPickerOpen(false)} 
        onSelect={(iconName, isBrand) => { 
          setNewIconName(iconName)
          setNewUseBrand(isBrand)
          setIsIconPickerOpen(false)
        }} 
      />
    </div>
  )
}
