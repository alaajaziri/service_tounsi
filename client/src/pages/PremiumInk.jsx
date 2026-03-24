import ServicePage from '../components/ServicePage'

export default function PremiumInk() {
  return (
    <ServicePage
      serviceId="premium"
      hero={{
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL4K5jK9Z0m4K5jK9Z0m4K5jK9Z0m4K5jK',
        alt: 'Premium gold ink design',
        title: 'الجودة العالية',
        subtitle: 'في كل الخطوط',
        description: 'الحبر الذهبي المداد هو خيار الفنانين والعاشقين للفن. جودة عالية وألوان تدوم.',
        buttonText: 'اطلب المداد الذهبي',
        uploadTitle: 'المداد الذهبي الفاخر',
        uploadSubtitle: 'لكل خطوط القلم',
        features: [
          { icon: 'verified', title: 'حبر فاخر', desc: 'تركيبة خاصة من أفضل الحبار.' },
          { icon: 'history_edu', title: 'ألوان ثابتة', desc: 'ألوان لا تتلاشى مع الزمن.' },
          { icon: 'bolt', title: 'سهل الاستعمال', desc: 'توافق مع جميع أنواع الأقلام.' },
        ],
        ctaTitle: 'اكتب بأسلوب',
        ctaText: 'اختبر الفرق مع المداد الذهبي الفاخر.',
        ctaButton: 'أطلب الآن - 1 DT',
      }}
    />
  )
}
