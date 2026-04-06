import { create } from 'zustand'

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
  city: string;
  resumeText: string;
  isLoading: boolean;

  setStep: (step: number) => void;
  setContext: (noc: string, province: string, city?: string) => void;
  setResumeText: (text: string) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()((set) => ({
  currentStep: 1,
  noc: '',
  province: '',
  city: '',
  resumeText: '',
  isLoading: false,

  setStep: (step) => set({ currentStep: step }),
  setContext: (noc, province, city = '') => set({ noc, province, city }),
  setResumeText: (text) => set({ resumeText: text }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set({
    currentStep: 1,
    noc: '',
    province: '',
    city: '',
    resumeText: '',
    isLoading: false,
  }),
}))
