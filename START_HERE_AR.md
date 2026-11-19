# DO / ONE AI Photo Booth — Codex Step-by-Step (Arabic)

## مهم — ده الملف اللي تبدأ بيه

كل البرومبتات بالإنجليزي وجاهزة للنسخ. لا ترسل `brief/CODEX_MASTER_PROMPT.md` كأول أمر لأنه بيطلب تنفيذ المشروع كله دفعة واحدة؛ استخدم **الخطوات من 00 إلى 12 بالترتيب**. ملف الـMaster داخل `brief` مرجع فقط.

### التحضير مرة واحدة
1. اعمل فولدر جديد وفاضي خاص بالفوتو بوث (بعيد تمامًا عن مشروع الكاريكاتير القديم).
2. فكّ الملف المضغوط **داخل فولدر المشروع الجديد**؛ المفروض يظهر `brief/`, `prompts/`, و`START_HERE_AR.md`.
3. افتح الفولدر الجديد في **Codex Local على Windows** (مش Cloud)، لأن المشروع المصدر موجود على `F:`. امنح Codex إذن قراءة مشروع الكاريكاتير القديم فقط عند الحاجة.
4. تأكد أن `brief/references/` يحتوي brand PDFs والصور المرجعية والفيديو والفويس. أصول البراند المعتمدة SVG وملفات الخطوط المرخّصة لو موجودة أضفها في `assets/official/` داخل المشروع الجديد فقط.
5. اختار الموديل والإعداد المكتوبين أعلى ملف كل خطوة، وانسخ **نص البرومبت بعد الخط الفاصل**، وابعت **برومبت واحد فقط** في كل مرة.
6. انتظر نتيجة الاختبارات والـscreenshots، واتأكد إن `docs/PROGRESS.md` اتحدث قبل الخطوة اللي بعدها. لو في Bug، أصلحه في نفس الخطوة.

### الترتيب والموديل
| Step | مهمة | الموديل | Thinking |
|---|---|---|---|
| 00 | فحص الملفات + المشروع القديم **قراءة فقط** | GPT-6.2 Astra | High |
| 01 | Architecture / Scaffold | GPT-6.2 Astra | High |
| 02 | Production visual assets + Fonts | GPT-6.2 Astra | High |
| 03 | Welcome كاملة | GPT-6.2 Astra | High |
| 04 | Choose Style | GPT-6.2 Sol | Medium |
| 05 | Camera + Countdown (شاشتان مستقلتان) | GPT-6.2 Astra | High |
| 06 | دمج Caricature + خلفية موف #966BFC | GPT-6.2 Astra | High |
| 07 | AI Processing / Jobs | GPT-6.2 Sol | High |
| 08 | Final Result / Export | GPT-6.2 Sol | High |
| 09 | QR / Mobile Download | GPT-6.2 Sol | High |
| 10 | Thank You + Error & Retry | GPT-6.2 Sol | Medium |
| 11 | Visual QA + full functional tests | GPT-6.2 Astra | High |
| 12 | Production readiness & handoff | GPT-6.2 Sol | High |

### أهم الثوابت
- عدد الشاشات **9 فقط**، وCountdown وQR منفصلتان.
- لا How it Works ولا Style Preview منفصلة ولا Review/Retake.
- الخلفية النهائية للكاريكاتير **موف `#966BFC`**؛ مشروع المصدر القديم `F:\ARTech\photobooth caracter\photobooth caracter` لا يتعدل نهائيًا.
- الكاريكاتير هو الـStyle الوحيد المعتمد حاليًا.
- التصميم Party / event editorial، نصوص قليلة وتايبوجرافي واضح؛ لا تضع Screenshot ثابت مكان واجهة حقيقية.
- لا API calls مدفوعة أو نشر أو شراء خدمات بلا موافقة صريحة.
- باقي الـStyles، نوع الكاميرا، دقة الشاشة الحقيقية، صلاحية الروابط، أدوات الاستضافة/التخزين ما زالت تحتاج اعتماد قبل إطلاق حقيقي.

### أفضل توفير على Plus
لا تستخدم Astra لكل تعديل صغير. نفّذ Step واحد، وراجع تقريره، ثم انتقل لما بعده. استخدم Sol Medium لتعديلات CSS البسيطة والـbugs المحلية، وAstra High للحالات المعقدة. راجع Usage في Codex لمعرفة رصيدك؛ لا توجد ضمانة لعدد خطوات ثابت على Plus.

### التنبيه المهم للـAssets
GPT-6.2 Astra/Sol موديلات كود، أما إنتاج الصور المتخصصة فمهمة GPT-Image (مثل 2.6 Sunburst) **إذا كانت الأداة متاحة فعلًا في Codex**، أو بنظام الصور الخارجي بعد موافقتك. الملفات الموجودة في `brief` هي مراجع وليست صورًا أصلية قابلة للتحرير.
