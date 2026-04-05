import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export function cleanResumeText(text: string): string {
  if (!text) return ''
  
  return String(text)
    .replace(/pasted-image\d*/gi, '')
    .replace(/data:image\S*/gi, '')
    .replace(/data:application\S*/gi, '')
    .replace(/\[image[^\]]*\]/gi, '')
    .replace(/\[.*?\]/gi, '')
    .replace(/png|jpg|jpeg|gif|bmp|webp/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface WizardState {
  currentStep: number;
  noc: string;
  province: string;
  isLoading: boolean;
  
  setStep: (step: number) => void;
  setContext: (noc: string, province: string) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

// Store SIMPLIFICADO - sem persistir dados do currículo
// Isso evita problemas de contaminação
export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      currentStep: 1,
      noc: '',
      province: '',
      isLoading: false,

      setStep: (step) => set({ currentStep: step }),
      setContext: (noc, province) => set({ noc, province }),
      setIsLoading: (isLoading) => set({ isLoading }),
      reset: () => set({
        currentStep: 1,
        noc: '',
        province: '',
        isLoading: false,
      }),
    }),
    {
      name: 'canadapath-wizard-storage',
      partialize: (state) => ({
        // Only persist minimal navigation data
        currentStep: state.currentStep,
        noc: state.noc,
        province: state.province,
      }),
    }
  )
)