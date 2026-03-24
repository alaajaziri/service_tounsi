import ServicePage from '../components/ServicePage'

export default function FridgeToRecipe() {
  return (
    <ServicePage
      serviceId="fridge"
      hero={{
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDH9Z0m4K5jK9Z0m4K5jK9Z0m4K5jK9Z0m',
        alt: 'Fresh ingredients and cooking',
        title: 'حوّل مكونات',
        subtitle: 'ثلاجتك لأكلة',
        description: 'صور مكونات من ثلاجتك وخليني نقترح عليك الأكلات التونسية الشهية اللي تقدر تطبخها الآن.',
        buttonText: 'ابدأ الطبخة - 1 دينار',
        uploadTitle: 'اطبخ من اللي عندك',
        uploadSubtitle: 'مع وصفات تونسية',
        features: [
          { icon: 'verified', title: 'وصفات أصيلة', desc: 'وصفات تونسية من الطبخ التقليدي.' },
          { icon: 'history_edu', title: 'خطوات سهلة', desc: 'شرح مفصل وسهل المتابعة.' },
          { icon: 'bolt', title: 'توصيات فورية', desc: 'صور المكونات تعطيك الوصفات مباشرة.' },
        ],
        ctaTitle: 'قرر تأكل إيش',
        ctaText: 'بدل ما تقعد تفكر إيش تطبخ، دينا قتولك.',
        ctaButton: 'ابدأ الطبخة - 1 DT',
      }}
    />
  )
}
