-- ==============================================================================
-- YAZAROTA Yaratıcı Yazarlık Platformu - Supabase Veritabanı Şeması ve İlk Verileri
-- Proje ID: rxobuyiyiytiijggozyx
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run" butonuna basınız.
-- ==============================================================================

-- 1. App State Tablosu (Tam Veritabanı Çift Yönlü Eşitleme Deposu)
CREATE TABLE IF NOT EXISTS public.app_state (
    id TEXT PRIMARY KEY DEFAULT 'default',
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kullanıcılar Tablosu (Öğretmen ve Öğrenci Hesapları)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    name TEXT NOT NULL,
    class_grade TEXT DEFAULT '5-A',
    pseudonym TEXT,
    must_change_password BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Hikâyeler ve Yazı Sürümleri Tablosu
CREATE TABLE IF NOT EXISTS public.stories (
    id TEXT PRIMARY KEY,
    student_code TEXT,
    author_username TEXT,
    author_name TEXT,
    author_class TEXT,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    place TEXT,
    time TEXT,
    character TEXT,
    surprise_card TEXT,
    status TEXT DEFAULT 'draft',
    current_version_number INTEGER DEFAULT 1,
    versions JSONB DEFAULT '[]'::jsonb,
    class_id TEXT,
    task_id TEXT,
    test_type TEXT DEFAULT 'standard',
    published_work_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Genç Kalemler Dergisi Yayımlanan Eserler Tablosu
CREATE TABLE IF NOT EXISTS public.published_works (
    id TEXT PRIMARY KEY,
    story_id TEXT,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    author_type TEXT DEFAULT 'pseudonym',
    author_display_name TEXT,
    student_username TEXT,
    teacher_editor_notes TEXT,
    issue_id TEXT,
    issue_number INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    word_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    place TEXT,
    time TEXT,
    character TEXT,
    surprise_card TEXT,
    score NUMERIC DEFAULT 0,
    content TEXT
);

-- 5. Genç Kalemler Dergi Sayıları Tablosu
CREATE TABLE IF NOT EXISTS public.magazine_issues (
    id TEXT PRIMARY KEY,
    issue_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    theme TEXT,
    editor_note TEXT,
    cover_color TEXT DEFAULT 'from-teal-800 to-slate-900',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    work_ids JSONB DEFAULT '[]'::jsonb,
    is_current BOOLEAN DEFAULT FALSE
);

-- 6. Bildirimler Tablosu
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_role TEXT DEFAULT 'student',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    story_id TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Sınıf ve Şubeler Tablosu
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    student_codes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Yazma Görevleri Tablosu
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    class_id TEXT,
    description TEXT,
    target_genre TEXT DEFAULT 'all',
    min_words INTEGER DEFAULT 100,
    max_words INTEGER DEFAULT 500,
    require_surprise_card BOOLEAN DEFAULT TRUE,
    task_type TEXT DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 10 Ölçütlü Analitik Yazma Rubriği Tablosu
CREATE TABLE IF NOT EXISTS public.rubric_criteria (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    max_score NUMERIC DEFAULT 10,
    levels JSONB DEFAULT '[]'::jsonb
);

-- 10. TÜBİTAK / Araştırma Ayarları Tablosu
CREATE TABLE IF NOT EXISTS public.research_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    rubric_max NUMERIC DEFAULT 100,
    parent_consent_required BOOLEAN DEFAULT TRUE,
    anonymous_only BOOLEAN DEFAULT TRUE,
    active_cohort TEXT DEFAULT '2026-Bahar Lise Araştırması'
);

-- ==============================================================================
-- GÜVENLİK VE ROW LEVEL SECURITY (RLS) İZİNLERİ
-- ==============================================================================
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_settings ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (varsa tekrar oluştururken hata vermemesi için)
DROP POLICY IF EXISTS "Allow anon all on app_state" ON public.app_state;
DROP POLICY IF EXISTS "Allow anon all on users" ON public.users;
DROP POLICY IF EXISTS "Allow anon all on stories" ON public.stories;
DROP POLICY IF EXISTS "Allow anon all on published_works" ON public.published_works;
DROP POLICY IF EXISTS "Allow anon all on magazine_issues" ON public.magazine_issues;
DROP POLICY IF EXISTS "Allow anon all on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anon all on classes" ON public.classes;
DROP POLICY IF EXISTS "Allow anon all on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow anon all on rubric_criteria" ON public.rubric_criteria;
DROP POLICY IF EXISTS "Allow anon all on research_settings" ON public.research_settings;

-- Anon ve Authenticated rollere tam okuma/yazma politikaları
CREATE POLICY "Allow anon all on app_state" ON public.app_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on stories" ON public.stories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on published_works" ON public.published_works FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on magazine_issues" ON public.magazine_issues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on classes" ON public.classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on tasks" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on rubric_criteria" ON public.rubric_criteria FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on research_settings" ON public.research_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Şema genel yetkilendirmesi
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- BAŞLANGIÇ VERİLERİNİN YÜKLENMESİ (SEED DATA)
-- ==============================================================================

-- 1. App State Seed (Tüm Yazarota JSON yapısının tam yedeği)
INSERT INTO public.app_state (id, state, updated_at)
VALUES ('default', '{"stories":[{"title":"Mavi Gezegenin Şarkısı","genre":"bilim_kurgu","place":"Uzay İstasyonu Kütüphanesi","time":"Güneş fırtınasının koptuğu an","character":"Kitapları koruyan robot bekçi","surpriseCard":"Işık saçan kristal bir tohum","content":"Kütüphanenin cam kubbesinde güneş fırtınasının mor ışıkları dans ediyordu. Robot bekçi eski bir Türkçe masal kitabını okurken elindeki kristal tohum yeşil bir ışıkla parıldadı.","id":"story-1793265886737-lkfgr","authorUsername":"ogrenci_orta6b_6580","authorName":"Yusuf Kerem Aktaş","authorClass":"6-B","status":"draft","versions":[{"id":"ver-1","versionNumber":1,"title":"Mavi Gezegenin Şarkısı","content":"Kütüphanenin cam kubbesinde güneş fırtınasının mor ışıkları dans ediyordu. Robot bekçi eski bir Türkçe masal kitabını okurken elindeki kristal tohum yeşil bir ışıkla parıldadı.","wordCount":24,"characterCount":176,"createdAt":"2026-10-29T09:24:46.737Z"}],"currentVersionNumber":1,"createdAt":"2026-10-29T09:24:46.737Z","updatedAt":"2026-10-29T09:24:46.737Z"},{"studentCode":"OGRENCI_101","authorName":"Cahit Sıtkı","title":"Otuz Beş Yaş Şiiri","genre":"siir","place":"Eski ahşap konak","time":"Gece yarısı","character":"Tema: Zamanın su gibi akıp gitmesi ve fanilik","surpriseCard":"İmge: Kırık bir ayna gibi parçalanan bulutlar","content":"Yaş otuz beş! yolun yarısı eder.\nDante gibi ortasındayız ömrün.\nDelikanlı çağımızdaki cevher,\nYalvarmak, yakarmak nafile bugün,\nGözünün yaşına bakmadan gider.","id":"story-1793091793402-x9e6x","status":"pending_teacher","versions":[{"id":"ver-1","versionNumber":1,"title":"Otuz Beş Yaş Şiiri","content":"Yaş otuz beş! yolun yarısı eder.\nDante gibi ortasındayız ömrün.\nDelikanlı çağımızdaki cevher,\nYalvarmak, yakarmak nafile bugün,\nGözünün yaşına bakmadan gider.","wordCount":21,"characterCount":158,"createdAt":"2026-10-27T09:03:13.402Z"}],"currentVersionNumber":1,"createdAt":"2026-10-27T09:03:13.402Z","updatedAt":"2026-10-27T09:03:20.768Z"},{"studentCode":"TEST_STU_2","authorName":"Ali Masalcı","title":"Tilki ile Alçakgönüllü Kirpi","genre":"fabl","place":"Ulu meşelerin gölgelediği orman","time":"Sıcak bir yaz öğlesi","character":"Kurnaz ve hazırcevap kızıl tilki ile alçakgönüllü kirpi","surpriseCard":"Çatışma & Ders: Aşırı kibir ve böbürlenme en beklenmedik anda kişiyi gülünç duruma düşürür","content":"Güneşin ormanı kavurduğu sıcak bir yaz günü kurnaz tilki çeşme başında dinlenen kirpiye yaklaştı. Seni küçük diken yumağı dedi gülerek. Benim gibi hızlı koşamazsın. Kirpi başını kaldırdı ve sessizce gülümsedi. Biraz sonra çalıların arasından av köpeğinin ayak sesleri duyulduğunda tilki kaçacak delik ararken kirpi hemen bir top gibi büzülüp güvende kaldı.","id":"story-1793091716177-ybhiw","status":"draft","createdAt":"2026-10-27T09:01:56.177Z","updatedAt":"2026-10-27T09:01:56.177Z"},{"studentCode":"TEST_STU_1","authorName":"Deniz Şair","title":"Yağmurun Ruhu","genre":"siir","place":"Sessiz sahil kasabası","time":"Eylül akşamı","character":"Tema: Yalnızlık ve kentin yabancılaşması","surpriseCard":"İmge: Kırık bir ayna gibi parçalanan bulutlar","content":"Kaldırımlarda koşturan sarı yapraklar,\nPenceremde unutulmuş bir eylül serinliği.\nSessizlik eski bir saatin tıkırtısında çoğalır,\nCeplerimde biriktirdiğim çocukluk rüyası ıslanır.","id":"story-1793091706997-dvkd4","status":"draft","createdAt":"2026-10-27T09:01:46.997Z","updatedAt":"2026-10-27T09:01:46.997Z"},{"title":"Saat Kulesindeki Fısıltı","genre":"polisiye","place":"Tarihi ahşap saat kulesi","time":"Gece yarısı 00.00","character":"Saat tamircisi İhsan Usta","surpriseCard":"Çarkların arasına sıkışmış eski bakır anahtar","versions":[{"id":"v1-flow","versionNumber":1,"title":"Saat Kulesindeki Fısıltı","content":"Gece yarısı saat kulesinin çanları çalmaya başladığında İhsan Usta merdivenlerden yukarı tırmandı. Tozlu çarkların arasında parlayan bir şey gördü. Bu eski bir bakır anahtardı. Anahtarı eline aldığında arkasındaki kapı kilitlendi.","wordCount":35,"characterCount":230,"createdAt":"2026-10-27T08:10:54.328Z","teacherFeedback":{"id":"tf-1793088654394","teacherId":"user-teacher-1","teacherName":"Türk Dili ve Edebiyatı Zümresi","decision":"revision_requested","decisionLabel":"Düzeltme İstendi","generalComment":"Selin tebrikler, gizem ögesi çok güzel kurulmuş. İhsan Ustanın iç sesini ve kuledeki saatin tıkırtılarını biraz daha betimlersen harika bir polisiye olacak.","revisionChecklist":["Saat kulesinin ahşap kokusunu ve çark seslerini betimle","İhsan Ustanın anahtarı görünce kalbinin nasıl çarptığını anlat","Kilitlenen kapıya doğru attığı adımı sahneleştir"],"rubricScores":{"crit-1":8,"crit-2":7,"crit-3":7,"crit-4":6,"crit-5":8,"crit-6":7,"crit-7":8,"crit-8":7,"crit-9":8,"crit-10":7},"rubricTotal":73,"submittedAt":"2026-10-27T08:10:54.394Z"}},{"id":"v2-flow","versionNumber":2,"title":"Saat Kulesindeki Fısıltı","content":"Gece yarısı saat kulesinin devasa pirinç çanları sarsıcı bir gürültüyle çalmaya başladığında İhsan Usta, toz kokulu ahşap basamakları birer birer tırmandı. Çarkların amansız tıkırtısı kulaklarında zonkluyordu. Tam pandülün salındığı noktada, yarım asırlık dişlilerin arasına sıkışmış antika bir bakır anahtar gözüne çarptı. İhsan Ustanın kalbi hızla çarpmaya başladı; bu anahtar, yıllar önce ustasının kaybolduğu geceye aitti. Parmakları soğuk metale değdiği anda, arkasındaki ağır meşe kapı gürültüyle kilitlendi.","wordCount":76,"characterCount":524,"createdAt":"2026-10-27T08:10:54.407Z","studentNotes":"Öğretmenimin önerileri doğrultusunda çark seslerini, pandülü ve İhsan Ustanın ustasıyla olan gizemli bağını ekledim."}],"id":"story-1793088654333-i07i6","authorUsername":"ogrenci_flow","authorName":"Selin Yurt","status":"published","createdAt":"2026-10-27T08:10:54.333Z","updatedAt":"2026-10-27T08:10:54.418Z","currentVersionNumber":2,"publishedWorkId":"pub-1793088654418"},{"title":"Karanlık Çınarın Gölgesi","genre":"polisiye","place":"Eski bir kasaba konağı","time":"Fırtınalı bir sonbahar akşamı","character":"Emekli komiser Tahsin","surpriseCard":"Çatı katında unutulmuş kilitli demir kasa","versions":[{"id":"v1-test","versionNumber":1,"title":"Karanlık Çınarın Gölgesi","content":"Fırtınalı bir sonbahar akşamında emekli komiser Tahsin, terk edilmiş konağın gıcırdayan merdivenlerinden çatı katına çıktı. Yağmur damlaları eski kiremitlere vuruyordu. Köşede paslı bir demir kasa duruyordu. Kasayı açmaya çalıştığında arkasından bir ayak sesi duyuldu.","wordCount":39,"characterCount":260,"createdAt":"2026-10-27T08:10:10.181Z"}],"id":"story-1793088610186-glige","createdAt":"2026-10-27T08:10:10.186Z","updatedAt":"2026-10-27T08:10:10.186Z"},{"id":"demo-story-1","studentCode":"OGR-4281","title":"Perondaki Sarı Mektup","genre":"hikaye","place":"Terk edilmiş ve sarmaşıklarla kaplanmış bir tren istasyonu","time":"Gece yarısı saat tam 03.17’de, herkesin derin uykuda olduğu bir anda","character":"Geçmişindeki büyük kaybı hakkında asla konuşmayan emekli bir edebiyat öğretmeni","surpriseCard":"Karakter beklenmedik, imzasız ve üzerinde eski bir balmumu mühür olan bir mektup alır.","status":"completed","createdAt":"2026-10-24T07:55:25.478Z","updatedAt":"2026-10-26T07:55:25.479Z","currentVersionNumber":2,"classId":"class-9a","taskId":"task-1","testType":"standard","versions":[{"id":"v1-demo","versionNumber":1,"title":"Perondaki Sarı Mektup (İlk Taslak)","content":"Eski tren istasyonu çok karanlıktı. Saat gecenin üçüydü. Emekli öğretmen Selim Bey elinde feneriyle yürüyordu. Yıllar önce buradan ayrılan öğrencisini düşünüyordu. Duvarda sarmaşıkların arasında bir mektup gördü. Mektubun üzerinde mühür vardı. Mektubu açtı ve okumaya başladı. İçinde çok önemli bir itiraf vardı.","wordCount":46,"characterCount":304,"createdAt":"2026-10-24T07:55:25.479Z","studentNotes":"İlk taslak, olayları genel hatlarıyla kurdum.","review":{"id":"rev-v1","evaluatedAt":"2026-10-24T07:55:25.479Z","totalScore":71,"criteriaScores":[{"key":"title","label":"Başlığın Metne Uygunluğu","score":8,"maxScore":10,"justification":"Başlık mektup temasıyla örtüşüyor ancak merak unsuru daha da artırılabilir."},{"key":"plot","label":"Olay Örgüsü ve Kurgu","score":17,"maxScore":25,"justification":"Olay akışı var fakat çok hızlı geçilmiş; serim ve düğüm kısımları genişletilmeli."},{"key":"character","label":"Karakterlerin İşlenişi","score":11,"maxScore":15,"justification":"Selim Bey''in iç dünyası ve geçmiş kaybı biraz daha hissettirilmeli."},{"key":"setting","label":"Mekân ve Zaman Kullanımı","score":7,"maxScore":10,"justification":"Terk edilmiş istasyonun duyusal detayları (rüzgar, sarmaşık kokusu, ray pası) eklenebilir."},{"key":"genre","label":"Seçilen Edebî Türe Uygunluk","score":15,"maxScore":20,"justification":"Hikâye biçimine uygun, durum ve olay dengesi kurulabilir."},{"key":"language","label":"Dil ve Anlatım","score":10,"maxScore":15,"justification":"Kısa ve tekdüze cümleler yerine betimleyici ve zengin ifadeler kullanılabilir."},{"key":"creativity","label":"Özgünlük ve Yaratıcılık","score":3,"maxScore":5,"justification":"Mühürlü mektubun içeriği merak uyandırıyor."}],"generalReview":"Sevgili yazar adayı, hikâyenin temel çatısı ve gizem duygusu çok umut vadediyor! Emekli bir öğretmenin gece yarısı terk edilmiş peronda mektupla karşılaşması merak uyandırıcı. Metnini duyularla ve detaylarla zenginleştirerek bir üst seviyeye taşıyabilirsin.","strengths":["Gece yarısı 03.17 atmosferi ile mühürlü mektup merak ögesini başarıyla tetikliyor.","Selim Bey karakteri edebî bir anlatı için samimi ve merak uyandıran bir figür."],"areasToImprove":["Cümleler çok kısa ve peş peşe sıralanmış; virgüllerle ve bağlaçlarla akıcılık sağlanmalı.","Mektubun içeriğindeki itirafın karakterin geçmiş kaybıyla bağlantısı somutlaştırılmalı."],"topThreeSuggestions":["İstasyonun terk edilmişliğini rayların pası, gece rüzgarı ve eski tahtaların gıcırtısıyla betimle.","Selim Bey''in feneri tutarken ellerinin titremesini ve geçmiş kaybının sızısını hissettir.","Mektuptaki cümlenin en azından bir satırını doğrudan tırnak içinde vererek okuyucunun merakını artır."],"genreCompliance":"Hikâye türünün olay odaklı yapısına uygun ancak betimleme ve durum derinliği geliştirilebilir.","surpriseCardCompliance":"İmzasız mühürlü mektup sürpriz kartı hikâyeye dâhil edilmiş, etkisi bir sonraki sürümde derinleştirilebilir.","nextActionStep":"Metne Selim Bey''in feneri tuttuğu anki hislerini ve istasyonun soğuk rüzgarını anlatan 2-3 betimleyici cümle ekle."}},{"id":"v2-demo","versionNumber":2,"title":"Perondaki Sarı Mektup","content":"Paslı rayların arasına dolan sarmaşıklar, gece yarısı esen serin güz rüzgarıyla fısıldıyordu. Saat kulesinin kırık kadranı tam 03.17’de donup kalmıştı. Emekli edebiyat öğretmeni Selim Bey, yakasını kaldırıp elindeki titrek feneri eski bekleme salonuna doğrulttu. Otuz yıl önce bu perondan el sallayıp bir daha haber alamadığı en parlak öğrencisi Cemil’in hatırası göğsünde ince bir sızıydı. Tam o sırada, peron bankının çatlak tahtasına sıkıştırılmış, kırmızı balmumuyla mühürlenmiş sarı bir zarf çarptı gözüne. Zarfın üzerinde silinmeye yüz tutmuş bir mürekkeple sadece şu yazıyordu: \"Geç kalmış bir özür, hocama...\"","wordCount":89,"characterCount":597,"createdAt":"2026-10-26T07:55:25.479Z","studentNotes":"Gelişim önerilerini uyguladım; betimlemeleri artırdım, mekân seslerini ve karakterin iç dünyasını ekledim.","review":{"id":"rev-v2","evaluatedAt":"2026-10-26T07:55:25.479Z","totalScore":89,"criteriaScores":[{"key":"title","label":"Başlığın Metne Uygunluğu","score":10,"maxScore":10,"justification":"Başlık ile sarı zarf ve mektubun teması kusursuz uyuşuyor."},{"key":"plot","label":"Olay Örgüsü ve Kurgu","score":22,"maxScore":25,"justification":"Olay örgüsü merak ögesiyle dengeli ve sürükleyici bir ritim kazanmış."},{"key":"character","label":"Karakterlerin İşlenişi","score":14,"maxScore":15,"justification":"Selim Bey''in öğrencisine duyduğu özlem ve iç sızısı çok etkileyici verilmiş."},{"key":"setting","label":"Mekân ve Zaman Kullanımı","score":9,"maxScore":10,"justification":"Paslı raylar, sarmaşıkların fısıltısı ve donmuş saat kulesi harika atmosfer yaratmış."},{"key":"genre","label":"Seçilen Edebî Türe Uygunluk","score":18,"maxScore":20,"justification":"Hikâye türünün durum ve duygu yoğunluğunu başarıyla yansıtıyor."},{"key":"language","label":"Dil ve Anlatım","score":13,"maxScore":15,"justification":"Dili zengin, kelime tercihleri çok yerinde, anlatım akıcı."},{"key":"creativity","label":"Özgünlük ve Yaratıcılık","score":3,"maxScore":5,"justification":"Mektubun üzerindeki ithaf hikâyeye çok özgün bir duygu derinliği katmış."}],"generalReview":"Harika bir gelişim örneği! İlk taslaktaki kuru anlatım gitmiş, yerine edebî lezzeti yüksek, atmosferi solunabilen etkileyici bir hikâye gelmiş. Selim Bey''in hüznü ve sarı zarfın sırrı okuru içine çekiyor.","strengths":["\"Paslı rayların arasına dolan sarmaşıklar\" ve \"göğsünde ince bir sızıydı\" gibi ifadeler edebi zenginliği çok yükseltmiş.","Mektup üzerindeki \"Geç kalmış bir özür, hocama...\" yazısı merak duygusunu doruğa çıkarıyor."],"areasToImprove":["Zarfın açıldığı ve içindeki ilk cümlenin okunduğu anı da hikâyeye dâhil ederek bir sonraki sahneye geçilebilir."],"topThreeSuggestions":["Mektubu açarken fenerin titremesi ve Selim Bey''in nefes alışverişiyle gerilimi biraz daha hissettir.","Öğrencinin neden 30 yıl önce gittiğine dair küçük bir ipucu ekle.","Bir sonraki paragrafta mektubun içinden çıkacak sürprizi hazırla."],"genreCompliance":"Hikâye türünün serim ve düğüm aşamaları olgun bir dille inşa edilmiş.","surpriseCardCompliance":"Sürpriz kartı hikâyenin merkezine kusursuz bir kurgusal köprüyle yerleştirilmiş.","nextActionStep":"Selim Bey zarfın balmumunu kırarken duyduğu sesi ve mektubun ilk kelimesini kaleme al."}}]}],"classes":[{"id":"class-9a","name":"9-A Edebiyat Grubu","grade":"9. Sınıf","studentCodes":["OGR-4281","OGR-5192","OGR-3349","OGR-8812","OGR-1904"],"createdAt":"2026-10-27T07:55:25.479Z"},{"id":"class-10b","name":"10-B Yaratıcı Yazarlık Atölyesi","grade":"10. Sınıf","studentCodes":["OGR-7023","OGR-6115","OGR-9441","OGR-2230"],"createdAt":"2026-10-27T07:55:25.479Z"}],"tasks":[{"id":"task-1","title":"TÜBİTAK 2204-A: Ön Test — Mekân ve Karakter Odaklı Hikâye","classId":"class-9a","description":"Rastgele oluşturulan mekân, karakter ve sürpriz kartını kullanarak 150-500 kelimelik bir hikâye kurgulayınız.","targetGenre":"hikaye","minWords":150,"maxWords":500,"requireSurpriseCard":true,"taskType":"pre_test","createdAt":"2026-10-22T07:55:25.479Z"},{"id":"task-2","title":"TÜBİTAK 2204-A: Son Test — Sürpriz Dönüşlü Edebî Metin","classId":"class-9a","description":"YAZAROTA rehberlerinden ve AI geri bildirimlerinden faydalanarak kurgulanacak nihai ölçüm yazısı.","targetGenre":"all","minWords":200,"maxWords":600,"requireSurpriseCard":true,"taskType":"post_test","createdAt":"2026-10-26T07:55:25.479Z"}],"researchSettings":{"rubricMax":100,"parentConsentRequired":true,"anonymousOnly":true,"activeCohort":"2026-Bahar Lise Araştırması"},"users":[{"id":"user-teacher-1","username":"ogretmen","passwordHash":"0302881aa0427245e95b3c0a6e8afbf9bb0540c08f16bdb9971ae7a1147ff0491abd1b668cd505d7bad16892a8c802de9b594ef0b14b13e9ba3eb40314942c7e","salt":"b112bdbde97c12326df19b4d11e21b04","role":"teacher","name":"Türk Dili ve Edebiyatı Zümresi","classGrade":"Tüm Şubeler","mustChangePassword":true,"createdAt":"2026-10-27T08:10:20.148Z"},{"id":"user-student-1","username":"ogrenci1","passwordHash":"3ff3e92b66df8b61b35f472d2cd89c05a16480393ec5269553f0066fd16edf4473721ad5e8916d9ffb8fb99e2ed32bf1bb6076c4814b9b37a17e0f8b1e259e7f","salt":"54118b17610e89ca1d8987c219795843","role":"student","name":"Elif Sena Yıldız","classGrade":"10-A","pseudonym":"Kelimelerin İzi","mustChangePassword":false,"createdAt":"2026-10-27T08:10:20.149Z"},{"id":"user-student-2","username":"ogrenci2","passwordHash":"3ff3e92b66df8b61b35f472d2cd89c05a16480393ec5269553f0066fd16edf4473721ad5e8916d9ffb8fb99e2ed32bf1bb6076c4814b9b37a17e0f8b1e259e7f","salt":"54118b17610e89ca1d8987c219795843","role":"student","name":"Can Berk Demir","classGrade":"11-B","pseudonym":"Mavi Martı","mustChangePassword":false,"createdAt":"2026-10-27T08:10:20.149Z"},{"id":"user-1793088623259-u6tv","username":"ogrenci_test","passwordHash":"b12c2c3506ca1afad2670c271ea80c548f3855f653c3096ae0bb372159b470f24c9df5c23ec8fa3361643ea16d252b6d0a7143abba4f4179bbb8826e05029b41","salt":"69bb91499c0a29099a13f3ecb731ab13","role":"student","name":"Ali Demir","classGrade":"10-B","pseudonym":"Gece Kuşu","mustChangePassword":false,"createdAt":"2026-10-27T08:10:23.259Z"},{"id":"user-1793088654302-782i","username":"ogrenci_flow","passwordHash":"915edc1b293035b4c4d7c11d62eda3cca4b93c19394132b4d76c001add0f14f60f1e3173f18c8326c75f6ab7ec5b6d05f39330f680e2347e02e02aeafec1a8ff","salt":"b9ea9fc4b244bc56bc38587ee9d0ee89","role":"student","name":"Selin Yurt","classGrade":"10-C","pseudonym":"Mavi Kalem","mustChangePassword":false,"createdAt":"2026-10-27T08:10:54.302Z"},{"id":"user-1793088654441-bdoa","username":"ogrenci_baska","passwordHash":"61d751671e98ec2cd38380e6eb657d6f853095c73b44261691437376ec0172728aeb2112d847e35646a86a81112da3eb58166a95236aa0b8dcd1e7a78eb58228","salt":"153500e1039ed0faff32263d0299c85b","role":"student","name":"Burak Kaya","classGrade":"Genel","pseudonym":"Burak Kaya","mustChangePassword":false,"createdAt":"2026-10-27T08:10:54.441Z"},{"id":"user-1793265886712-p4n3","username":"ogrenci_orta6b_6580","passwordHash":"462d7f47d41ddfe6b77912a314ae442bdd8c35735ead419036cf6de2e5dbe10c2f698f480d58d291c7482e9dac73d5bfa9fac17ddbdd5477a3f19815639884e5","salt":"690f5061d2c2c25dfac376f5fb583fad","role":"student","name":"Yusuf Kerem Aktaş","classGrade":"6-B","pseudonym":"Yıldız Avcısı","mustChangePassword":false,"createdAt":"2026-10-29T09:24:46.712Z"}],"publishedWorks":[{"id":"pub-1793088654418","storyId":"story-1793088654333-i07i6","title":"Saat Kulesindeki Fısıltı","content":"Gece yarısı saat kulesinin devasa pirinç çanları sarsıcı bir gürültüyle çalmaya başladığında İhsan Usta, toz kokulu ahşap basamakları birer birer tırmandı. Çarkların amansız tıkırtısı kulaklarında zonkluyordu. Tam pandülün salındığı noktada, yarım asırlık dişlilerin arasına sıkışmış antika bir bakır anahtar gözüne çarptı. İhsan Ustanın kalbi hızla çarpmaya başladı; bu anahtar, yıllar önce ustasının kaybolduğu geceye aitti. Parmakları soğuk metale değdiği anda, arkasındaki ağır meşe kapı gürültüyle kilitlendi.","genre":"polisiye","authorType":"pseudonym","authorDisplayName":"Mavi Kalem","studentUsername":"ogrenci_flow","teacherEditorNotes":"Saat kulesinin atmosferik betimlemeleri ve kurgusal merak ögesi çok başarılı olgunlaşmış. Genç Kalemler için oy birliğiyle seçildi.","issueId":"issue-1","issueNumber":1,"publishedAt":"2026-10-27T08:10:54.418Z","wordCount":76,"likesCount":1,"place":"Tarihi ahşap saat kulesi","time":"Gece yarısı 00.00","character":"Saat tamircisi İhsan Usta","surpriseCard":"Çarkların arasına sıkışmış eski bakır anahtar","score":90},{"id":"pub-work-1","storyId":"demo-story-1","title":"Perondaki Sarı Mektup","genre":"hikaye","authorType":"pseudonym","authorDisplayName":"Mavi Martı","studentUsername":"ogrenci2","teacherEditorNotes":"Atmosfer kurmadaki olgunluk ve mektup üzerindeki ithaf hikâyeye benzersiz bir derinlik kazandırmış. Yayın kurulu tarafından oy birliğiyle seçilmiştir.","issueId":"issue-1","issueNumber":1,"publishedAt":"2026-10-23T08:10:20.149Z","wordCount":89,"likesCount":24,"place":"Terk edilmiş ve sarmaşıklarla kaplanmış bir tren istasyonu","time":"Gece yarısı saat tam 03.17’de","character":"Emekli edebiyat öğretmeni Selim Bey","surpriseCard":"Balmumu mühürlü imzasız sarı mektup","score":94,"content":"Paslı rayların arasına dolan sarmaşıklar, gece yarısı esen serin güz rüzgarıyla fısıldıyordu. Saat kulesinin kırık kadranı tam 03.17’de donup kalmıştı. Emekli edebiyat öğretmeni Selim Bey, yakasını kaldırıp elindeki titrek feneri eski bekleme salonuna doğrulttu. Otuz yıl önce bu perondan el sallayıp bir daha haber alamadığı en parlak öğrencisi Cemil’in hatırası göğsünde ince bir sızıydı. Tam o sırada, peron bankının çatlak tahtasına sıkıştırılmış, kırmızı balmumuyla mühürlenmiş sarı bir zarf çarptı gözüne. Zarfın üzerinde silinmeye yüz tutmuş bir mürekkeple sadece şu yazıyordu: \"Geç kalmış bir özür, hocama...\" Zarfı açtığında içinden çıkan sararmış kurutulmuş akasya yaprağı, geçmişin tüm karanlığını bir anda aydınlattı."},{"id":"pub-work-2","storyId":"demo-story-2","title":"Zamanın Kırık Aynası","genre":"bilim_kurgu","authorType":"real_name","authorDisplayName":"Elif Sena Yıldız","studentUsername":"ogrenci1","teacherEditorNotes":"Bilim kurgu türünün mantığını felsefi bir hafıza sorgulamasıyla harmanlayan çok başarılı bir gençlik eseri.","issueId":"issue-1","issueNumber":1,"publishedAt":"2026-10-25T08:10:20.149Z","wordCount":142,"likesCount":38,"place":"Yerin üç kat altındaki tozlu arşiv odası","time":"Güneş tutulmasının tam ortasında","character":"Yalnızca eski kitapları onaran çırak Kerem","surpriseCard":"Cebinde titreşmeye başlayan antika gümüş pusula","score":96,"content":"Güneşin yerini kapkara bir halkaya bıraktığı o eşsiz dakikada, arşiv odasının rutubetli sessizliği bozuldu. Kerem, 19. yüzyıldan kalma bir cilt kapağını onarırken göğüs cebindeki antika gümüş pusula birdenbire deli gibi dönmeye başladı. Pusulanın ibresi kuzeyi değil, masanın üzerindeki kırık pirinç aynayı gösteriyordu. Aynaya baktığında kendi yansımasını değil, tam kırk yıl sonraki hâlini gördü; yaşlı Kerem ona bir sayfa numarası fısıldıyordu: \"Sayfa 73... Gerçeği orada bulacaksın.\" Titreyen elleriyle cildi açtı; sayfanın arasında kendi el yazısıyla yazılmış yarının tarihi duruyordu."}],"magazineIssues":[{"id":"issue-1","issueNumber":1,"title":"Genç Kalemler — Sayı 1: Peronlar ve Düşler","theme":"Yolculuk, Hatıra ve Zamanın Kırılma Noktaları","editorNote":"Sevgili okurlar, YAZAROTA yazma atölyelerinde filizlenen ve öğretmen geri bildirimleriyle olgunlaşan ilk genç edebî ürünlerimizi gururla sunuyoruz. Her hikâye, rastgele kartların cesur bir zihinle nasıl sanata dönüştüğünün canlı bir kanıtıdır.","coverColor":"from-teal-800 to-slate-900","publishedAt":"2026-10-22T08:10:20.149Z","workIds":["pub-work-1","pub-work-2","pub-1793088654418"],"isCurrent":true}],"notifications":[{"id":"notif-1793091800768-04vk","userId":"all_teachers","userRole":"teacher","title":"Yeni Değerlendirme Talebi","message":"Cahit Sıtkı, “Otuz Beş Yaş Şiiri” adlı eserini incelemeniz için gönderdi.","storyId":"story-1793091793402-x9e6x","type":"submission","read":false,"createdAt":"2026-10-27T09:03:20.768Z"},{"id":"notif-1793088654418-ei9a","userId":"ogrenci_flow","userRole":"student","title":"🎉 Eseriniz Genç Kalemler Dergisi’nde Yayımlandı!","message":"“Saat Kulesindeki Fısıltı” başlıklı eseriniz Genç Kalemler — Sayı 1: Peronlar ve Düşler yayımlandı. Dijital dergiden okuyup PDF/Word çıktısı alabilirsiniz.","storyId":"story-1793088654333-i07i6","type":"magazine","read":false,"createdAt":"2026-10-27T08:10:54.418Z"},{"id":"notif-1793088654413-l5qi","userId":"all_teachers","userRole":"teacher","title":"Yeniden Düzenlenen Yazı Gönderildi","message":"Selin Yurt, “Saat Kulesindeki Fısıltı” adlı eserini incelemeniz için gönderdi.","storyId":"story-1793088654333-i07i6","type":"submission","read":false,"createdAt":"2026-10-27T08:10:54.413Z"},{"id":"notif-1793088654394-lukw","userId":"ogrenci_flow","userRole":"student","title":"Öğretmeniniz Düzeltme İstedi","message":"Öğretmeninizin notu: \"Selin tebrikler, gizem ögesi çok güzel kurulmuş. İhsan Ustanın iç sesini ve kuledeki saatin tıkırtıl...\"","storyId":"story-1793088654333-i07i6","type":"revision","read":false,"createdAt":"2026-10-27T08:10:54.394Z"},{"id":"notif-1793088654339-x0zo","userId":"all_teachers","userRole":"teacher","title":"Yeni Değerlendirme Talebi","message":"Selin Yurt, “Saat Kulesindeki Fısıltı” adlı eserini incelemeniz için gönderdi.","storyId":"story-1793088654333-i07i6","type":"submission","read":false,"createdAt":"2026-10-27T08:10:54.339Z"},{"id":"notif-1","userId":"ogrenci2","userRole":"student","title":"Eseriniz Genç Kalemler Dergisi’nde!","message":"“Perondaki Sarı Mektup” adlı hikâyeniz öğretmeniniz tarafından incelenip onaylandı ve Sayı 1’de yayımlandı.","storyId":"demo-story-1","type":"magazine","read":false,"createdAt":"2026-10-24T08:10:20.149Z"},{"id":"notif-2","userId":"all_teachers","userRole":"teacher","title":"Yeni Yazı Gönderildi","message":"Elif Sena Yıldız (10-A), “Zamanın Kırık Aynası” başlıklı yazısını incelemeniz için gönderdi.","storyId":"demo-story-2","type":"submission","read":true,"createdAt":"2026-10-25T08:10:20.149Z"}],"rubricCriteria":[{"id":"crit-1","key":"title","name":"1. Başlık ve İçerik Uygunluğu","description":"Başlığın metnin konusu, teması ve merak ögesiyle uyumu ve çekiciliği.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Başlık metinle alakasız veya çok klişe.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Metne dair genel bir fikir veriyor fakat merak uyandırmıyor.","score":5},{"level":3,"label":"Yeterli","description":"Metinle uyumlu, dikkat çekici ve konuyu yansıtıyor.","score":7.5},{"level":4,"label":"Çok İyi","description":"Özgün, derin anlam katmanları olan ve okuru doğrudan metne çeken mükemmel başlık.","score":10}]},{"id":"crit-2","key":"plot","name":"2. Olay Örgüsü ve Kurgusal Tutarlılık","description":"Serim, düğüm, çözüm dengesi; çatışma, gerilim ve olay akışının mantıksal sürekliliği.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Olay akışı kopuk, mantık hataları var.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Temel bir olay var fakat geçişler zayıf veya aceleye getirilmiş.","score":5},{"level":3,"label":"Yeterli","description":"Giriş-gelişme-sonuç tutarlı, merak ögesi korunmuş.","score":7.5},{"level":4,"label":"Çok İyi","description":"Sürükleyici, kurgusal doruk noktası ustaca işlenmiş, kusursuz ritim.","score":10}]},{"id":"crit-3","key":"character","name":"3. Karakter Derinliği ve Psikolojisi","description":"Karakterin fiziksel, ruhsal özellikleri, motivasyonları ve iç çatışmalarının inandırıcılığı.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Karakter sadece bir isimden ibaret, duygusu yok.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Temel bir vasfı belirtilmiş ancak davranış motivasyonu eksik.","score":5},{"level":3,"label":"Yeterli","description":"Duygu ve düşünceleri anlaşılır, eylemleriyle örtüşüyor.","score":7.5},{"level":4,"label":"Çok İyi","description":"Karakterin iç dünyası, çelişkileri ve dönüşümü etkileyici bir derinlikle işlenmiş.","score":10}]},{"id":"crit-4","key":"setting","name":"4. Mekân ve Zaman Betimlemeleri","description":"Mekânın ve zamanın duyusal ayrıntılarla (ses, koku, ışık, doku) canlandırılması.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Mekân veya zaman sadece kuru bir bilgi olarak verilmiş.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Basit görsel betimlemeler var ancak atmosfer eksik.","score":5},{"level":3,"label":"Yeterli","description":"Okur mekânı ve zamanı hissedebiliyor, duyusal detaylar mevcut.","score":7.5},{"level":4,"label":"Çok İyi","description":"Mekân adeta yaşayan bir karakter gibi; atmosfer kurgunun ruhunu güçlendiriyor.","score":10}]},{"id":"crit-5","key":"genre","name":"5. Edebî Türün Özelliklerine Uygunluk","description":"Hikâye, masal, şiir, fabl, polisiye, bilim kurgu, anı veya günlüğün yapısal kurallarına sadakat.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Seçilen türün temel nitelikleri göz ardı edilmiş.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Türe dair bazı unsurlar var fakat başka türlerle karışmış.","score":5},{"level":3,"label":"Yeterli","description":"Türe özgü teknikler ve anlatım biçimleri doğru kullanılmış.","score":7.5},{"level":4,"label":"Çok İyi","description":"Türün tüm geleneksel ve modern olanakları ustalıkla harmanlanmış.","score":10}]},{"id":"crit-6","key":"language","name":"6. Dil, Anlatım ve Söz Varlığı Zenginliği","description":"Kelime hazinesinin zenginliği, akıcılık, özgün metaforlar ve mecazların gücü.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Tekdüze, sığ ve tekrara düşen bir söz dağarcığı.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Anlatım anlaşılır fakat klişe ifadeler ağırlıkta.","score":5},{"level":3,"label":"Yeterli","description":"Zengin kelimeler, akıcı cümle yapıları ve edebî bir lezzet.","score":7.5},{"level":4,"label":"Çok İyi","description":"Özgün imgeler, şiirsel ve etkileyici bir üslup, zengin söz varlığı.","score":10}]},{"id":"crit-7","key":"mechanics","name":"7. Yazım ve Noktalama Kurallarına Uygunluk","description":"TDK yazım kurallarına, noktalama işaretlerinin işlevsel ve doğru kullanımına uyum.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Çok sayıda temel yazım ve noktalama hatası var.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Bazı noktalama eksikleri ve yazım hataları mevcut.","score":5},{"level":3,"label":"Yeterli","description":"Büyük ölçüde hatasız, noktalama metnin ritmini destekliyor.","score":7.5},{"level":4,"label":"Çok İyi","description":"Kusursuz yazım, noktalama işaretleri anlatımın temposunu mükemmel yönetiyor.","score":10}]},{"id":"crit-8","key":"creativity","name":"8. Özgünlük ve Yaratıcı Çözümler","description":"Kalıplaşmış klişelerin dışına çıkabilme, benzersiz kurgusal buluşlar ve özgün bakış açısı.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Tamamen bilindik ve öngörülebilir kurgu.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Klasik temalar üzerinde küçük yaratıcı dokunuşlar var.","score":5},{"level":3,"label":"Yeterli","description":"Beklenmedik ayrıntılar, özgün bir anlatım perspektifi.","score":7.5},{"level":4,"label":"Çok İyi","description":"Büyüleyici özgünlük, sıra dışı bir kurgu zekâsı ve unutulmaz bir yaklaşım.","score":10}]},{"id":"crit-9","key":"surprise_card","name":"9. Sürpriz Kartının Doğal Entegrasyonu","description":"Rastgele gelen sürpriz kartının hikâyeye yapay durmadan, ana çatışmaya hizmet edecek şekilde kaynaşması.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Sürpriz kartı kullanılmamış veya metne tamamen yama gibi durmuş.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Metinde yer alıyor fakat kurgusal dönüm noktasına katkısı zayıf.","score":5},{"level":3,"label":"Yeterli","description":"Olay örgüsüyle organik bağ kurulmuş, kırılma anı yaratmış.","score":7.5},{"level":4,"label":"Çok İyi","description":"Sürpriz kartı hikâyenin can damarına dönüşmüş; kurgu bu unsurla zirveye ulaşmış.","score":10}]},{"id":"crit-10","key":"theme_depth","name":"10. Duygu, Düşünce ve İleti Derinliği","description":"Metnin okurda bıraktığı felsefi, insani veya duygusal iz; ana fikrin okura hissettirilişi.","maxScore":10,"levels":[{"level":1,"label":"Geliştirilmeli","description":"Yüzeysel, okurda herhangi bir iz veya duygu bırakmıyor.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Temel bir mesaj var fakat didaktik veya sığ aktarılmış.","score":5},{"level":3,"label":"Yeterli","description":"Okurda empati uyandırıyor, samimi bir duygu aktarımı var.","score":7.5},{"level":4,"label":"Çok İyi","description":"Evrensel insanlık durumlarına temas eden derin, etkileyici ve kalıcı bir duygu iklimi.","score":10}]}]}'::jsonb, NOW())
ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW();

-- 2. Users Seed
INSERT INTO public.users (id, username, password_hash, salt, role, name, class_grade, pseudonym, must_change_password, password_changed_at, created_at)
VALUES ('user-teacher-1', 'ogretmen', '0302881aa0427245e95b3c0a6e8afbf9bb0540c08f16bdb9971ae7a1147ff0491abd1b668cd505d7bad16892a8c802de9b594ef0b14b13e9ba3eb40314942c7e', 'b112bdbde97c12326df19b4d11e21b04', 'teacher', 'Türk Dili ve Edebiyatı Zümresi', 'Tüm Şubeler', NULL, TRUE, NULL, '2026-10-27T08:10:20.148Z')
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  name = EXCLUDED.name,
  class_grade = EXCLUDED.class_grade,
  must_change_password = EXCLUDED.must_change_password;
INSERT INTO public.users (id, username, password_hash, salt, role, name, class_grade, pseudonym, must_change_password, password_changed_at, created_at)
VALUES ('user-student-1', 'ogrenci1', '3ff3e92b66df8b61b35f472d2cd89c05a16480393ec5269553f0066fd16edf4473721ad5e8916d9ffb8fb99e2ed32bf1bb6076c4814b9b37a17e0f8b1e259e7f', '54118b17610e89ca1d8987c219795843', 'student', 'Elif Sena Yıldız', '10-A', 'Kelimelerin İzi', FALSE, NULL, '2026-10-27T08:10:20.149Z')
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  name = EXCLUDED.name,
  class_grade = EXCLUDED.class_grade,
  must_change_password = EXCLUDED.must_change_password;
INSERT INTO public.users (id, username, password_hash, salt, role, name, class_grade, pseudonym, must_change_password, password_changed_at, created_at)
VALUES ('user-student-2', 'ogrenci2', '3ff3e92b66df8b61b35f472d2cd89c05a16480393ec5269553f0066fd16edf4473721ad5e8916d9ffb8fb99e2ed32bf1bb6076c4814b9b37a17e0f8b1e259e7f', '54118b17610e89ca1d8987c219795843', 'student', 'Can Berk Demir', '11-B', 'Mavi Martı', FALSE, NULL, '2026-10-27T08:10:20.149Z')
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  name = EXCLUDED.name,
  class_grade = EXCLUDED.class_grade,
  must_change_password = EXCLUDED.must_change_password;
INSERT INTO public.users (id, username, password_hash, salt, role, name, class_grade, pseudonym, must_change_password, password_changed_at, created_at)
VALUES ('user-1793088623259-u6tv', 'ogrenci_test', 'b12c2c3506ca1afad2670c271ea80c548f3855f653c3096ae0bb372159b470f24c9df5c23ec8fa3361643ea16d252b6d0a7143abba4f4179bbb8826e05029b41', '69bb91499c0a29099a13f3ecb731ab13', 'student', 'Ali Demir', '10-B', 'Gece Kuşu', FALSE, NULL, '2026-10-27T08:10:23.259Z')
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  name = EXCLUDED.name,
  class_grade = EXCLUDED.class_grade,
  must_change_password = EXCLUDED.must_change_password;
INSERT INTO public.users (id, username, password_hash, salt, role, name, class_grade, pseudonym, must_change_password, password_changed_at, created_at)
VALUES ('user-1793088654302-782i', 'ogrenci_flow', '915edc1b293035b4c4d7c11d62eda3cca4b93c19394132b4d76c001add0f14f60f1e3173f18c8326c75f6ab7ec5b6d05f39330f680e2347e02e02aeafec1a8ff', 'b9ea9fc4b244bc56bc38587ee9d0ee89', 'student', 'Selin Yurt', '10-C', 'Mavi Kalem', FALSE, NULL, '2026-10-27T08:10:54.302Z')
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  name = EXCLUDED.name,
  class_grade = EXCLUDED.class_grade,
  must_change_password = EXCLUDED.must_change_password;
INSERT INTO public.users (id, username, password_hash, salt, role, name, class_grade, pseudonym, must_change_password, password_changed_at, created_at)
VALUES ('user-1793088654441-bdoa', 'ogrenci_baska', '61d751671e98ec2cd38380e6eb657d6f853095c73b44261691437376ec0172728aeb2112d847e35646a86a81112da3eb58166a95236aa0b8dcd1e7a78eb58228', '153500e1039ed0faff32263d0299c85b', 'student', 'Burak Kaya', 'Genel', 'Burak Kaya', FALSE, NULL, '2026-10-27T08:10:54.441Z')
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  name = EXCLUDED.name,
  class_grade = EXCLUDED.class_grade,
  must_change_password = EXCLUDED.must_change_password;
INSERT INTO public.users (id, username, password_hash, salt, role, name, class_grade, pseudonym, must_change_password, password_changed_at, created_at)
VALUES ('user-1793265886712-p4n3', 'ogrenci_orta6b_6580', '462d7f47d41ddfe6b77912a314ae442bdd8c35735ead419036cf6de2e5dbe10c2f698f480d58d291c7482e9dac73d5bfa9fac17ddbdd5477a3f19815639884e5', '690f5061d2c2c25dfac376f5fb583fad', 'student', 'Yusuf Kerem Aktaş', '6-B', 'Yıldız Avcısı', FALSE, NULL, '2026-10-29T09:24:46.712Z')
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  name = EXCLUDED.name,
  class_grade = EXCLUDED.class_grade,
  must_change_password = EXCLUDED.must_change_password;

-- 3. Stories Seed
INSERT INTO public.stories (id, student_code, author_username, author_name, author_class, title, genre, place, time, character, surprise_card, status, current_version_number, versions, class_id, task_id, test_type, published_work_id, created_at, updated_at)
VALUES ('story-1793265886737-lkfgr', NULL, 'ogrenci_orta6b_6580', 'Yusuf Kerem Aktaş', '6-B', 'Mavi Gezegenin Şarkısı', 'bilim_kurgu', 'Uzay İstasyonu Kütüphanesi', 'Güneş fırtınasının koptuğu an', 'Kitapları koruyan robot bekçi', 'Işık saçan kristal bir tohum', 'draft', 1, '[{"id":"ver-1","versionNumber":1,"title":"Mavi Gezegenin Şarkısı","content":"Kütüphanenin cam kubbesinde güneş fırtınasının mor ışıkları dans ediyordu. Robot bekçi eski bir Türkçe masal kitabını okurken elindeki kristal tohum yeşil bir ışıkla parıldadı.","wordCount":24,"characterCount":176,"createdAt":"2026-10-29T09:24:46.737Z"}]'::jsonb, NULL, NULL, 'standard', NULL, '2026-10-29T09:24:46.737Z', '2026-10-29T09:24:46.737Z')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  versions = EXCLUDED.versions,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.stories (id, student_code, author_username, author_name, author_class, title, genre, place, time, character, surprise_card, status, current_version_number, versions, class_id, task_id, test_type, published_work_id, created_at, updated_at)
VALUES ('story-1793091793402-x9e6x', 'OGRENCI_101', NULL, 'Cahit Sıtkı', NULL, 'Otuz Beş Yaş Şiiri', 'siir', 'Eski ahşap konak', 'Gece yarısı', 'Tema: Zamanın su gibi akıp gitmesi ve fanilik', 'İmge: Kırık bir ayna gibi parçalanan bulutlar', 'pending_teacher', 1, '[{"id":"ver-1","versionNumber":1,"title":"Otuz Beş Yaş Şiiri","content":"Yaş otuz beş! yolun yarısı eder.\nDante gibi ortasındayız ömrün.\nDelikanlı çağımızdaki cevher,\nYalvarmak, yakarmak nafile bugün,\nGözünün yaşına bakmadan gider.","wordCount":21,"characterCount":158,"createdAt":"2026-10-27T09:03:13.402Z"}]'::jsonb, NULL, NULL, 'standard', NULL, '2026-10-27T09:03:13.402Z', '2026-10-27T09:03:20.768Z')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  versions = EXCLUDED.versions,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.stories (id, student_code, author_username, author_name, author_class, title, genre, place, time, character, surprise_card, status, current_version_number, versions, class_id, task_id, test_type, published_work_id, created_at, updated_at)
VALUES ('story-1793091716177-ybhiw', 'TEST_STU_2', NULL, 'Ali Masalcı', NULL, 'Tilki ile Alçakgönüllü Kirpi', 'fabl', 'Ulu meşelerin gölgelediği orman', 'Sıcak bir yaz öğlesi', 'Kurnaz ve hazırcevap kızıl tilki ile alçakgönüllü kirpi', 'Çatışma & Ders: Aşırı kibir ve böbürlenme en beklenmedik anda kişiyi gülünç duruma düşürür', 'draft', 1, '[]'::jsonb, NULL, NULL, 'standard', NULL, '2026-10-27T09:01:56.177Z', '2026-10-27T09:01:56.177Z')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  versions = EXCLUDED.versions,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.stories (id, student_code, author_username, author_name, author_class, title, genre, place, time, character, surprise_card, status, current_version_number, versions, class_id, task_id, test_type, published_work_id, created_at, updated_at)
VALUES ('story-1793091706997-dvkd4', 'TEST_STU_1', NULL, 'Deniz Şair', NULL, 'Yağmurun Ruhu', 'siir', 'Sessiz sahil kasabası', 'Eylül akşamı', 'Tema: Yalnızlık ve kentin yabancılaşması', 'İmge: Kırık bir ayna gibi parçalanan bulutlar', 'draft', 1, '[]'::jsonb, NULL, NULL, 'standard', NULL, '2026-10-27T09:01:46.997Z', '2026-10-27T09:01:46.997Z')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  versions = EXCLUDED.versions,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.stories (id, student_code, author_username, author_name, author_class, title, genre, place, time, character, surprise_card, status, current_version_number, versions, class_id, task_id, test_type, published_work_id, created_at, updated_at)
VALUES ('story-1793088654333-i07i6', NULL, 'ogrenci_flow', 'Selin Yurt', NULL, 'Saat Kulesindeki Fısıltı', 'polisiye', 'Tarihi ahşap saat kulesi', 'Gece yarısı 00.00', 'Saat tamircisi İhsan Usta', 'Çarkların arasına sıkışmış eski bakır anahtar', 'published', 2, '[{"id":"v1-flow","versionNumber":1,"title":"Saat Kulesindeki Fısıltı","content":"Gece yarısı saat kulesinin çanları çalmaya başladığında İhsan Usta merdivenlerden yukarı tırmandı. Tozlu çarkların arasında parlayan bir şey gördü. Bu eski bir bakır anahtardı. Anahtarı eline aldığında arkasındaki kapı kilitlendi.","wordCount":35,"characterCount":230,"createdAt":"2026-10-27T08:10:54.328Z","teacherFeedback":{"id":"tf-1793088654394","teacherId":"user-teacher-1","teacherName":"Türk Dili ve Edebiyatı Zümresi","decision":"revision_requested","decisionLabel":"Düzeltme İstendi","generalComment":"Selin tebrikler, gizem ögesi çok güzel kurulmuş. İhsan Ustanın iç sesini ve kuledeki saatin tıkırtılarını biraz daha betimlersen harika bir polisiye olacak.","revisionChecklist":["Saat kulesinin ahşap kokusunu ve çark seslerini betimle","İhsan Ustanın anahtarı görünce kalbinin nasıl çarptığını anlat","Kilitlenen kapıya doğru attığı adımı sahneleştir"],"rubricScores":{"crit-1":8,"crit-2":7,"crit-3":7,"crit-4":6,"crit-5":8,"crit-6":7,"crit-7":8,"crit-8":7,"crit-9":8,"crit-10":7},"rubricTotal":73,"submittedAt":"2026-10-27T08:10:54.394Z"}},{"id":"v2-flow","versionNumber":2,"title":"Saat Kulesindeki Fısıltı","content":"Gece yarısı saat kulesinin devasa pirinç çanları sarsıcı bir gürültüyle çalmaya başladığında İhsan Usta, toz kokulu ahşap basamakları birer birer tırmandı. Çarkların amansız tıkırtısı kulaklarında zonkluyordu. Tam pandülün salındığı noktada, yarım asırlık dişlilerin arasına sıkışmış antika bir bakır anahtar gözüne çarptı. İhsan Ustanın kalbi hızla çarpmaya başladı; bu anahtar, yıllar önce ustasının kaybolduğu geceye aitti. Parmakları soğuk metale değdiği anda, arkasındaki ağır meşe kapı gürültüyle kilitlendi.","wordCount":76,"characterCount":524,"createdAt":"2026-10-27T08:10:54.407Z","studentNotes":"Öğretmenimin önerileri doğrultusunda çark seslerini, pandülü ve İhsan Ustanın ustasıyla olan gizemli bağını ekledim."}]'::jsonb, NULL, NULL, 'standard', 'pub-1793088654418', '2026-10-27T08:10:54.333Z', '2026-10-27T08:10:54.418Z')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  versions = EXCLUDED.versions,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.stories (id, student_code, author_username, author_name, author_class, title, genre, place, time, character, surprise_card, status, current_version_number, versions, class_id, task_id, test_type, published_work_id, created_at, updated_at)
VALUES ('story-1793088610186-glige', NULL, NULL, NULL, NULL, 'Karanlık Çınarın Gölgesi', 'polisiye', 'Eski bir kasaba konağı', 'Fırtınalı bir sonbahar akşamı', 'Emekli komiser Tahsin', 'Çatı katında unutulmuş kilitli demir kasa', NULL, 1, '[{"id":"v1-test","versionNumber":1,"title":"Karanlık Çınarın Gölgesi","content":"Fırtınalı bir sonbahar akşamında emekli komiser Tahsin, terk edilmiş konağın gıcırdayan merdivenlerinden çatı katına çıktı. Yağmur damlaları eski kiremitlere vuruyordu. Köşede paslı bir demir kasa duruyordu. Kasayı açmaya çalıştığında arkasından bir ayak sesi duyuldu.","wordCount":39,"characterCount":260,"createdAt":"2026-10-27T08:10:10.181Z"}]'::jsonb, NULL, NULL, 'standard', NULL, '2026-10-27T08:10:10.186Z', '2026-10-27T08:10:10.186Z')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  versions = EXCLUDED.versions,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.stories (id, student_code, author_username, author_name, author_class, title, genre, place, time, character, surprise_card, status, current_version_number, versions, class_id, task_id, test_type, published_work_id, created_at, updated_at)
VALUES ('demo-story-1', 'OGR-4281', NULL, NULL, NULL, 'Perondaki Sarı Mektup', 'hikaye', 'Terk edilmiş ve sarmaşıklarla kaplanmış bir tren istasyonu', 'Gece yarısı saat tam 03.17’de, herkesin derin uykuda olduğu bir anda', 'Geçmişindeki büyük kaybı hakkında asla konuşmayan emekli bir edebiyat öğretmeni', 'Karakter beklenmedik, imzasız ve üzerinde eski bir balmumu mühür olan bir mektup alır.', 'completed', 2, '[{"id":"v1-demo","versionNumber":1,"title":"Perondaki Sarı Mektup (İlk Taslak)","content":"Eski tren istasyonu çok karanlıktı. Saat gecenin üçüydü. Emekli öğretmen Selim Bey elinde feneriyle yürüyordu. Yıllar önce buradan ayrılan öğrencisini düşünüyordu. Duvarda sarmaşıkların arasında bir mektup gördü. Mektubun üzerinde mühür vardı. Mektubu açtı ve okumaya başladı. İçinde çok önemli bir itiraf vardı.","wordCount":46,"characterCount":304,"createdAt":"2026-10-24T07:55:25.479Z","studentNotes":"İlk taslak, olayları genel hatlarıyla kurdum.","review":{"id":"rev-v1","evaluatedAt":"2026-10-24T07:55:25.479Z","totalScore":71,"criteriaScores":[{"key":"title","label":"Başlığın Metne Uygunluğu","score":8,"maxScore":10,"justification":"Başlık mektup temasıyla örtüşüyor ancak merak unsuru daha da artırılabilir."},{"key":"plot","label":"Olay Örgüsü ve Kurgu","score":17,"maxScore":25,"justification":"Olay akışı var fakat çok hızlı geçilmiş; serim ve düğüm kısımları genişletilmeli."},{"key":"character","label":"Karakterlerin İşlenişi","score":11,"maxScore":15,"justification":"Selim Bey''in iç dünyası ve geçmiş kaybı biraz daha hissettirilmeli."},{"key":"setting","label":"Mekân ve Zaman Kullanımı","score":7,"maxScore":10,"justification":"Terk edilmiş istasyonun duyusal detayları (rüzgar, sarmaşık kokusu, ray pası) eklenebilir."},{"key":"genre","label":"Seçilen Edebî Türe Uygunluk","score":15,"maxScore":20,"justification":"Hikâye biçimine uygun, durum ve olay dengesi kurulabilir."},{"key":"language","label":"Dil ve Anlatım","score":10,"maxScore":15,"justification":"Kısa ve tekdüze cümleler yerine betimleyici ve zengin ifadeler kullanılabilir."},{"key":"creativity","label":"Özgünlük ve Yaratıcılık","score":3,"maxScore":5,"justification":"Mühürlü mektubun içeriği merak uyandırıyor."}],"generalReview":"Sevgili yazar adayı, hikâyenin temel çatısı ve gizem duygusu çok umut vadediyor! Emekli bir öğretmenin gece yarısı terk edilmiş peronda mektupla karşılaşması merak uyandırıcı. Metnini duyularla ve detaylarla zenginleştirerek bir üst seviyeye taşıyabilirsin.","strengths":["Gece yarısı 03.17 atmosferi ile mühürlü mektup merak ögesini başarıyla tetikliyor.","Selim Bey karakteri edebî bir anlatı için samimi ve merak uyandıran bir figür."],"areasToImprove":["Cümleler çok kısa ve peş peşe sıralanmış; virgüllerle ve bağlaçlarla akıcılık sağlanmalı.","Mektubun içeriğindeki itirafın karakterin geçmiş kaybıyla bağlantısı somutlaştırılmalı."],"topThreeSuggestions":["İstasyonun terk edilmişliğini rayların pası, gece rüzgarı ve eski tahtaların gıcırtısıyla betimle.","Selim Bey''in feneri tutarken ellerinin titremesini ve geçmiş kaybının sızısını hissettir.","Mektuptaki cümlenin en azından bir satırını doğrudan tırnak içinde vererek okuyucunun merakını artır."],"genreCompliance":"Hikâye türünün olay odaklı yapısına uygun ancak betimleme ve durum derinliği geliştirilebilir.","surpriseCardCompliance":"İmzasız mühürlü mektup sürpriz kartı hikâyeye dâhil edilmiş, etkisi bir sonraki sürümde derinleştirilebilir.","nextActionStep":"Metne Selim Bey''in feneri tuttuğu anki hislerini ve istasyonun soğuk rüzgarını anlatan 2-3 betimleyici cümle ekle."}},{"id":"v2-demo","versionNumber":2,"title":"Perondaki Sarı Mektup","content":"Paslı rayların arasına dolan sarmaşıklar, gece yarısı esen serin güz rüzgarıyla fısıldıyordu. Saat kulesinin kırık kadranı tam 03.17’de donup kalmıştı. Emekli edebiyat öğretmeni Selim Bey, yakasını kaldırıp elindeki titrek feneri eski bekleme salonuna doğrulttu. Otuz yıl önce bu perondan el sallayıp bir daha haber alamadığı en parlak öğrencisi Cemil’in hatırası göğsünde ince bir sızıydı. Tam o sırada, peron bankının çatlak tahtasına sıkıştırılmış, kırmızı balmumuyla mühürlenmiş sarı bir zarf çarptı gözüne. Zarfın üzerinde silinmeye yüz tutmuş bir mürekkeple sadece şu yazıyordu: \"Geç kalmış bir özür, hocama...\"","wordCount":89,"characterCount":597,"createdAt":"2026-10-26T07:55:25.479Z","studentNotes":"Gelişim önerilerini uyguladım; betimlemeleri artırdım, mekân seslerini ve karakterin iç dünyasını ekledim.","review":{"id":"rev-v2","evaluatedAt":"2026-10-26T07:55:25.479Z","totalScore":89,"criteriaScores":[{"key":"title","label":"Başlığın Metne Uygunluğu","score":10,"maxScore":10,"justification":"Başlık ile sarı zarf ve mektubun teması kusursuz uyuşuyor."},{"key":"plot","label":"Olay Örgüsü ve Kurgu","score":22,"maxScore":25,"justification":"Olay örgüsü merak ögesiyle dengeli ve sürükleyici bir ritim kazanmış."},{"key":"character","label":"Karakterlerin İşlenişi","score":14,"maxScore":15,"justification":"Selim Bey''in öğrencisine duyduğu özlem ve iç sızısı çok etkileyici verilmiş."},{"key":"setting","label":"Mekân ve Zaman Kullanımı","score":9,"maxScore":10,"justification":"Paslı raylar, sarmaşıkların fısıltısı ve donmuş saat kulesi harika atmosfer yaratmış."},{"key":"genre","label":"Seçilen Edebî Türe Uygunluk","score":18,"maxScore":20,"justification":"Hikâye türünün durum ve duygu yoğunluğunu başarıyla yansıtıyor."},{"key":"language","label":"Dil ve Anlatım","score":13,"maxScore":15,"justification":"Dili zengin, kelime tercihleri çok yerinde, anlatım akıcı."},{"key":"creativity","label":"Özgünlük ve Yaratıcılık","score":3,"maxScore":5,"justification":"Mektubun üzerindeki ithaf hikâyeye çok özgün bir duygu derinliği katmış."}],"generalReview":"Harika bir gelişim örneği! İlk taslaktaki kuru anlatım gitmiş, yerine edebî lezzeti yüksek, atmosferi solunabilen etkileyici bir hikâye gelmiş. Selim Bey''in hüznü ve sarı zarfın sırrı okuru içine çekiyor.","strengths":["\"Paslı rayların arasına dolan sarmaşıklar\" ve \"göğsünde ince bir sızıydı\" gibi ifadeler edebi zenginliği çok yükseltmiş.","Mektup üzerindeki \"Geç kalmış bir özür, hocama...\" yazısı merak duygusunu doruğa çıkarıyor."],"areasToImprove":["Zarfın açıldığı ve içindeki ilk cümlenin okunduğu anı da hikâyeye dâhil ederek bir sonraki sahneye geçilebilir."],"topThreeSuggestions":["Mektubu açarken fenerin titremesi ve Selim Bey''in nefes alışverişiyle gerilimi biraz daha hissettir.","Öğrencinin neden 30 yıl önce gittiğine dair küçük bir ipucu ekle.","Bir sonraki paragrafta mektubun içinden çıkacak sürprizi hazırla."],"genreCompliance":"Hikâye türünün serim ve düğüm aşamaları olgun bir dille inşa edilmiş.","surpriseCardCompliance":"Sürpriz kartı hikâyenin merkezine kusursuz bir kurgusal köprüyle yerleştirilmiş.","nextActionStep":"Selim Bey zarfın balmumunu kırarken duyduğu sesi ve mektubun ilk kelimesini kaleme al."}}]'::jsonb, 'class-9a', 'task-1', 'standard', NULL, '2026-10-24T07:55:25.478Z', '2026-10-26T07:55:25.479Z')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  versions = EXCLUDED.versions,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- 4. Published Works Seed
INSERT INTO public.published_works (id, story_id, title, genre, author_type, author_display_name, student_username, teacher_editor_notes, issue_id, issue_number, published_at, word_count, likes_count, place, time, character, surprise_card, score, content)
VALUES ('pub-1793088654418', 'story-1793088654333-i07i6', 'Saat Kulesindeki Fısıltı', 'polisiye', 'pseudonym', 'Mavi Kalem', 'ogrenci_flow', 'Saat kulesinin atmosferik betimlemeleri ve kurgusal merak ögesi çok başarılı olgunlaşmış. Genç Kalemler için oy birliğiyle seçildi.', 'issue-1', 1, '2026-10-27T08:10:54.418Z', 76, 1, 'Tarihi ahşap saat kulesi', 'Gece yarısı 00.00', 'Saat tamircisi İhsan Usta', 'Çarkların arasına sıkışmış eski bakır anahtar', 90, 'Gece yarısı saat kulesinin devasa pirinç çanları sarsıcı bir gürültüyle çalmaya başladığında İhsan Usta, toz kokulu ahşap basamakları birer birer tırmandı. Çarkların amansız tıkırtısı kulaklarında zonkluyordu. Tam pandülün salındığı noktada, yarım asırlık dişlilerin arasına sıkışmış antika bir bakır anahtar gözüne çarptı. İhsan Ustanın kalbi hızla çarpmaya başladı; bu anahtar, yıllar önce ustasının kaybolduğu geceye aitti. Parmakları soğuk metale değdiği anda, arkasındaki ağır meşe kapı gürültüyle kilitlendi.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.published_works (id, story_id, title, genre, author_type, author_display_name, student_username, teacher_editor_notes, issue_id, issue_number, published_at, word_count, likes_count, place, time, character, surprise_card, score, content)
VALUES ('pub-work-1', 'demo-story-1', 'Perondaki Sarı Mektup', 'hikaye', 'pseudonym', 'Mavi Martı', 'ogrenci2', 'Atmosfer kurmadaki olgunluk ve mektup üzerindeki ithaf hikâyeye benzersiz bir derinlik kazandırmış. Yayın kurulu tarafından oy birliğiyle seçilmiştir.', 'issue-1', 1, '2026-10-23T08:10:20.149Z', 89, 24, 'Terk edilmiş ve sarmaşıklarla kaplanmış bir tren istasyonu', 'Gece yarısı saat tam 03.17’de', 'Emekli edebiyat öğretmeni Selim Bey', 'Balmumu mühürlü imzasız sarı mektup', 94, 'Paslı rayların arasına dolan sarmaşıklar, gece yarısı esen serin güz rüzgarıyla fısıldıyordu. Saat kulesinin kırık kadranı tam 03.17’de donup kalmıştı. Emekli edebiyat öğretmeni Selim Bey, yakasını kaldırıp elindeki titrek feneri eski bekleme salonuna doğrulttu. Otuz yıl önce bu perondan el sallayıp bir daha haber alamadığı en parlak öğrencisi Cemil’in hatırası göğsünde ince bir sızıydı. Tam o sırada, peron bankının çatlak tahtasına sıkıştırılmış, kırmızı balmumuyla mühürlenmiş sarı bir zarf çarptı gözüne. Zarfın üzerinde silinmeye yüz tutmuş bir mürekkeple sadece şu yazıyordu: "Geç kalmış bir özür, hocama..." Zarfı açtığında içinden çıkan sararmış kurutulmuş akasya yaprağı, geçmişin tüm karanlığını bir anda aydınlattı.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.published_works (id, story_id, title, genre, author_type, author_display_name, student_username, teacher_editor_notes, issue_id, issue_number, published_at, word_count, likes_count, place, time, character, surprise_card, score, content)
VALUES ('pub-work-2', 'demo-story-2', 'Zamanın Kırık Aynası', 'bilim_kurgu', 'real_name', 'Elif Sena Yıldız', 'ogrenci1', 'Bilim kurgu türünün mantığını felsefi bir hafıza sorgulamasıyla harmanlayan çok başarılı bir gençlik eseri.', 'issue-1', 1, '2026-10-25T08:10:20.149Z', 142, 38, 'Yerin üç kat altındaki tozlu arşiv odası', 'Güneş tutulmasının tam ortasında', 'Yalnızca eski kitapları onaran çırak Kerem', 'Cebinde titreşmeye başlayan antika gümüş pusula', 96, 'Güneşin yerini kapkara bir halkaya bıraktığı o eşsiz dakikada, arşiv odasının rutubetli sessizliği bozuldu. Kerem, 19. yüzyıldan kalma bir cilt kapağını onarırken göğüs cebindeki antika gümüş pusula birdenbire deli gibi dönmeye başladı. Pusulanın ibresi kuzeyi değil, masanın üzerindeki kırık pirinç aynayı gösteriyordu. Aynaya baktığında kendi yansımasını değil, tam kırk yıl sonraki hâlini gördü; yaşlı Kerem ona bir sayfa numarası fısıldıyordu: "Sayfa 73... Gerçeği orada bulacaksın." Titreyen elleriyle cildi açtı; sayfanın arasında kendi el yazısıyla yazılmış yarının tarihi duruyordu.')
ON CONFLICT (id) DO NOTHING;

-- 5. Magazine Issues Seed
INSERT INTO public.magazine_issues (id, issue_number, title, theme, editor_note, cover_color, published_at, work_ids, is_current)
VALUES ('issue-1', 1, 'Genç Kalemler — Sayı 1: Peronlar ve Düşler', 'Yolculuk, Hatıra ve Zamanın Kırılma Noktaları', 'Sevgili okurlar, YAZAROTA yazma atölyelerinde filizlenen ve öğretmen geri bildirimleriyle olgunlaşan ilk genç edebî ürünlerimizi gururla sunuyoruz. Her hikâye, rastgele kartların cesur bir zihinle nasıl sanata dönüştüğünün canlı bir kanıtıdır.', 'from-teal-800 to-slate-900', '2026-10-22T08:10:20.149Z', '["pub-work-1","pub-work-2","pub-1793088654418"]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. Notifications Seed
INSERT INTO public.notifications (id, user_id, user_role, title, message, story_id, type, read, created_at)
VALUES ('notif-1793091800768-04vk', 'all_teachers', 'teacher', 'Yeni Değerlendirme Talebi', 'Cahit Sıtkı, “Otuz Beş Yaş Şiiri” adlı eserini incelemeniz için gönderdi.', 'story-1793091793402-x9e6x', 'submission', FALSE, '2026-10-27T09:03:20.768Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, user_role, title, message, story_id, type, read, created_at)
VALUES ('notif-1793088654418-ei9a', 'ogrenci_flow', 'student', '🎉 Eseriniz Genç Kalemler Dergisi’nde Yayımlandı!', '“Saat Kulesindeki Fısıltı” başlıklı eseriniz Genç Kalemler — Sayı 1: Peronlar ve Düşler yayımlandı. Dijital dergiden okuyup PDF/Word çıktısı alabilirsiniz.', 'story-1793088654333-i07i6', 'magazine', FALSE, '2026-10-27T08:10:54.418Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, user_role, title, message, story_id, type, read, created_at)
VALUES ('notif-1793088654413-l5qi', 'all_teachers', 'teacher', 'Yeniden Düzenlenen Yazı Gönderildi', 'Selin Yurt, “Saat Kulesindeki Fısıltı” adlı eserini incelemeniz için gönderdi.', 'story-1793088654333-i07i6', 'submission', FALSE, '2026-10-27T08:10:54.413Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, user_role, title, message, story_id, type, read, created_at)
VALUES ('notif-1793088654394-lukw', 'ogrenci_flow', 'student', 'Öğretmeniniz Düzeltme İstedi', 'Öğretmeninizin notu: "Selin tebrikler, gizem ögesi çok güzel kurulmuş. İhsan Ustanın iç sesini ve kuledeki saatin tıkırtıl..."', 'story-1793088654333-i07i6', 'revision', FALSE, '2026-10-27T08:10:54.394Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, user_role, title, message, story_id, type, read, created_at)
VALUES ('notif-1793088654339-x0zo', 'all_teachers', 'teacher', 'Yeni Değerlendirme Talebi', 'Selin Yurt, “Saat Kulesindeki Fısıltı” adlı eserini incelemeniz için gönderdi.', 'story-1793088654333-i07i6', 'submission', FALSE, '2026-10-27T08:10:54.339Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, user_role, title, message, story_id, type, read, created_at)
VALUES ('notif-1', 'ogrenci2', 'student', 'Eseriniz Genç Kalemler Dergisi’nde!', '“Perondaki Sarı Mektup” adlı hikâyeniz öğretmeniniz tarafından incelenip onaylandı ve Sayı 1’de yayımlandı.', 'demo-story-1', 'magazine', FALSE, '2026-10-24T08:10:20.149Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, user_role, title, message, story_id, type, read, created_at)
VALUES ('notif-2', 'all_teachers', 'teacher', 'Yeni Yazı Gönderildi', 'Elif Sena Yıldız (10-A), “Zamanın Kırık Aynası” başlıklı yazısını incelemeniz için gönderdi.', 'demo-story-2', 'submission', TRUE, '2026-10-25T08:10:20.149Z')
ON CONFLICT (id) DO NOTHING;

-- 7. Classes Seed
INSERT INTO public.classes (id, name, grade, student_codes, created_at)
VALUES ('class-9a', '9-A Edebiyat Grubu', '9. Sınıf', '["OGR-4281","OGR-5192","OGR-3349","OGR-8812","OGR-1904"]'::jsonb, '2026-10-27T07:55:25.479Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.classes (id, name, grade, student_codes, created_at)
VALUES ('class-10b', '10-B Yaratıcı Yazarlık Atölyesi', '10. Sınıf', '["OGR-7023","OGR-6115","OGR-9441","OGR-2230"]'::jsonb, '2026-10-27T07:55:25.479Z')
ON CONFLICT (id) DO NOTHING;

-- 8. Tasks Seed
INSERT INTO public.tasks (id, title, class_id, description, target_genre, min_words, max_words, require_surprise_card, task_type, created_at)
VALUES ('task-1', 'TÜBİTAK 2204-A: Ön Test — Mekân ve Karakter Odaklı Hikâye', 'class-9a', 'Rastgele oluşturulan mekân, karakter ve sürpriz kartını kullanarak 150-500 kelimelik bir hikâye kurgulayınız.', 'hikaye', 150, 500, TRUE, 'pre_test', '2026-10-22T07:55:25.479Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, title, class_id, description, target_genre, min_words, max_words, require_surprise_card, task_type, created_at)
VALUES ('task-2', 'TÜBİTAK 2204-A: Son Test — Sürpriz Dönüşlü Edebî Metin', 'class-9a', 'YAZAROTA rehberlerinden ve AI geri bildirimlerinden faydalanarak kurgulanacak nihai ölçüm yazısı.', 'all', 200, 600, TRUE, 'post_test', '2026-10-26T07:55:25.479Z')
ON CONFLICT (id) DO NOTHING;

-- 9. Rubric Criteria Seed
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-1', 'title', '1. Başlık ve İçerik Uygunluğu', 'Başlığın metnin konusu, teması ve merak ögesiyle uyumu ve çekiciliği.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Başlık metinle alakasız veya çok klişe.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Metne dair genel bir fikir veriyor fakat merak uyandırmıyor.","score":5},{"level":3,"label":"Yeterli","description":"Metinle uyumlu, dikkat çekici ve konuyu yansıtıyor.","score":7.5},{"level":4,"label":"Çok İyi","description":"Özgün, derin anlam katmanları olan ve okuru doğrudan metne çeken mükemmel başlık.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-2', 'plot', '2. Olay Örgüsü ve Kurgusal Tutarlılık', 'Serim, düğüm, çözüm dengesi; çatışma, gerilim ve olay akışının mantıksal sürekliliği.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Olay akışı kopuk, mantık hataları var.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Temel bir olay var fakat geçişler zayıf veya aceleye getirilmiş.","score":5},{"level":3,"label":"Yeterli","description":"Giriş-gelişme-sonuç tutarlı, merak ögesi korunmuş.","score":7.5},{"level":4,"label":"Çok İyi","description":"Sürükleyici, kurgusal doruk noktası ustaca işlenmiş, kusursuz ritim.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-3', 'character', '3. Karakter Derinliği ve Psikolojisi', 'Karakterin fiziksel, ruhsal özellikleri, motivasyonları ve iç çatışmalarının inandırıcılığı.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Karakter sadece bir isimden ibaret, duygusu yok.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Temel bir vasfı belirtilmiş ancak davranış motivasyonu eksik.","score":5},{"level":3,"label":"Yeterli","description":"Duygu ve düşünceleri anlaşılır, eylemleriyle örtüşüyor.","score":7.5},{"level":4,"label":"Çok İyi","description":"Karakterin iç dünyası, çelişkileri ve dönüşümü etkileyici bir derinlikle işlenmiş.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-4', 'setting', '4. Mekân ve Zaman Betimlemeleri', 'Mekânın ve zamanın duyusal ayrıntılarla (ses, koku, ışık, doku) canlandırılması.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Mekân veya zaman sadece kuru bir bilgi olarak verilmiş.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Basit görsel betimlemeler var ancak atmosfer eksik.","score":5},{"level":3,"label":"Yeterli","description":"Okur mekânı ve zamanı hissedebiliyor, duyusal detaylar mevcut.","score":7.5},{"level":4,"label":"Çok İyi","description":"Mekân adeta yaşayan bir karakter gibi; atmosfer kurgunun ruhunu güçlendiriyor.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-5', 'genre', '5. Edebî Türün Özelliklerine Uygunluk', 'Hikâye, masal, şiir, fabl, polisiye, bilim kurgu, anı veya günlüğün yapısal kurallarına sadakat.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Seçilen türün temel nitelikleri göz ardı edilmiş.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Türe dair bazı unsurlar var fakat başka türlerle karışmış.","score":5},{"level":3,"label":"Yeterli","description":"Türe özgü teknikler ve anlatım biçimleri doğru kullanılmış.","score":7.5},{"level":4,"label":"Çok İyi","description":"Türün tüm geleneksel ve modern olanakları ustalıkla harmanlanmış.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-6', 'language', '6. Dil, Anlatım ve Söz Varlığı Zenginliği', 'Kelime hazinesinin zenginliği, akıcılık, özgün metaforlar ve mecazların gücü.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Tekdüze, sığ ve tekrara düşen bir söz dağarcığı.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Anlatım anlaşılır fakat klişe ifadeler ağırlıkta.","score":5},{"level":3,"label":"Yeterli","description":"Zengin kelimeler, akıcı cümle yapıları ve edebî bir lezzet.","score":7.5},{"level":4,"label":"Çok İyi","description":"Özgün imgeler, şiirsel ve etkileyici bir üslup, zengin söz varlığı.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-7', 'mechanics', '7. Yazım ve Noktalama Kurallarına Uygunluk', 'TDK yazım kurallarına, noktalama işaretlerinin işlevsel ve doğru kullanımına uyum.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Çok sayıda temel yazım ve noktalama hatası var.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Bazı noktalama eksikleri ve yazım hataları mevcut.","score":5},{"level":3,"label":"Yeterli","description":"Büyük ölçüde hatasız, noktalama metnin ritmini destekliyor.","score":7.5},{"level":4,"label":"Çok İyi","description":"Kusursuz yazım, noktalama işaretleri anlatımın temposunu mükemmel yönetiyor.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-8', 'creativity', '8. Özgünlük ve Yaratıcı Çözümler', 'Kalıplaşmış klişelerin dışına çıkabilme, benzersiz kurgusal buluşlar ve özgün bakış açısı.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Tamamen bilindik ve öngörülebilir kurgu.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Klasik temalar üzerinde küçük yaratıcı dokunuşlar var.","score":5},{"level":3,"label":"Yeterli","description":"Beklenmedik ayrıntılar, özgün bir anlatım perspektifi.","score":7.5},{"level":4,"label":"Çok İyi","description":"Büyüleyici özgünlük, sıra dışı bir kurgu zekâsı ve unutulmaz bir yaklaşım.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-9', 'surprise_card', '9. Sürpriz Kartının Doğal Entegrasyonu', 'Rastgele gelen sürpriz kartının hikâyeye yapay durmadan, ana çatışmaya hizmet edecek şekilde kaynaşması.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Sürpriz kartı kullanılmamış veya metne tamamen yama gibi durmuş.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Metinde yer alıyor fakat kurgusal dönüm noktasına katkısı zayıf.","score":5},{"level":3,"label":"Yeterli","description":"Olay örgüsüyle organik bağ kurulmuş, kırılma anı yaratmış.","score":7.5},{"level":4,"label":"Çok İyi","description":"Sürpriz kartı hikâyenin can damarına dönüşmüş; kurgu bu unsurla zirveye ulaşmış.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.rubric_criteria (id, key, name, description, max_score, levels)
VALUES ('crit-10', 'theme_depth', '10. Duygu, Düşünce ve İleti Derinliği', 'Metnin okurda bıraktığı felsefi, insani veya duygusal iz; ana fikrin okura hissettirilişi.', 10, '[{"level":1,"label":"Geliştirilmeli","description":"Yüzeysel, okurda herhangi bir iz veya duygu bırakmıyor.","score":2.5},{"level":2,"label":"Kısmen Yeterli","description":"Temel bir mesaj var fakat didaktik veya sığ aktarılmış.","score":5},{"level":3,"label":"Yeterli","description":"Okurda empati uyandırıyor, samimi bir duygu aktarımı var.","score":7.5},{"level":4,"label":"Çok İyi","description":"Evrensel insanlık durumlarına temas eden derin, etkileyici ve kalıcı bir duygu iklimi.","score":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 10. Research Settings Seed
INSERT INTO public.research_settings (id, rubric_max, parent_consent_required, anonymous_only, active_cohort)
VALUES ('default', 100, TRUE, TRUE, '2026-Bahar Lise Araştırması')
ON CONFLICT (id) DO NOTHING;
