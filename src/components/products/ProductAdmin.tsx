"use client"

import React, { useEffect, useState } from 'react'
// Tipo para product_key a crear
type ProductKeyInput = {
  license_key: string
  status?: string
  expiration_date?: string
  activation_limit?: number
}
// Tipo para product_key existente
type ProductKey = {
  id: string
  product_id: string
  license_key: string
  user_id?: string
  status?: string
  expiration_date?: string
  activation_limit?: number
  created_at?: string
  updated_at?: string
}
import { convertFileToBase64 } from '../../lib/utils.client'

type Product = {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string | null
  stock_quantity: number
  created_at?: string
  updated_at?: string
}

// Prefer explicit env var; if missing, assume backend runs on same host at port 3010 (dev default).
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3010` : '')

export default function ProductAdmin(): JSX.Element {
  // Estado para product_keys a crear
  const [productKeys, setProductKeys] = useState<ProductKeyInput[]>([])
  const [newKey, setNewKey] = useState('')
  const [randomCount, setRandomCount] = useState<number>(1)
  // Estado para product_keys existentes
  const [existingKeys, setExistingKeys] = useState<ProductKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(false)

  // Generador simple de claves aleatorias. Si se pasa seq, lo añadimos al final para mantener orden legible.
  function generateRandomKey(length = 16, seq?: number) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (typeof seq === 'number') {
      // formatear secuencia a 4 dígitos para orden lexical
      const s = String(seq).padStart(4, '0')
      return `${key}-${s}`
    }
    return key;
  }

  // Añadir una o varias claves random en orden (count)
  async function handleAddRandomKey(count = 1) {
    if (count <= 0) return

    // Si estamos editando un producto existente, persistir en backend
    if (editingId) {
      setLoadingKeys(true)
      setError(null)
      try {
        const created: ProductKey[] = []
        // crear secuencialmente para mantener orden en el sufijo
        const startIdx = (existingKeys?.length || 0) + 1
        for (let i = 0; i < count; i++) {
          const seq = startIdx + i
          const license = generateRandomKey(16, seq)
          const resp = await fetch(`${API_BASE}/products/${editingId}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: license })
          })
          let json: any
          try {
            json = await resp.json()
          } catch (e) {
            const text = await resp.text().catch(() => '')
            throw new Error(`Server returned ${resp.status} ${resp.statusText}: ${text || 'non-JSON response'}`)
          }
          if (!resp.ok || !json?.success) {
            const msg = json?.error ?? json?.message ?? 'Failed to create key'
            throw new Error(Array.isArray(msg) ? msg.map((m: any) => m?.message ?? JSON.stringify(m)).join('\n') : (typeof msg === 'string' ? msg : JSON.stringify(msg)))
          }
          created.push(json.data)
        }
        // anexar al inicio para verlas primero
        setExistingKeys(prev => [...created, ...(prev || [])])
      } catch (e: any) {
        setError(e?.message ?? String(e))
      } finally {
        setLoadingKeys(false)
      }
      return
    }

    // Comportamiento para creación de producto (local) — seguir guardando en memoria
    setProductKeys(prev => {
      const startIdx = prev.length + 1
      const newKeys: ProductKeyInput[] = []
      for (let i = 0; i < count; i++) {
        const seq = startIdx + i
        newKeys.push({ license_key: generateRandomKey(16, seq) })
      }
      return [...prev, ...newKeys]
    })
  }

  async function handleAddManualKey() {
    if (!newKey.trim()) return

    // Si estamos editando, persistir en backend
    if (editingId) {
      setLoadingKeys(true)
      setError(null)
      try {
        const resp = await fetch(`${API_BASE}/products/${editingId}/keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ license_key: newKey.trim() })
        })
        let json: any
        try {
          json = await resp.json()
        } catch (e) {
          const text = await resp.text().catch(() => '')
          throw new Error(`Server returned ${resp.status} ${resp.statusText}: ${text || 'non-JSON response'}`)
        }
        if (!resp.ok || !json?.success) {
          const msg = json?.error ?? json?.message ?? 'Failed to create key'
          throw new Error(Array.isArray(msg) ? msg.map((m: any) => m?.message ?? JSON.stringify(m)).join('\n') : (typeof msg === 'string' ? msg : JSON.stringify(msg)))
        }
        setExistingKeys(prev => [json.data, ...(prev || [])])
        setNewKey('')
      } catch (e: any) {
        setError(e?.message ?? String(e))
      } finally {
        setLoadingKeys(false)
      }
      return
    }

    // comportamiento local si estamos creando el producto
    setProductKeys(prev => [...prev, { license_key: newKey.trim() }])
    setNewKey('')
  }

  function handleRemoveKey(idx: number) {
    // Solo afecta a claves locales (a crear junto al producto)
    setProductKeys(prev => prev.filter((_, i) => i !== idx));
  }

  // Eliminar una key ya persistida en el servidor
  async function handleDeleteExistingKey(keyId: string) {
    if (!editingId) return
    if (!confirm('Eliminar esta clave?')) return
    setLoadingKeys(true)
    setError(null)
    try {
      const resp = await fetch(`${API_BASE}/products/${editingId}/keys/${keyId}`, { method: 'DELETE' })
      let json: any
      try {
        json = await resp.json()
      } catch (e) {
        const text = await resp.text().catch(() => '')
        throw new Error(`Server returned ${resp.status} ${resp.statusText}: ${text || 'non-JSON response'}`)
      }
      if (!resp.ok || !json?.success) {
        const msg = json?.error ?? json?.message ?? 'Failed to delete key'
        throw new Error(Array.isArray(msg) ? msg.map((m: any) => m?.message ?? JSON.stringify(m)).join('\n') : (typeof msg === 'string' ? msg : JSON.stringify(msg)))
      }
      setExistingKeys(prev => (prev || []).filter(k => k.id !== keyId))
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoadingKeys(false)
    }
  }
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [category, setCategory] = useState('')
  const [stockQuantity, setStockQuantity] = useState<number | ''>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [serverDebug, setServerDebug] = useState<{ status?: number; statusText?: string; body?: string } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_BASE}/products`)
      let json: any = undefined
      try {
        json = await resp.json()
      } catch (parseErr) {
        const text = await resp.text().catch(() => '')
        throw new Error(`Server returned ${resp.status} ${resp.statusText}: ${text || 'non-JSON response'}`)
      }

      if (!resp.ok || !json?.success) {
        const errObj = json?.error ?? json?.message ?? 'Failed to fetch products'
        const errMsg = Array.isArray(errObj)
          ? errObj.map((it: any) => it?.message ?? JSON.stringify(it)).join('\n')
          : (typeof errObj === 'string' ? errObj : (errObj?.message ?? JSON.stringify(errObj)));
        setError(errMsg || 'Failed to fetch products')
        setProducts([])
      } else {
        setProducts(json.data.products ?? [])
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  async function fetchProductKeys(productId: string) {
    setLoadingKeys(true)
    try {
      const resp = await fetch(`${API_BASE}/products/${productId}/keys`)
      const json = await resp.json()
      if (resp.ok && json?.success) {
        setExistingKeys(json.data || [])
      } else {
        setExistingKeys([])
      }
    } catch {
      setExistingKeys([])
    } finally {
      setLoadingKeys(false)
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setName(p.name)
    setDescription(p.description)
    setPrice(p.price)
    setCategory(p.category)
    setStockQuantity(p.stock_quantity)
    setImagePreview(p.image_url ?? null)
    setImageFile(null)
    setProductKeys([]) // No cargamos keys para crear
    setExistingKeys([])
    fetchProductKeys(p.id)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
    setPrice('')
    setCategory('')
    setStockQuantity('')
    setImageFile(null)
    setImagePreview(null)
    setProductKeys([])
    setNewKey('')
    setExistingKeys([])
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    // Reset previous image errors
    setImageError(null)

    if (!f) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    // Validation: allowed types and max size
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
    const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

    if (!ALLOWED_TYPES.includes(f.type)) {
      setImageError('Tipo de imagen no permitido. Usa PNG, JPEG, WEBP.')
      setImageFile(null)
      setImagePreview(null)
      return
    }

    if (f.size > MAX_SIZE_BYTES) {
      setImageError('Imagen demasiado grande. Máximo 2 MB.')
      setImageFile(null)
      setImagePreview(null)
      return
    }

    setImageFile(f)
    const url = URL.createObjectURL(f)
    setImagePreview(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        name,
        description,
        price: typeof price === 'number' ? price : Number(price),
        category,
        stock_quantity: typeof stockQuantity === 'number' ? stockQuantity : Number(stockQuantity)
      }
      // Si hay productKeys y es creación, añadirlas
      if (!editingId && productKeys.length > 0) {
        payload.product_keys = productKeys;
      }

      if (imageFile) {
        // final safety check before upload
        const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
        const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
        if (!ALLOWED_TYPES.includes(imageFile.type)) throw new Error('Tipo de imagen no permitido (cliente)')
        if (imageFile.size > MAX_SIZE_BYTES) throw new Error('Imagen demasiado grande (cliente)')

        const dataUrl = await convertFileToBase64(imageFile)
        // send the data URL; backend will upload to storage and replace with public URL
        payload.image_url = dataUrl
      } else if (imagePreview && !imagePreview.startsWith('blob:') && !imagePreview.startsWith('data:')) {
        // if preview is already a public URL, reuse it
        payload.image_url = imagePreview
      }

      // Don't send empty strings for optional fields
      if (!payload.image_url) delete payload.image_url

      let resp
      if (editingId) {
        resp = await fetch(`${API_BASE}/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        resp = await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      let json: any = undefined
      try {
        json = await resp.json()
        // save debug info
        setServerDebug({ status: resp.status, statusText: resp.statusText, body: JSON.stringify(json) })
      } catch (parseErr) {
        const text = await resp.text().catch(() => '')
        setServerDebug({ status: resp.status, statusText: resp.statusText, body: text })
        throw new Error(`Server returned ${resp.status} ${resp.statusText}: ${text || 'non-JSON response'}`)
      }

      if (!resp.ok || !json?.success) {
        const errObj = json?.error ?? json?.message ?? `Failed to save product (status ${resp.status})`
        const errMsg = Array.isArray(errObj)
          ? errObj.map((it: any) => it?.message ?? JSON.stringify(it)).join('\n')
          : (typeof errObj === 'string' ? errObj : (errObj?.message ?? JSON.stringify(errObj)));
        setError(errMsg || `Failed to save product (status ${resp.status})`)
      } else {
        await fetchProducts()
        resetForm()
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar producto?')) return
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' })
      let json: any = undefined
      try {
        json = await resp.json()
      } catch (parseErr) {
        const text = await resp.text().catch(() => '')
        throw new Error(`Server returned ${resp.status} ${resp.statusText}: ${text || 'non-JSON response'}`)
      }

      if (!resp.ok || !json?.success) {
        const errObj = json?.error ?? json?.message ?? 'Failed to delete'
        const errMsg = Array.isArray(errObj)
          ? errObj.map((it: any) => it?.message ?? JSON.stringify(it)).join('\n')
          : (typeof errObj === 'string' ? errObj : (errObj?.message ?? JSON.stringify(errObj)));
        setError(errMsg || 'Failed to delete')
      } else {
        await fetchProducts()
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Gestión de Productos</h2>
        <p className="text-gray-600">Administra el catálogo de productos y sus claves de licencia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Lista de Productos</h3>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" 
              onClick={fetchProducts} 
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {loading && <div>Cargando...</div>}
          {error && <div className="text-red-600 mb-2">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full h-32 bg-gray-100 flex-shrink-0 overflow-hidden rounded-lg mb-4">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-500">Sin imagen</div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{p.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{p.category}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-green-600">${p.price}</span>
                    <span className="text-sm text-gray-500">Stock: {p.stock_quantity}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors" 
                      onClick={() => startEdit(p)}
                    >
                      Editar
                    </button>
                    <button 
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors" 
                      onClick={() => handleDelete(p.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Editar Producto' : 'Crear Producto'}
            </h3>
            
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Product Keys UI */}
            {!editingId ? (
              <div className="mb-2">
                <label className="block text-sm mb-1">Claves de producto</label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="border rounded p-2 flex-1"
                    placeholder="Agregar clave manual"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                  />
                  <button type="button" className="px-2 py-1 bg-blue-500 text-white rounded" onClick={handleAddManualKey}>Añadir</button>
                  <input
                    type="number"
                    min={1}
                    className="w-20 border rounded p-2"
                    value={randomCount}
                    onChange={e => setRandomCount(Number(e.target.value) || 1)}
                    title="Cantidad de claves a generar"
                  />
                  <button type="button" className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => handleAddRandomKey(randomCount)}>Random</button>
                </div>
                {productKeys.length > 0 && (
                  <ul className="mb-2 max-h-32 overflow-auto border rounded p-2 bg-gray-50">
                    {productKeys.map((k, idx) => (
                      <li key={idx} className="flex items-center justify-between py-1">
                        <span className="font-mono text-xs">{k.license_key}</span>
                        <button type="button" className="ml-2 text-red-500 hover:underline text-xs" onClick={() => handleRemoveKey(idx)}>Eliminar</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="text-xs text-gray-500">Puedes añadir varias claves antes de crear el producto.</div>
              </div>
            ) : (
              <div className="mb-2">
                <label className="block text-sm mb-1">Claves de producto existentes</label>
                {loadingKeys ? (
                  <div className="text-xs text-gray-500">Cargando claves...</div>
                ) : existingKeys.length === 0 ? (
                  <div className="text-xs text-gray-500">Este producto no tiene claves.</div>
                ) : (
                  <div>
                    <div className="mb-2 flex gap-2">
                      <input
                        className="border rounded p-2 flex-1"
                        placeholder="Agregar clave manual"
                        value={newKey}
                        onChange={e => setNewKey(e.target.value)}
                      />
                      <button type="button" className="px-2 py-1 bg-blue-500 text-white rounded" onClick={handleAddManualKey}>Añadir</button>
                      <input
                        type="number"
                        min={1}
                        className="w-20 border rounded p-2"
                        value={randomCount}
                        onChange={e => setRandomCount(Number(e.target.value) || 1)}
                        title="Cantidad de claves a generar"
                      />
                      <button type="button" className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => handleAddRandomKey(randomCount)}>Random</button>
                    </div>

                    <ul className="mb-2 max-h-32 overflow-auto border rounded p-2 bg-gray-50">
                      {existingKeys.map((k) => (
                        <li key={k.id} className="flex items-center justify-between py-1">
                          <span className="font-mono text-xs">{k.license_key}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" className="text-red-500 hover:underline text-xs" onClick={() => handleDeleteExistingKey(k.id)}>Eliminar</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm">Nombre</label>
              <input className="w-full border rounded p-2" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm">Descripción</label>
              <textarea className="w-full border rounded p-2" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm">Precio</label>
                <input type="number" step="0.01" className="w-full border rounded p-2" value={price as any} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-sm">Stock</label>
                <input type="number" className="w-full border rounded p-2" value={stockQuantity as any} onChange={e => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))} required />
              </div>
            </div>
            <div>
              <label className="block text-sm">Categoría</label>
              <input className="w-full border rounded p-2" value={category} onChange={e => setCategory(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm">Imagen</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {imageError && <div className="text-sm text-red-600 mt-1">{imageError}</div>}

              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="preview" className="mt-2 w-full h-40 object-contain" />
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded" disabled={loading}>{editingId ? 'Guardar' : 'Crear'}</button>
              <button type="button" className="px-3 py-2 bg-gray-200 rounded" onClick={resetForm}>Limpiar</button>
            </div>
          </form>
          </div>
          
          {serverDebug && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <div className="font-medium mb-1">Server debug</div>
              <div>Status: {serverDebug.status} {serverDebug.statusText}</div>
              <pre className="mt-2 max-h-40 overflow-auto text-xs bg-white p-2 border rounded">{serverDebug.body}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
