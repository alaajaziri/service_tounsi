export const analyzeImage = async (serviceId, file) => {
  const formData = new FormData()
  formData.append('photo', file)

  const res = await fetch(`/api/analyze/${serviceId}`, {
    method: 'POST',
    body: formData,
  })

  const raw = await res.text()
  let data = {}

  try {
    data = raw ? JSON.parse(raw) : {}
  } catch (parseError) {
    throw new Error(`Server returned invalid response (${res.status}). ${raw.slice(0, 180)}`)
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Analyze request failed.')
  }

  return data.result
}

export const initiatePayment = async (returnUrl) => {
  const res = await fetch('/api/payment/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnUrl }),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Payment initiation failed.')
  }

  return data.paymentUrl
}
