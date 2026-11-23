// Tokens guardados en este navegador. Nunca se muestran en la interfaz salvo el enlace de admin.
const get = (k) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const set = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* sin almacenamiento: el usuario tendrá que usar su enlace */
  }
}

export const getAdminToken = (slug) => get(`gx:admin:${slug}`)
export const saveAdminToken = (slug, token) => set(`gx:admin:${slug}`, token)
export const getClaimToken = (slug) => get(`gx:claim:${slug}`)
export const saveClaimToken = (slug, token) => set(`gx:claim:${slug}`, token)
