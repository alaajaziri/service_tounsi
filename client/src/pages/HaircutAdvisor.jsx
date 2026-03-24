import ServicePage from '../components/ServicePage'

export default function HaircutAdvisor() {
  return (
    <ServicePage
      serviceId="haircut"
      hero={{
        analysisServiceIds: ['beard', 'haircut'],
        resultRouteId: 'style',
        image: 'https://lh3.googleusercontent.com/aida-public/TB97jbQ8GEfx1y2zJh8BqMK2XkqWLOXuKx2kI3N1fDqVnQNgmOdN-JqhQ5RzVCnZvUmV_4hP9W6Vwcl4K6qrJIe5JLZmWVpzk0Dg',
        alt: 'Man with stylish modern haircut',
        title: 'اعرف أحسن',
        subtitle: 'قصة شعر لوجهك',
        description: 'اكتشف قصة الشعر الأنسب لملامحك مع نصائح من أفضل الحلاقين التوانسة بتحليل ذكي وموثوق.',
        buttonText: 'ابدأ التحليل - 1 دينار',
        uploadTitle: 'اختار قصتك المظيفة',
        uploadSubtitle: 'مع ذكاء اصطناعي',
        features: [
          { icon: 'verified', title: 'دقة عالية', desc: 'تحليل شامل لشكل وجهك وملامحك.' },
          { icon: 'history_edu', title: 'نصائح احترافية', desc: 'من أفضل الحلاقين في تونس.' },
          { icon: 'bolt', title: 'نتيجة فورية', desc: 'احصل على النصائح في ثواني.' },
        ],
        ctaTitle: 'حول مظهرك اليوم',
        ctaText: 'اختار القصة اللي تناسبك وابدأ رحلة التحول.',
        ctaButton: 'اختار قصتي - 1 DT',
      }}
    />
  )
}
