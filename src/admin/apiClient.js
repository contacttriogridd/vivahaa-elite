// Axios instances for the admin panel (Employee auth) and vendor portal (Vendor
// auth) — mirrors src/lib/api.ts's pattern (withCredentials + a bearer header from
// localStorage as belt-and-suspenders alongside the httpOnly cookie) but with its
// own token keys so an employee, a vendor, and a signed-in member can all be logged
// in in the same browser without clobbering each other's session.
import axios from 'axios'

function makeClient(tokenKey) {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  })
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey)
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  return client
}

export const adminApi = makeClient('employeeAccessToken')
export const vendorApi = makeClient('vendorAccessToken')
export const dealerApi = makeClient('dealerAccessToken')
