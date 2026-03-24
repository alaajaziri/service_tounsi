import ServicePage from '../components/ServicePage'

export default function OutfitStylist() {
  return (
    <ServicePage
      serviceId="outfit"
      hero={{
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDK4K5jK9Z0m4K5jK9Z0m4K5jK9Z0m4K5jK',
        alt: 'Fashion styling consultation',
        title: 'لبّس نفسك',
        subtitle: 'بأسلوب ذكي',
        description: 'استشارة أسلوب شاملة مع تبديلات لبسة مناسبة لجسدك وملامحك ودرجة جلدك من أفضل المصممين التوانسة.',
        buttonText: 'اطلب الاستشارة',
        uploadTitle: 'اختار لبستك الأنسب',
        uploadSubtitle: 'عن طريق ذكاء اصطناعي',
        features: [
          { icon: 'verified', title: 'استشارة كاملة', desc: 'تحليل شامل لأسلوبك الشخصي.' },
          { icon: 'history_edu', title: 'مصممين محترفين', desc: 'من أفضل مصممي الأزياء.' },
          { icon: 'bolt', title: 'تبديلات فورية', desc: 'اقتراحات تناسب أسلوبك وجسدك.' },
        ],
        ctaTitle: 'اللبسة الأنسب ليك',
        ctaText: 'ما تضيعش وقت في المحلات، دينا نقول لك إيش اللي يناسبك.',
        ctaButton: 'ابدأ الاستشارة - 1 DT',
      }}
    />
  )
}
