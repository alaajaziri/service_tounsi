import ServicePage from '../components/ServicePage'

export default function CarDamageScan() {
  return (
    <ServicePage
      serviceId="car"
      hero={{
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3wZpD5jK9Z0m4K5jK9Z0m4K5jK9Z0m4K5',
        alt: 'Car damage assessment',
        title: 'قيّم أضرار',
        subtitle: 'سيارتك بـ AI',
        description: 'تحليل دقيق وسريع لأضرار سيارتك مع تقدير تقريبي للإصلاح من قبل خبراء معتمدين.',
        buttonText: 'قيّم أضرار سيارتك',
        uploadTitle: 'اكتشف حالة سيارتك',
        uploadSubtitle: 'بتحليل متقدم',
        features: [
          { icon: 'verified', title: 'تقدير دقيق', desc: 'تقدير تكلفة الإصلاح بناءً على صور الضرر.' },
          { icon: 'history_edu', title: 'خبراء معتمدين', desc: 'التقييم من قبل مهندسين معتمدين.' },
          { icon: 'bolt', title: 'تقرير فوري', desc: 'احصل على التقرير والتقدير مباشرة.' },
        ],
        ctaTitle: 'اطمئن على سيارتك',
        ctaText: 'صور الأضرار تروح مباشرة للخبراء وتجيبك التقدير.',
        ctaButton: 'قيّم الآن - 1 DT',
      }}
    />
  )
}
