import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '../components/ImageUploader'
import { useStatus } from '../contexts/StatusContext'
import { analyzeImage } from '../services/analyzeService'

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read selected image.'))
    reader.readAsDataURL(file)
  })

const tryParseJson = (rawText) => {
  const raw = String(rawText || '').trim()
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    // continue
  }

  const fenceMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1])
    } catch {
      // continue
    }
  }

  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1))
    } catch {
      return null
    }
  }

  return null
}

export default function ServicePage({ serviceId, hero }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { setStatus, saveAnalysisResult } = useStatus()
  const navigate = useNavigate()

  const analysisServiceIds = hero.analysisServiceIds && hero.analysisServiceIds.length
    ? hero.analysisServiceIds
    : [serviceId]
  const resultRouteId = hero.resultRouteId || serviceId

  const handleImageSelected = (file) => {
    setSelectedFile(file)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setStatus('Please select an image first.', true)
      return
    }

    setIsAnalyzing(true)
    setStatus('Analyzing image...')

    try {
      const resultEntries = await Promise.all(
        analysisServiceIds.map(async (id) => {
          const text = await analyzeImage(id, selectedFile)
          return [id, text]
        }),
      )

      let resultsByService = Object.fromEntries(resultEntries)
      if (resultEntries.length === 1 && resultEntries[0]?.[0] === 'style') {
        const stylePayload = tryParseJson(resultEntries[0]?.[1])
        if (stylePayload?.beard || stylePayload?.haircut) {
          resultsByService = {
            ...(stylePayload?.beard ? { beard: JSON.stringify(stylePayload.beard) } : {}),
            ...(stylePayload?.haircut ? { haircut: JSON.stringify(stylePayload.haircut) } : {}),
          }
        }
      }

      const result = resultsByService[serviceId] || resultEntries[0]?.[1] || ''
      const imageDataUrl = await toDataUrl(selectedFile)
      saveAnalysisResult(resultRouteId, {
        result,
        resultsByService,
        imageName: selectedFile.name,
        imageDataUrl,
      })
      setStatus(result, false)
      navigate(`/result/${resultRouteId}`, {
        state: {
          result,
          resultsByService,
          imageName: selectedFile.name,
          imageDataUrl,
        },
      })
    } catch (err) {
      const errMsg = (err && err.message) || 'Unknown error'
      setStatus(errMsg, true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[795px] flex items-center overflow-hidden px-6 lg:px-20 py-20">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
            src={hero.image}
            alt={hero.alt}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background via-background/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-3xl w-full mr-auto text-right">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 border border-primary/20">
            ذكاء اصطناعي تونسي 100%
          </span>
          <h1 className="text-5xl lg:text-7xl font-black font-headline text-on-background mb-8 leading-tight">
            {hero.title}
            <span className="text-primary italic block">{hero.subtitle}</span>
          </h1>
          <p className="text-xl text-on-surface-variant mb-12 max-w-xl leading-relaxed">{hero.description}</p>

          <div className="flex flex-col sm:flex-row-reverse gap-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="gold-gradient text-on-primary font-bold px-10 py-5 rounded-xl text-xl shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <span>{hero.buttonText}</span>
              <span className="material-symbols-outlined">rocket_launch</span>
            </button>
            <button className="bg-surface-container-highest/40 backdrop-blur-md border border-outline-variant/30 text-on-surface font-semibold px-10 py-5 rounded-xl text-xl hover:bg-surface-container-highest/60 transition-all">
              اكتشف المزيد
            </button>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-surface-container-low/30 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold font-headline mb-4">خطوات بسيطة</h2>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {[
              { num: 1, icon: 'cloud_upload', title: hero.steps?.[0]?.title || 'حمّل صورتك', desc: hero.steps?.[0]?.desc || 'خد سيلفي واضحة' },
              { num: 2, icon: 'payments', title: hero.steps?.[1]?.title || 'ادفع دينار', desc: hero.steps?.[1]?.desc || 'ثمن رمزي' },
              { num: 3, icon: 'check_circle', title: hero.steps?.[2]?.title || 'احصل على النصيحة', desc: hero.steps?.[2]?.desc || 'تقرير كامل' },
            ].map(({ num, icon, title, desc }) => (
              <div key={num} className="relative group">
                <div className="surface-container-highest/40 rounded-3xl p-10 border border-outline-variant/10 hover:border-primary/40 transition-all duration-500 h-full flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-8 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-on-primary text-4xl" style={{fontVariationSettings: `'FILL' ${num === 1 ? 1 : 0}`}}>
                      {icon}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{desc}</p>
                  <span className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary text-on-primary font-black flex items-center justify-center text-xl">
                    {num}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-24 px-6 lg:px-20 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl font-black font-headline mb-8 leading-tight">
              {hero.uploadTitle}
              <br />
              <span className="text-primary">{hero.uploadSubtitle}</span>
            </h2>
            <ul className="space-y-6">
              {hero.features?.map((feature, i) => (
                <li key={i} className="flex items-start gap-4 flex-row-reverse text-right">
                  <span className="material-symbols-outlined text-primary mt-1">{feature.icon}</span>
                  <div>
                    <h4 className="font-bold text-xl mb-1">{feature.title}</h4>
                    <p className="text-on-surface-variant">{feature.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-1 lg:order-2">
            <ImageUploader onImageSelected={handleImageSelected} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-20 text-center">
        <div className="max-w-4xl mx-auto gold-gradient p-[1px] rounded-[2.5rem]">
          <div className="bg-background rounded-[2.5rem] py-20 px-10 relative overflow-hidden">
            <h2 className="text-4xl lg:text-5xl font-black font-headline mb-8">{hero.ctaTitle}</h2>
            <p className="text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto">{hero.ctaText}</p>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="gold-gradient text-on-primary font-black px-12 py-6 rounded-2xl text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hero.ctaButton}
            </button>
          </div>
        </div>
      </section>

      {/* Footer Space */}
      <div className="h-24"></div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl bg-[#121317]/60 backdrop-blur-xl border-t border-[#343439]/40 shadow-[0px_-8px_24px_rgba(0,0,0,0.5)] flex flex-row-reverse justify-around items-center h-20 px-4 pb-2">
        <a href="/beard" className="flex flex-col items-center justify-center text-outline hover:text-primary rounded-xl px-3 py-1 ease-out duration-300" style={{color: serviceId === 'beard' ? '#e9c176' : '#d1c5b4', background: serviceId === 'beard' ? '#c5a05920' : 'transparent'}}>
          <span className="material-symbols-outlined" style={{fontVariationSettings: `'FILL' ${serviceId === 'beard' ? 1 : 0}`}}>face_5</span>
          <span className="text-[12px] font-medium font-['Tajawal']">لحية</span>
        </a>
        <a href="/outfit" className="flex flex-col items-center justify-center text-outline hover:text-primary rounded-xl px-3 py-1 ease-out duration-300" style={{color: serviceId === 'outfit' ? '#e9c176' : '#d1c5b4', background: serviceId === 'outfit' ? '#c5a05920' : 'transparent'}}>
          <span className="material-symbols-outlined">checkroom</span>
          <span className="text-[12px] font-medium font-['Tajawal']">لبسة</span>
        </a>
        <a href="/car" className="flex flex-col items-center justify-center text-outline hover:text-primary rounded-xl px-3 py-1 ease-out duration-300" style={{color: serviceId === 'car' ? '#e9c176' : '#d1c5b4', background: serviceId === 'car' ? '#c5a05920' : 'transparent'}}>
          <span className="material-symbols-outlined">minor_crash</span>
          <span className="text-[12px] font-medium font-['Tajawal']">كرهبة</span>
        </a>
        <a href="/fridge" className="flex flex-col items-center justify-center text-outline hover:text-primary rounded-xl px-3 py-1 ease-out duration-300" style={{color: serviceId === 'fridge' ? '#e9c176' : '#d1c5b4', background: serviceId === 'fridge' ? '#c5a05920' : 'transparent'}}>
          <span className="material-symbols-outlined">restaurant_menu</span>
          <span className="text-[12px] font-medium font-['Tajawal']">طياب</span>
        </a>
      </nav>
    </>
  )
}
