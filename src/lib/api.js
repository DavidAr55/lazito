// Cliente de la API de Laravel (/api/v1). Mantiene la forma de las funciones que usa la interfaz:
// aquí se traduce entre snake_case (API) y camelCase (interfaz).
// En desarrollo Vite redirige /api a Laravel; en producción, si la API vive en otro dominio, VITE_API_URL lo indica.
const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`

const apiError = (code, message, status) => Object.assign(new Error(message), { code, status })

async function request(path, { method = 'GET', body, token, full = false } = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    })
  } catch {
    throw apiError('NETWORK', 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.')
  }

  const json = await response.json().catch(() => ({}))
  if (response.ok) return full ? json : json.data

  const validationMessage = Object.values(json.errors ?? {})[0]?.[0]
  throw apiError(
    json.code ?? (response.status === 404 ? 'NOT_FOUND' : 'ERROR'),
    validationMessage ?? json.message ?? 'Algo salió mal. Intenta de nuevo.',
    response.status,
  )
}

const group = (slug) => `/groups/${encodeURIComponent(slug)}`
const participant = (slug, id) => `${group(slug)}/participants/${encodeURIComponent(id)}`

function toGroup(data) {
  return {
    slug: data.slug,
    name: data.name,
    eventDate: data.event_date,
    budget: data.budget,
    theme: data.theme,
    themeDescription: data.theme_description ?? '',
    categories: data.categories,
    participants: data.participants.map(({ id, name, claimed }) => ({ id, name, claimed })),
  }
}

export async function createGroup({ name, eventDate, budget, theme, themeDescription, categories, people, exclusions = [], fixedAssignments = [] }) {
  const data = await request('/groups', {
    method: 'POST',
    body: {
      name: name.trim(),
      event_date: eventDate,
      budget: Number(budget),
      theme: theme.trim(),
      theme_description: themeDescription.trim() || null,
      categories,
      participants: people,
      exclusions: exclusions.map(([a, b]) => ({ a, b })),
      fixed_assignments: fixedAssignments.map(([giver, receiver]) => ({ giver, receiver })),
    },
  })
  return { slug: data.slug, adminToken: data.admin_token }
}

// null si el intercambio no existe.
export async function getGroupPublic(slug) {
  try {
    return toGroup(await request(group(slug)))
  } catch (error) {
    if (error.code === 'NOT_FOUND') return null
    throw error
  }
}

// Primera vez: reclama el nombre y crea su PIN.
export async function claimParticipant(slug, participantId, pin) {
  const data = await request(`${participant(slug, participantId)}/claim`, { method: 'POST', body: { pin } })
  return { claimToken: data.claim_token, revealed: data.revealed }
}

// Volver a entrar (otro dispositivo) con el PIN.
export async function loginParticipant(slug, participantId, pin) {
  const data = await request(`${participant(slug, participantId)}/session`, { method: 'POST', body: { pin } })
  return { claimToken: data.claim_token, revealed: data.revealed }
}

// Quién soy según mi token (null si la sesión no es válida).
export async function getMe(slug, claimToken) {
  if (!claimToken) return null
  try {
    const { id, name, revealed } = await request(`${group(slug)}/me`, { token: claimToken })
    return { id, name, revealed }
  } catch (error) {
    if (error.status === 401) return null
    throw error
  }
}

// A quién le regalo. El servidor solo entrega MI asignación y la marca como vista.
export async function getMyAssignment(slug, claimToken) {
  const { id, name } = await request(`${group(slug)}/me/assignment`, { token: claimToken })
  return { receiver: { id, name } }
}

// ---------- Wishlist ----------

const toItem = (d) => ({
  id: d.id,
  categoryId: d.category_id,
  title: d.title,
  price: d.price,
  url: d.url,
  imageUrl: d.image_url,
  note: d.note,
})

const itemBody = ({ categoryId, title, price, url, imageUrl, note }) => ({
  title: title.trim(),
  category_id: categoryId || null,
  price: price === '' || price == null ? null : Number(price),
  url: url.trim() || null,
  image_url: imageUrl.trim() || null,
  note: note.trim() || null,
})

// Devuelve los productos y el comentario general de la wishlist ({ items, note }).
export async function getMyWishlist(slug, claimToken) {
  const { data, note } = await request(`${group(slug)}/me/wishlist`, { token: claimToken, full: true })
  return { items: data.map(toItem), note: note ?? '' }
}

export async function saveWishlistNote(slug, claimToken, note) {
  const saved = await request(`${group(slug)}/me/wishlist-note`, {
    method: 'PUT',
    body: { note: note.trim() || null },
    token: claimToken,
  })
  return saved.note ?? ''
}

export async function addWishlistItem(slug, claimToken, item) {
  return toItem(await request(`${group(slug)}/me/wishlist`, { method: 'POST', body: itemBody(item), token: claimToken }))
}

export async function updateWishlistItem(slug, claimToken, id, item) {
  return toItem(
    await request(`${group(slug)}/me/wishlist/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: itemBody(item),
      token: claimToken,
    }),
  )
}

export async function deleteWishlistItem(slug, claimToken, id) {
  await request(`${group(slug)}/me/wishlist/${encodeURIComponent(id)}`, { method: 'DELETE', token: claimToken })
}

// Wishlist de la persona a la que le regalo.
export async function getReceiverWishlist(slug, claimToken) {
  const { data, note } = await request(`${group(slug)}/me/assignment/wishlist`, { token: claimToken, full: true })
  return { items: data.map(toItem), note: note ?? '' }
}

// ---------- Administración ----------

const toAdminGroup = (data) => ({
  ...toGroup(data),
  drawnAt: data.drawn_at,
  canRedraw: data.can_redraw,
  exclusions: data.exclusions.map(({ a, b }) => [a, b]),
  fixedAssignments: data.fixed_assignments.map(({ giver, receiver }) => [giver, receiver]),
  participants: data.participants.map(({ id, name, claimed, revealed }) => ({ id, name, claimed, revealed })),
})

// null si el token no es el de administración de este intercambio.
export async function getAdminGroup(slug, adminToken) {
  if (!adminToken) return null
  try {
    return toAdminGroup(await request(`${group(slug)}/admin`, { token: adminToken }))
  } catch (error) {
    if (error.status === 403 || error.status === 404) return null
    throw error
  }
}

export async function updateGroup(slug, adminToken, { name, eventDate, budget, theme, themeDescription, categories }) {
  const data = await request(`${group(slug)}/admin`, {
    method: 'PUT',
    token: adminToken,
    body: {
      name: name.trim(),
      event_date: eventDate,
      budget: Number(budget),
      theme: theme.trim(),
      theme_description: themeDescription.trim() || null,
      categories,
    },
  })
  return toAdminGroup(data)
}

// Falla con código ALREADY_REVEALED si alguien ya vio su resultado.
export async function redrawGroup(slug, adminToken) {
  return toAdminGroup(await request(`${group(slug)}/admin/draw`, { method: 'POST', token: adminToken }))
}

// Reemplaza las exclusiones (pares de ids de participantes) y vuelve a sortear.
// Falla con ALREADY_REVEALED si alguien ya vio su resultado, o NO_VALID_DRAW si no hay sorteo posible.
export async function updateExclusions(slug, adminToken, pairs) {
  const data = await request(`${group(slug)}/admin/exclusions`, {
    method: 'PUT',
    token: adminToken,
    body: { exclusions: pairs.map(([a, b]) => ({ a, b })) },
  })
  return toAdminGroup(data)
}

// ---------- Buscador de productos ----------

// Una página de resultados. Falla con código SEARCH_UNAVAILABLE si el servidor no tiene un proveedor de búsqueda.
// `hasMore` indica si probablemente hay otra página (cada página nueva es una consulta de pago al proveedor).
export async function searchProducts(slug, claimToken, { query, minPrice, maxPrice, audience, page = 1 }) {
  const params = new URLSearchParams({ q: query })
  if (minPrice) params.set('min_price', String(minPrice))
  if (maxPrice) params.set('max_price', String(maxPrice))
  if (audience) params.set('audience', audience)
  if (page > 1) params.set('page', String(page))
  const json = await request(`${group(slug)}/me/products?${params}`, { token: claimToken, full: true })
  return {
    products: json.data.map((p) => ({ title: p.title, price: p.price, imageUrl: p.image_url, url: p.url, store: p.store })),
    hasMore: Boolean(json.meta?.has_more),
  }
}

// Reemplaza los regalos decididos a mano (pares [id de quien regala, id de quien recibe]) y vuelve a sortear.
// Falla con ALREADY_REVEALED si alguien ya vio su resultado, o NO_VALID_DRAW si las reglas no dejan un sorteo posible.
export async function updateFixedAssignments(slug, adminToken, pairs) {
  const data = await request(`${group(slug)}/admin/fixed-assignments`, {
    method: 'PUT',
    token: adminToken,
    body: { fixed_assignments: pairs.map(([giver, receiver]) => ({ giver, receiver })) },
  })
  return toAdminGroup(data)
}
