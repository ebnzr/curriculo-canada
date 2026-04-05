import { useWizardStore } from "@/stores/wizardStore"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const contextSchema = z.object({
  noc: z.string().min(4, "O NOC geralmente possui no mínimo 4 dígitos ou um código descritivo de profissão."),
  province: z.string().min(2, "Selecione uma província alvo."),
})

const PROVINCES = [
  "Ontario (ON)",
  "British Columbia (BC)",
  "Alberta (AB)",
  "Quebec (QC)",
  "Nova Scotia (NS)",
  "Manitoba (MB)",
  "Saskatchewan (SK)",
  "New Brunswick (NB)",
  "Prince Edward Island (PE)",
  "Newfoundland and Labrador (NL)",
]

export function StepContext() {
  const { setContext, setStep, noc, province } = useWizardStore()

  const form = useForm<z.infer<typeof contextSchema>>({
    resolver: zodResolver(contextSchema),
    defaultValues: {
      noc: noc || "",
      province: province || "",
    },
  })

  function onSubmit(values: z.infer<typeof contextSchema>) {
    setContext(values.noc, values.province)
    setStep(2) // Avançar para o upload de currículo
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Para onde e com o quê você quer trabalhar?</h2>
        <p className="text-muted-foreground text-sm">
          A IA usará isso para garantir que suas palavras-chave batam com os requisitos do mercado regional e com a sua ocupação de imigração (National Occupational Classification).
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="noc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NOC (National Occupational Classification) ou Profissão</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 21232 - Software Developer" {...field} />
                </FormControl>
                <FormDescription>
                  Se não souber seu código NOC, digite apenas sua área de profissão alvo em inglês.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Província ou Território de Chegada</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua província alvo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVINCES.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  O comportamento de RH varia muito do Quebec (ex: francês) para Ontario.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit">Continuar</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
