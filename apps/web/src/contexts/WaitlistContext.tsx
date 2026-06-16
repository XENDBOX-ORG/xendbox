import { createContext, useContext, useState, type ReactNode } from 'react'

interface WaitlistContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const WaitlistContext = createContext<WaitlistContextValue>({
  open: false,
  setOpen: () => {},
})

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <WaitlistContext.Provider value={{ open, setOpen }}>
      {children}
    </WaitlistContext.Provider>
  )
}

export const useWaitlist = () => useContext(WaitlistContext)
