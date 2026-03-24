import ServicePage from '../components/ServicePage'

export default function BeardAdvisor() {
  return (
    <ServicePage
      serviceId="beard"
      hero={{
        analysisServiceIds: ['beard', 'haircut'],
        resultRouteId: 'style',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuHPv2QroN3RyiHVa6IYTnTPao-e3lHkbD7xzO1cIwCO3v5ZkHc1pooXtRcpgX7WMDrropiWs30flzpHza_wZLoxCYGg6_K1qRaGOiWTfQfh_VItnmAcZ7KH3J0Y0uN_uXs7Hh8Z7O40uw0o7LC2nZzInirka3t2fNxNTRxHwnamGVgcM2fVvnJdwvyT_oLOvLKZeymxA9k7_Y9KJsBvGn-3ZFui9QYdmjp2Uq3gHMxpzNaoCNKiAh6AF8UjY9W5Xvmua4wALz5CFf',
        alt: 'Portrait of a sophisticated man with a perfectly groomed thick beard',
        title: 'اعرف أحسن',
        subtitle: 'ستيل لحية + قصة شعر لوجهك',
        description: 'تحليل مزدوج للوجه يعطيك نصائح اللحية وقصة الشعر مع بعضهم، باش تطلع بأكمل لوك ممكن.',
        buttonText: 'حلّل اللحـية والشعر مع بعض',
        uploadTitle: 'حلل وجهك للّحية والشعر',
        uploadSubtitle: 'بأحدث تقنيات الـ AI',
        features: [
          { icon: 'verified', title: 'دقة عالية', desc: 'تحليل أكتر من 50 نقطة في الوجه لاختيار الأنسب للحية والشعر.' },
          { icon: 'history_edu', title: 'نصائح حلاقة كاملة', desc: 'توصيات مبنية على خبرة حلاقين محترفين للحية وقصّات الشعر.' },
          { icon: 'bolt', title: 'نتيجة فورية', desc: 'تقرير واحد فيه الزوز نصائح في وقت قياسي.' },
        ],
        ctaTitle: 'جاهز للوك كامل؟',
        ctaText: 'بدل ما تختار كل حاجة وحدها، خذ نصيحة موحدة للحية وقصة الشعر من أول مرة.',
        ctaButton: 'ابدأ التحليل المزدوج - 1 DT',
      }}
    />
  )
}
