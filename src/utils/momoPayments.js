import { auth } from '../firebase/config'

const POLL_INTERVAL_MS = 5000
const FINAL_STATES = new Set(['successful', 'failed', 'timeout'])

const ENDPOINTS = {
  initiate: {
    path: '/api/payments/momo/initiate',
    functionName: 'apiCreateMomoPayment',
  },
  status: {
    path: '/api/payments/momo/status',
    functionName: 'apiMomoPaymentStatus',
  },
}

function isLocalDevHost() {
  if (typeof window === 'undefined') return false
  return ['localhost', '127.0.0.1'].includes(window.location.hostname)
}

function endpointUrl(key) {
  const entry = ENDPOINTS[key]
  if (!entry) throw new Error(`Unknown payment endpoint: ${key}`)

  if (!isLocalDevHost()) return entry.path

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  if (!projectId) {
    throw new Error('VITE_FIREBASE_PROJECT_ID is missing.')
  }
  return `https://us-central1-${projectId}.cloudfunctions.net/${entry.functionName}`
}

async function authorizedFetch(url, options = {}) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) {
    throw new Error('Please sign in before making a payment.')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Payment request failed.')
  }
  return data
}

export async function initiateMomoPayment({ phoneNumber, planId }) {
  return authorizedFetch(endpointUrl('initiate'), {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, planId }),
  })
}

export async function getMomoPaymentStatus(paymentId) {
  const url = `${endpointUrl('status')}?paymentId=${encodeURIComponent(paymentId)}`
  return authorizedFetch(url, { method: 'GET' })
}

export async function pollMomoPayment(paymentId, { onUpdate, timeoutMs = 180000 } = {}) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const update = await getMomoPaymentStatus(paymentId)
    onUpdate?.(update)

    if (FINAL_STATES.has(update.status)) {
      return update
    }

    const delay = Math.max(
      2000,
      Math.min(Number(update.nextCheckInMs) || POLL_INTERVAL_MS, 10000),
    )
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  return {
    status: 'pending',
    reason: 'The payment is still pending. You can close this window and check again shortly.',
    message: 'Still waiting for MTN. You can close this window while the server keeps checking.',
    nextCheckInMs: POLL_INTERVAL_MS,
  }
}
