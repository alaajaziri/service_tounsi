import { Link, useLocation, useParams } from 'react-router-dom'
import { useStatus } from '../contexts/StatusContext'

const SERVICE_META = {
  beard: { label: 'اللحية', route: '/beard', icon: 'face_5' },
  haircut: { label: 'قصة الشعر', route: '/haircut', icon: 'content_cut' },
  style: { label: 'اللحية + قصة الشعر', route: '/beard', icon: 'auto_awesome' },
  car: { label: 'السيارة', route: '/car', icon: 'minor_crash' },
  fridge: { label: 'الطبخ', route: '/fridge', icon: 'restaurant_menu' },
  outfit: { label: 'اللبسة', route: '/outfit', icon: 'checkroom' },
  premium: { label: 'الخدمة المميزة', route: '/premium', icon: 'star' },
}

const SECTION_META = {
  beard: { title: 'نصائح اللحية', icon: 'face_5' },
  haircut: { title: 'نصائح قصة الشعر', icon: 'content_cut' },
}

function clampPercent(value) {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function normalizeNutrition(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0
}

function getMacroSplit(nutrition) {
  const protein = normalizeNutrition(nutrition?.proteinG)
  const carbs = normalizeNutrition(nutrition?.carbsG)
  const fats = normalizeNutrition(nutrition?.fatsG)
  const total = protein + carbs + fats

  if (total <= 0) {
    return {
      protein: 0,
      carbs: 0,
      fats: 0,
    }
  }

  return {
    protein: Math.round((protein / total) * 100),
    carbs: Math.round((carbs / total) * 100),
    fats: Math.max(0, 100 - Math.round((protein / total) * 100) - Math.round((carbs / total) * 100)),
  }
}

function normalizeScore(value) {
  const safe = clampPercent(Number(value))
  // Compress 0-100 into a more realistic displayed band.
  return Math.round(52 + (safe / 100) * 37)
}

function calibrateStyleScores(styles) {
  if (!styles.length) return []

  const withNormalized = styles.map((style, index) => {
    const raw = Number(style.fitPercent)
    const fallback = 82 - index * 8
    const base = Number.isFinite(raw) && raw > 0 ? raw : fallback
    return {
      ...style,
      fitPercent: normalizeScore(base),
    }
  })

  const spread = withNormalized.map((style) => ({ ...style }))
  for (let i = 1; i < spread.length; i += 1) {
    const maxAllowed = spread[i - 1].fitPercent - 4
    spread[i].fitPercent = Math.max(45, Math.min(spread[i].fitPercent, maxAllowed))
  }

  return spread
}

function calibrateOverallScore(rawOverall, styles) {
  const parsedRaw = Number(rawOverall)
  const normalizedRaw = Number.isFinite(parsedRaw) && parsedRaw > 0 ? normalizeScore(parsedRaw) : 0

  if (!styles.length) return normalizedRaw

  const avgStyle = Math.round(styles.reduce((sum, style) => sum + style.fitPercent, 0) / styles.length)
  const blended = normalizedRaw > 0 ? Math.round((normalizedRaw + avgStyle) / 2) : avgStyle
  return clampPercent(Math.max(50, Math.min(90, blended)))
}

function tryParseJson(rawText) {
  const raw = String(rawText || '').trim()
  if (!raw) return null

  const direct = (() => {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })()
  if (direct) return direct

  const codeFenceMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i)
  if (codeFenceMatch?.[1]) {
    try {
      return JSON.parse(codeFenceMatch[1])
    } catch {
      // ignore and try generic extraction
    }
  }

  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = raw.slice(firstBrace, lastBrace + 1)
    try {
      return JSON.parse(candidate)
    } catch {
      return null
    }
  }

  return null
}

function parseResult(text) {
  const raw = String(text || '').trim()
  const parsedJson = tryParseJson(raw)

  if (parsedJson && typeof parsedJson === 'object') {
    // Handle styles (for beard, haircut, outfit, etc.)
    const rawStyles = Array.isArray(parsedJson.styles)
      ? parsedJson.styles
        .map((style) => ({
          name: String(style?.name || '').trim(),
          fitPercent: Number(style?.fit_percent ?? style?.fitPercent ?? 0),
          why: String(style?.why || '').trim(),
          how: String(style?.how || '').trim(),
          imageUrl: String(style?.imageUrl || '').trim(),
          details: {
            maintenanceLevel: String(style?.details?.maintenance_level || style?.details?.maintenanceLevel || '').trim(),
            stylingTimeMin: normalizeNutrition(style?.details?.styling_time_min ?? style?.details?.stylingTimeMin ?? 0),
            officeFriendly: clampPercent(Number(style?.details?.office_friendly ?? style?.details?.officeFriendly ?? 0)),
            confidenceBoost: clampPercent(Number(style?.details?.confidence_boost ?? style?.details?.confidenceBoost ?? 0)),
          },
        }))
        .filter((style) => style.name || style.why || style.how)
      : []

    const styles = calibrateStyleScores(rawStyles)

    // Handle recipes (for fridge service)
    const recipes = Array.isArray(parsedJson.recipes)
      ? parsedJson.recipes.map((recipe) => ({
          name: String(recipe?.name || '').trim(),
          ingredients: String(recipe?.ingredients || '').trim(),
          steps: String(recipe?.steps || '').trim(),
          imageUrl: String(recipe?.imageUrl || '').trim(),
          nutrition: {
            calories: normalizeNutrition(recipe?.nutrition?.calories),
            proteinG: normalizeNutrition(recipe?.nutrition?.protein_g ?? recipe?.nutrition?.proteinG),
            carbsG: normalizeNutrition(recipe?.nutrition?.carbs_g ?? recipe?.nutrition?.carbsG),
            fatsG: normalizeNutrition(recipe?.nutrition?.fats_g ?? recipe?.nutrition?.fatsG),
            fiberG: normalizeNutrition(recipe?.nutrition?.fiber_g ?? recipe?.nutrition?.fiberG),
          },
          benefits: Array.isArray(recipe?.benefits)
            ? recipe.benefits.map((item) => String(item || '').trim()).filter(Boolean)
            : [],
        }))
      : []

    const summary = String(parsedJson.summary || '').trim()
    const paragraphs = summary
      ? summary
        .split(/\n\s*\n+/)
        .map((part) => part.trim())
        .filter(Boolean)
      : []

    return {
      fitPercent: calibrateOverallScore(parsedJson.fit_percent ?? parsedJson.fitPercent ?? 0, styles),
      paragraphs: paragraphs.length ? paragraphs : ['ما فماش تفاصيل إضافية.'],
      styles,
      recipes,
    }
  }

  const match = raw.match(/FIT_PERCENT\s*:\s*(\d{1,3})/i)
  const fitPercent = match ? calibrateOverallScore(Number(match[1]), []) : 0
  const withoutPercent = raw.replace(/FIT_PERCENT\s*:\s*\d{1,3}\s*/i, '').trim()
  const paragraphs = withoutPercent
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
  return {
    fitPercent,
    paragraphs: paragraphs.length ? paragraphs : [withoutPercent || 'ما فماش تفاصيل إضافية.'],
    styles: [],
    recipes: [],
  }
}

function FitBar({ value }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-sm text-on-surface-variant">
        <span>{value}%</span>
        <span>مواتيتك</span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30">
        <div
          className="h-full gold-gradient transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function StyleCard({ style }) {
  const details = style.details || {}

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high p-4">
      {style.imageUrl ? (
        <img
          src={style.imageUrl}
          alt={style.name || 'Style image'}
          className="w-full h-44 object-cover rounded-lg border border-outline-variant/20 mb-3"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-on-surface">{style.name || 'Style'}</h3>
        <span className="text-sm font-semibold text-primary">{style.fitPercent}%</span>
      </div>
      <FitBar value={style.fitPercent} />

      {(details.maintenanceLevel || details.stylingTimeMin || details.officeFriendly || details.confidenceBoost) ? (
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right">
            <p className="text-on-surface-variant">الصيانة</p>
            <p className="font-semibold text-on-surface">{details.maintenanceLevel || 'غير محدد'}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right">
            <p className="text-on-surface-variant">الوقت اليومي</p>
            <p className="font-semibold text-on-surface">{details.stylingTimeMin || 0} دق</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right">
            <p className="text-on-surface-variant">مناسب للخدمة</p>
            <p className="font-semibold text-on-surface">{details.officeFriendly || 0}%</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right">
            <p className="text-on-surface-variant">دفعة ثقة</p>
            <p className="font-semibold text-on-surface">{details.confidenceBoost || 0}%</p>
          </div>
        </div>
      ) : null}

      {style.why ? <p className="mt-3 text-on-surface whitespace-pre-wrap">{style.why}</p> : null}
      {style.how ? <p className="mt-2 text-on-surface-variant whitespace-pre-wrap">{style.how}</p> : null}
    </div>
  )
}

function MealCard({ recipe }) {
  const split = getMacroSplit(recipe.nutrition)

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high overflow-hidden">
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="w-full h-48 bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">restaurant_menu</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold text-on-surface text-right">{recipe.name}</h3>
        {recipe.ingredients ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-primary text-right mb-2">المكونات:</p>
            <p className="text-sm text-on-surface whitespace-pre-wrap text-right">{recipe.ingredients}</p>
          </div>
        ) : null}
        {recipe.steps ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-primary text-right mb-2">خطوات الطهي:</p>
            <p className="text-sm text-on-surface-variant whitespace-pre-wrap text-right">{recipe.steps}</p>
          </div>
        ) : null}

        {(recipe.nutrition?.calories || recipe.nutrition?.proteinG || recipe.nutrition?.carbsG || recipe.nutrition?.fatsG || recipe.nutrition?.fiberG) ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-primary text-right mb-2">القيمة الغذائية (لكل حصة):</p>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                <span>{split.fats}% دهون</span>
                <span>{split.carbs}% كاربوهيدرات</span>
                <span>{split.protein}% بروتين</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-highest flex">
                <div className="h-full bg-emerald-500" style={{ width: `${split.protein}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${split.carbs}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${split.fats}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right">
                <p className="text-on-surface-variant">سعرات</p>
                <p className="font-semibold text-on-surface">{recipe.nutrition.calories} kcal</p>
              </div>
              <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right">
                <p className="text-on-surface-variant">بروتين</p>
                <p className="font-semibold text-on-surface">{recipe.nutrition.proteinG} g</p>
              </div>
              <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right">
                <p className="text-on-surface-variant">كاربوهيدرات</p>
                <p className="font-semibold text-on-surface">{recipe.nutrition.carbsG} g</p>
              </div>
              <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right">
                <p className="text-on-surface-variant">دهون</p>
                <p className="font-semibold text-on-surface">{recipe.nutrition.fatsG} g</p>
              </div>
              <div className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-right col-span-2">
                <p className="text-on-surface-variant">ألياف</p>
                <p className="font-semibold text-on-surface">{recipe.nutrition.fiberG} g</p>
              </div>
            </div>
          </div>
        ) : null}

        {recipe.benefits?.length ? (
          <div className="mt-4 text-right">
            <p className="text-sm font-semibold text-primary mb-2">فوائد الأكلة:</p>
            <ul className="space-y-1">
              {recipe.benefits.map((benefit, index) => (
                <li key={index} className="text-sm text-on-surface-variant">• {benefit}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function AnalysisResult() {
  const { serviceId } = useParams()
  const location = useLocation()
  const { getAnalysisResult } = useStatus()

  const meta = SERVICE_META[serviceId] || {
    label: serviceId || 'الخدمة',
    route: '/',
    icon: 'auto_awesome',
  }

  const saved = getAnalysisResult(serviceId)
  const resultText = location.state?.result || saved?.result || ''
  const resultsByService = location.state?.resultsByService || saved?.resultsByService || null
  const imageName = location.state?.imageName || saved?.imageName || 'No image name'
  const imageDataUrl = location.state?.imageDataUrl || saved?.imageDataUrl || ''

  const combinedSections = resultsByService
    ? Object.entries(resultsByService)
      .map(([id, text]) => ({ id, text, parsed: parseResult(text) }))
      .filter((item) => item.text)
    : []
  const isCombinedView = combinedSections.length > 1

  const singleParsed = parseResult(resultText)

  return (
    <main className="px-6 lg:px-20 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-right">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {meta.icon}
            </span>
            نتيجة تحليل {meta.label}
          </span>
          <h1 className="text-4xl lg:text-5xl font-black font-headline mt-4">تقرير التحليل</h1>
          <p className="text-on-surface-variant mt-3">هذا هو التقرير الناتج عن الذكاء الاصطناعي بناء على الصورة التي أرسلتها.</p>
        </div>

        {!resultText ? (
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-8 text-right">
            <h2 className="text-2xl font-bold mb-3">ما فماش نتيجة محفوظة</h2>
            <p className="text-on-surface-variant mb-6">اعمل تحليل جديد من صفحة الخدمة باش تظهر النتيجة هنا.</p>
            <Link
              to={meta.route}
              className="inline-flex items-center gap-2 gold-gradient text-on-primary font-bold px-6 py-3 rounded-xl"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              ارجع للخدمة
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl p-5 text-right">
              <p className="text-sm text-on-surface-variant">الصورة</p>
              {imageDataUrl ? (
                <div className="mt-3">
                  <img
                    src={imageDataUrl}
                    alt={imageName}
                    className="w-full max-h-[360px] object-contain rounded-xl border border-outline-variant/20 bg-surface"
                  />
                  <p className="font-semibold text-on-surface mt-2">{imageName}</p>
                </div>
              ) : (
                <p className="font-semibold text-on-surface mt-1">{imageName}</p>
              )}
            </div>

            {isCombinedView ? (
              <div className="space-y-5">
                {combinedSections.map((section) => {
                  const sectionMeta = SECTION_META[section.id] || {
                    title: `نتيجة ${section.id}`,
                    icon: 'auto_awesome',
                  }
                  return (
                    <div key={section.id} className="bg-surface-container border border-primary/20 rounded-2xl p-6 lg:p-8 text-right leading-8">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-2xl font-black font-headline text-primary">{sectionMeta.title}</h2>
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {sectionMeta.icon}
                        </span>
                      </div>
                      {section.parsed.styles.length > 0 ? (
                        <div className="mt-5 space-y-3">
                          {section.parsed.styles.map((style, index) => (
                            <StyleCard key={`${section.id}-style-${index}`} style={style} />
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-5 space-y-4">
                        {section.parsed.paragraphs.map((paragraph, index) => (
                          <p key={`${section.id}-${index}`} className="text-on-surface whitespace-pre-wrap">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-surface-container border border-primary/20 rounded-2xl p-6 lg:p-8 text-right leading-8">
                <h2 className="text-2xl font-black font-headline text-primary mb-4">النتيجة</h2>
                {singleParsed.styles.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {singleParsed.styles.map((style, index) => (
                      <StyleCard key={`single-style-${index}`} style={style} />
                    ))}
                  </div>
                ) : null}
                {singleParsed.recipes.length > 0 ? (
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {singleParsed.recipes.map((recipe, index) => (
                      <MealCard key={`recipe-${index}`} recipe={recipe} />
                    ))}
                  </div>
                ) : null}
                <div className="mt-5 space-y-4">
                  {singleParsed.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-on-surface whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end">
              <Link
                to={meta.route}
                className="bg-surface-container-highest border border-outline-variant/30 text-on-surface font-semibold px-5 py-3 rounded-xl"
              >
                تحليل جديد
              </Link>
              <Link
                to="/"
                className="gold-gradient text-on-primary font-bold px-5 py-3 rounded-xl"
              >
                رجوع للرئيسية
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
