import { Link } from 'react-router-dom'
import StatusBox from '../components/StatusBox'
import { useStatus } from '../contexts/StatusContext'

export default function Home() {
  const { setStatus } = useStatus()
  const services = [
    { id: 'beard', icon: 'face_5', label: 'لحية', filled: true },
    { id: 'haircut', icon: 'checkroom', label: 'قصة شعر' },
    { id: 'car', icon: 'minor_crash', label: 'سيارة' },
    { id: 'fridge', icon: 'restaurant_menu', label: 'طياب' },
    { id: 'outfit', icon: 'checkroom', label: 'لبسة' },
    { id: 'premium', icon: 'star', label: 'مداد ذهبي' },
  ]

  return (
    <>
      <main className="min-h-screen bg-background text-on-background">
        {/* Hero */}
        <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="relative z-10 max-w-4xl w-full text-center">
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 border border-primary/20">
              خدمات تونسية 100% مع ذكاء اصطناعي
            </span>
            <h1 className="text-6xl lg:text-8xl font-black font-headline text-on-background mb-8 leading-tight">
              <span className="text-primary">الجودة</span>
              <br />
              في كل شيء
            </h1>
            <p className="text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto leading-relaxed">
              خدمات ذكية وموثوقة مصممة خصيصاً للسوق التونسي. من تحليل الوجه لقصات الشعر، كل شيء في تطبيق واحد.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/beard"
                className="gold-gradient text-on-primary font-bold px-8 py-4 rounded-xl text-lg shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
              >
                ابدأ الآن
              </Link>
              <button className="bg-surface-container-highest/40 backdrop-blur-md border border-outline-variant/30 text-on-surface font-semibold px-8 py-4 rounded-xl text-lg hover:bg-surface-container-highest/60 transition-all">
                تعرف أكتر
              </button>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-24 px-6 lg:px-20 bg-surface-container-low/30">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 text-center">
              <h2 className="text-4xl font-black font-headline mb-4">خدماتنا</h2>
              <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map(({ id, icon, label }) => (
                <Link
                  key={id}
                  to={`/${id}`}
                  className="group surface-container-highest/40 rounded-2xl p-8 border border-outline-variant/10 hover:border-primary/40 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                    <span
                      className="material-symbols-outlined text-primary group-hover:text-on-primary text-4xl"
                      style={{ fontVariationSettings: `'FILL' ${services.find(s => s.id === id)?.filled ? 1 : 0}` }}
                    >
                      {icon}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{label}</h3>
                  <p className="text-on-surface-variant mb-4">تحليل ذكي وموثوق</p>
                  <span className="text-primary font-bold inline-flex items-center gap-2">
                    ابدأ الآن
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 lg:px-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black font-headline mb-16">لماذا خدماتنا</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: 'bolt', title: 'سريع جداً', desc: 'النتيجة في ثواني' },
                { icon: 'security', title: 'آمن وموثوق', desc: 'خصوصيتك محمية' },
                { icon: 'trending_up', title: 'ذكاء متقدم', desc: 'أحدث تقنيات AI' },
              ].map(({ icon, title, desc }, i) => (
                <div key={i} className="text-center">
                  <span className="material-symbols-outlined text-5xl text-primary mb-4 inline-block">
                    {icon}
                  </span>
                  <h3 className="text-2xl font-bold mb-2">{title}</h3>
                  <p className="text-on-surface-variant">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer Space */}
        <div className="h-24"></div>
      </main>
    </>
  )
}
