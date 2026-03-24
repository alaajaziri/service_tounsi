import { createContext, useContext, useState } from 'react'

const StatusContext = createContext()

export function StatusProvider({ children }) {
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [analysisResults, setAnalysisResults] = useState({})

  const setStatus = (msg, error = false) => {
    setMessage(msg)
    setIsError(error)
  }

  const saveAnalysisResult = (serviceId, payload) => {
    if (!serviceId) return
    setAnalysisResults((prev) => ({
      ...prev,
      [serviceId]: {
        ...payload,
        updatedAt: Date.now(),
      },
    }))
  }

  const getAnalysisResult = (serviceId) => {
    if (!serviceId) return null
    return analysisResults[serviceId] || null
  }

  return (
    <StatusContext.Provider value={{ message, isError, setStatus, saveAnalysisResult, getAnalysisResult }}>
      {children}
    </StatusContext.Provider>
  )
}

export function useStatus() {
  const context = useContext(StatusContext)
  if (!context) {
    throw new Error('useStatus must be used within StatusProvider')
  }
  return context
}
