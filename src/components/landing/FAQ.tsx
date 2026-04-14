import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Como funciona a análise gratuita?",
    answer: "Você preenche seu NOC, Província alvo e cola seu currículo atual. Nossa inteligência artificial faz uma leitura simulando os robôs de RH do Canadá (ATS) e te entrega uma nota de 0 a 100, apontando alguns erros críticos gratuitamente."
  },
  {
    question: "O que ganho ao comprar o pacote premium?",
    answer: "O pacote premium (apenas R$ 49,90 pagos uma única vez) reescreve todo o seu currículo com foco em resultados mensuráveis no padrão canadense, remove informações incompatíveis, te entrega seu LinkedIn otimizado em inglês e sugere 5 vagas reais que casam perfeitamente com seu perfil hoje."
  },
  {
    question: "O pagamento é seguro?",
    answer: "Sim! Todo o processamento financeiro é feito através da Pagar.me/AbacatePay, garantindo segurança bancária de ponta a ponta. Oferecemos pagamentos 100% seguros via PIX ou Cartão de Crédito."
  },
  {
    question: "Preciso traduzir meu currículo antes de analisar?",
    answer: "Não. Se o seu currículo original estiver em inglês ou português, o CurrículoCanadá é capaz de compreendê-lo perfeitamente e entregar a versão otimizada exclusivamente baseada nos padrões dos empregadores exigentes da América do Norte."
  }
]

export function FAQ() {
  return (
    <section className="relative py-20 lg:py-32 bg-muted/30">
      <div className="container relative px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Section Header - Centered */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-border" />
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
              FAQ
            </span>
            <div className="h-px w-12 bg-border" />
          </div>
          <h2 className="text-display-sm">
            Perguntas Frequentes
          </h2>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index + 1}`} className="bg-card rounded-lg border border-border">
              <AccordionTrigger className="text-left px-6 py-5 hover:no-underline">
                <span className="font-heading font-medium text-foreground pr-4">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-body text-muted-foreground pb-5 px-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact Note */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Ainda tem dúvidas?{" "}
          <a href="mailto:suporte@canadapath.ai" className="text-primary hover:underline font-medium">
            Entre em contato
          </a>
        </p>
      </div>
    </section>
  )
}
