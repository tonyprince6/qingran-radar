const STORAGE_KEY = 'qingran-deepseek-api-key'

export function getDeviceApiKey() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function saveDeviceApiKey(apiKey) {
  const value = apiKey.trim()
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value)
    else window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function clearDeviceApiKey() {
  return saveDeviceApiKey('')
}
