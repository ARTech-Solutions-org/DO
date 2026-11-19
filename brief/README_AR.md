# DO / ONE AI Photo Booth — Codex Starter Pack

هذه حزمة المواصفات **وليست مشروعًا برمجيًا منفذًا**. معتمَد 9 شاشات فقط، مع ثيم حفلة احترافي، نصوص قصيرة، وخلفيات/حركات مستقلة وليست Screenshots كواجهة.

## الخطوات
1. افتح مشروع جديد أو Existing Repo في Codex.
2. ضع محتوى هذه الحزمة في جذر المشروع داخل `brief/`، أو أرفقها في Codex.
3. افتح `CODEX_MASTER_PROMPT.md` وأرسل التعليمات الموجودة فيه إلى Codex.
4. أول مخرجات مطلوبة: مقارنة المرجع بالبراند، إنشاء Design System، ثم أول شاشة Welcome كاملة مع حركة. تابع باقي الشاشات بعد التحقق البصري.
5. تأكد من مقاس شاشة الجهاز والكاميرا ونوع التصوير ووصول الـAPI. لا تضع أي أسرار أو مفاتيح في المحادثة.

## القرارات
- 9 شاشات: Welcome, Choose Your Style, Camera, Countdown, AI Processing, Final Result, QR Download, Thank You, Error & Retry.
- مستبعدة: How It Works, Style Preview المنفصلة, Review & Retake.
- Countdown و QR منفصلتان كما تم طلبه. Error & Retry شاشة حالات عامة وليست مرحلة من التسلسل.
- اختيار Caricature مؤكّد؛ بقية أساليب الصور **غير معتمدة** حتى يختارها العميل.
- القاعدة الحالية: 1080×1920 portrait **افتراض يحتاج تأكيد من الجهاز**.
- الملفات في references/approved-screens توضيحية مأخوذة من لوحات مولّدة، دقتها حوالي 1000×1500، وليست ready-to-ship assets أو Logos صحيحة بالضرورة.
- ملفات الخطوط المرخصة والشعارات الأصلية vector غير مضمّنة؛ اطلبها، ولا تستخرج/تعيد رسم اللوجو كناتج AI.

## ملفات مهمة
- `docs/01_PRODUCT_SPEC.md`: الفلو وتفاصيل الشاشات
- `docs/02_DESIGN_SYSTEM.md`: اللون والخطوط والمؤثرات
- `docs/03_ARCHITECTURE.md`: الهيكل الفني والخصوصية والـQR
- `docs/04_SCREEN_COPY.md`: الكلمات القليلة الظاهرة
- `docs/05_ACCEPTANCE_TESTS.md`: حالات الاختبار
- `docs/06_ASSET_SHOTLIST.md`: الأصول والأوامر البصرية المطلوبة
- `config/screens.json`, `config/styles.json`: مواصفات منظمة
- `CODEX_MASTER_PROMPT.md`: أمر التنفيذ الكامل
