"""İlkşen Çetintaş — Türkçe yönetici özgeçmişi (CHRO / İcra Kurulu Üyesi).

Turkish edition of candidates/ilksen_cetintas.py: same facts, same layout,
written for Turkish employers and executive-search firms. It reuses the
English file's private-data loader (phone, e-mail, photo, references live in
the git-ignored candidates/private/), so RESUME_PUBLIC=1 redacts it the same way.

Build:  python build_cv.py candidates/ilksen_cetintas_tr.py --out out/private
"""
from __future__ import annotations

import importlib.util
import os

from resume_builder import Job, Resume

_spec = importlib.util.spec_from_file_location(
    "ilksen_en", os.path.join(os.path.dirname(os.path.abspath(__file__)), "ilksen_cetintas.py"))
_en = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_en)
_priv = _en._priv

_contact: list[tuple[str, str | None]] = [("Ankara, Türkiye", None)]
if _priv:
    _contact += [(_priv.PHONE, "tel:" + _priv.PHONE.replace(" ", "")),
                 (_priv.EMAIL, "mailto:" + _priv.EMAIL)]
_contact += [
    ("linkedin.com/in/ilkşen-çetintaş-b52a6920", _en.LINKEDIN),
    ("Çift vatandaşlık (TC ve AB) · yurt içi ve yurt dışı görevlere açık", None),
]

RESUME = Resume(
    theme="executive",
    lang="tr",
    name="İlkşen Çetintaş",
    role="CHRO · İnsan Kaynaklarından Sorumlu Üst Yönetici · İcra Kurulu Üyesi",
    tagline=("İK'yı sıfırdan kurar  ·  Kurucu liderli şirketleri büyümeye ve halka arza hazırlar  ·  "
             "CEO'ların ve Yönetim Kurullarının güvenilir ortağı"),
    contact_segments=_contact,
    photo=getattr(_priv, "PHOTO", "") if _priv else "",
    metrics=[
        ("~5.000", "çalışan · IC Holding Grup İK sorumluluğu"),
        ("%4 → %25", "1 yılda teknik rollerde kadın · EBRD Altın"),
        ("~2.000", "çalışan · 11 fabrika · 2021'den beri CHRO"),
        ("Halka Arz", "2026 · ŞA-RA'nın kurumsallaşmasını yönetti"),
    ],
    profile=(
        "Sanayi, savunma, enerji ve küresel teknoloji şirketlerinde **25 yılı aşkın** İK liderliği "
        "deneyimine sahip CHRO ve İcra Kurulu üyesi. Uzmanlığı, kurucu liderli şirketleri "
        "profesyonel yönetilen kurumlara dönüştürmek: **ŞA-RA Grubu'nun 2026 Borsa İstanbul "
        "halka arzına uzanan kurumsallaşmasını** yönetti, **IC Holding'de ~5.000 çalışanın** "
        "İK'sından sorumlu oldu ve savunma şirketi **Nurol Teknoloji**'de İK'yı yönetti. "
        "Kariyerinin temelini **TAI** ve **Siemens**'te attı. Temel inancı: İK, insan "
        "kararları **ölçülebilir, adil ve iş sonuçlarına bağlı** olduğunda Yönetim Kurulu "
        "masasındaki yerini hak eder. Türkiye'de ve yurt dışında CHRO, İK Grup Direktörü ve "
        "İK'dan Sorumlu Genel Müdür Yardımcısı rollerine açıktır."
    ),
    highlights=[
        "**ŞA-RA'yı halka arza hazırladı:** ~2.000 çalışanlı, 11 fabrikalı grubun **Temmuz 2026 "
        "Borsa İstanbul halka arzına** uzanan kurumsallaşmasını yönetti; İK yönetişimini, "
        "politikaları, kademe, ücret ve performans sistemlerini **sıfırdan kurdu**.",
        "**Teknik rollerde kadın oranını bir yılda %4'ten %25'e çıkardı:** IC Holding'in elektrik "
        "dağıtım şirketi TREDAŞ'taki program, Çevresel ve Sosyal En İyi Uygulama dalında "
        "**EBRD Altın Ödülü**'nü kazandı (2019).",
        "**İşgücü maliyetini üretime bağladı:** **planlanan ve gerçekleşen üretim tonajını** birim "
        "işçilik maliyetiyle karşılaştıran İşgücü Verimliliği ve Planlama Birimi'ni kurdu; Yönetim "
        "Kurulu **kapasite kararlarını veriye dayanarak** alıyor.",
        "**~5.000 çalışan için tek ve adil ücret sistemi:** inşaattan enerjiye, havalimanlarından "
        "turizme **tüm IC Holding şirketlerinde** **Hay iş değerlemesi**, ortak kademe yapısı ve "
        "ücret skalaları kurdu.",
        "**Siemens'te İK'yı bir işletme gibi yönetti:** Siemens Communications Türkiye'nin İK "
        "departmanını kurdu, departmanın **kâr merkezine** dönüşmesinde kilit rol oynadı ve "
        "**Siemens Avrupa genelinde örnek gösterilen** liderlik programını yönetti.",
    ],
    awards=[
        ("2025", "**Exemplary Woman HR Marvel of the Year**, Global Business Conclave, Londra"),
        ("2024", "**Global 200 Power Leaders**, 42 ülkeden üst düzey yöneticiler arasından, Dubai"),
        ("2019", "**EBRD Altın Ödülü** (Gold Award), Çevresel ve Sosyal En İyi Uygulama: TREDAŞ'taki "
                 "kadın istihdamı girişimini yönetti, ödülün alınmasında belirleyici rol oynadı"),
        ("2018", "**T.C. Enerji ve Tabii Kaynaklar Bakanlığı Ödülü**: madencilik ve enerji sektörünün "
                 "en başarılı ilk üç iş kadını arasında"),
    ],
    experience=[
        Job(
            company="ŞA-RA Grubu (ŞA-RA Enerji İnşaat Tic. ve San. A.Ş.)",
            location="Ankara",
            title="CHRO (İnsan Kaynaklarından Sorumlu Üst Yönetici) · İcra Kurulu Üyesi",
            dates="2021 – Günümüz",
            context=("1985'te kurulan enerji altyapısı üreticisi: çelik yapılar, enerji nakil hattı "
                     "donanımları ve galvanizleme; 11 fabrika, 120'den fazla ülkede proje, ~2.000 "
                     "çalışan. Temmuz 2026'da Borsa İstanbul'da halka arz edildi."),
            bullets=[
                "**Halka arza giden yol:** grubu **2026 halka arzına** taşıyan şirket genelindeki "
                "kurumsallaşma ve kültür dönüşümünü yönetti; İK politikalarını, süreçlerini ve "
                "sistemlerini **sıfırdan kurdu**.",
                "**Stratejik İK:** İK'yı onay veren bir birimden **yönetişim, verimlilik ve iş "
                "sonuçlarından** sorumlu stratejik bir fonksiyona dönüştürdü.",
                "**Yönetim Kurulu ortağı:** **Yönetim Kurulu ve İcra Kurulu**'nun işgücü ve kapasite "
                "kararları için verimlilik, işgücü maliyeti ve risk analizleri hazırlıyor.",
                "**Verimlilik birimi:** **üretim tonajı, birim işçilik maliyeti ve işgücü yapısını** "
                "birbirine bağlayan İşgücü Verimliliği ve Planlama Birimi'ni kurdu ve yönetiyor.",
                "**Adil ücret:** tüm Grup şirketleri için **kademe ve bant bazlı ücret yapısı** kurdu, "
                "her pozisyonu bu yapıya göre inceledi ve **iç ücret adaletini** güçlendiren "
                "düzeltme önerileri hazırladı.",
                "**Performansa dayalı ücret:** hedef karnelerini (departman, ortak ve bireysel "
                "hedefler) ve primleri sonuçlara, yetkinliklere ve yetenek değerlendirmelerine "
                "bağlayan **değişken ücret modelini** tasarladı.",
                "**Dijital İK:** hedefleri, yetkinlik değerlendirmelerini ve onay süreçlerini tek "
                "sistemde toplayan **şirket ERP'si içinde e-İK platformu** kurdu.",
                "**Yetenek ve yönetişim:** işgücü planlama, işe alım, **yedekleme (succession)**, "
                "kariyer planlama ve liderlik gelişimi sistemlerini kurdu; iş hukukuyla uyumlu İK "
                "yönetişim çerçevesini oluşturdu; yıllık İK bütçesini hazırlıyor.",
            ],
        ),
        Job(
            company="Nurol Teknoloji A.Ş.",
            location="Ankara",
            title="CHRO (İnsan Kaynaklarından Sorumlu Üst Yönetici)",
            dates="2019 – 2021",
            context=("Nurol Holding'in savunma teknolojileri şirketi: personel, araç ve hava araçları "
                     "için balistik seramik ve zırh çözümleri."),
            bullets=[
                "**Savunmada İK:** **büyük mavi yaka ekiplerine** sahip, sıkı denetime tabi bir savunma "
                "şirketinde İK stratejisini büyüme ve inovasyon hedefleriyle uyumlu biçimde yönetti.",
                "**Yedekleme:** kritik teknik roller için **liderlik havuzunu** güçlendiren performans, "
                "yetenek ve ödül sistemleri kurdu; yetkinlik bazlı öğrenme yapısını hayata geçirdi.",
                "**Erken kariyer ve çeşitlilik:** çeşitlilik odaklı staj ve **üniversite–sanayi iş "
                "birliği programları** başlatarak genç yetenek havuzunu büyüttü.",
                "**İK teknolojisi:** SAP entegrasyonunda ve **SAP SuccessFactors** geçişinde doğrudan "
                "rol aldı.",
            ],
        ),
        Job(
            company="IC Holding (IC İbrahim Çeçen Yatırım Holding)",
            location="Ankara",
            title="İnsan Kaynaklarından Sorumlu Genel Müdür Yardımcısı",
            dates="2013 – 2019",
            context=("Çok sektörlü Türk holdingi: inşaat ve altyapı (Yavuz Sultan Selim Köprüsü ve Kuzey "
                     "Marmara Otoyolu dahil), enerji (TREDAŞ), havalimanları, turizm ve sanayi; "
                     "~5.000 çalışan."),
            bullets=[
                "**Kadın istihdamı:** TREDAŞ'ta teknik rollerdeki kadın oranını **bir yılda %4'ten "
                "%25'e** çıkaran girişimi yönetti (**EBRD Altın Ödülü 2019**).",
                "**İş değerlemesi:** **tüm holding şirketlerinde Hay iş değerlemesi** yürüttü; tutarlı "
                "ve adil ücret kararları için ortak kademe yapısı ve ücret skalaları oluşturdu.",
                "**İşgücü maliyeti:** İK stratejisini ve **işgücü maliyet planlamasını** yönetti; İK "
                "bütçelerini (ücret, değişken ücret, SGK primleri, kıdem ve ihbar, yan haklar, "
                "eğitim) hazırladı.",
                "**Performans ve ödül:** performansı doğrudan ödüle bağlayan yetkinlik yönetimi ve "
                "**değişken ücret karneleri** tasarladı.",
                "**İK dijitalleşmesi:** daha net veri ve daha iyi kararlar için **SAP tabanlı İK "
                "dönüşümünü** ve işgücü analitiğini yönetti.",
            ],
        ),
        Job(
            company="TED Üniversitesi",
            location="Ankara",
            title="İnsan Kaynakları Direktörü",
            dates="2011 – 2013",
            context=("Türk Eğitim Derneği'nin (TED) vakıf üniversitesi; 2012'deki akademik açılıştan "
                     "önce kuruluş ekibine katıldı."),
            bullets=[
                "Kuruluş ekibinin bir parçası olarak üniversitenin **İK fonksiyonunu ve yönetişimini "
                "sıfırdan kurdu**.",
            ],
        ),
        Job(
            company="Swissôtel Ankara",
            location="Ankara",
            title="İnsan Kaynakları Direktörü · İcra Kurulu Üyesi",
            dates="2009 – 2011",
            context="Swissôtel Hotels & Resorts markasının beş yıldızlı oteli.",
            bullets=[
                "Otelin **İcra Kurulu** üyesi olarak yetenek gelişimi ve değişim programlarını yönetti.",
            ],
        ),
        Job(
            company="Siemens Communications, Türkiye",
            location="",
            title="Grup İnsan Kaynakları Müdürü",
            dates="1996 – 2006",
            context=("Siemens Industries Inc.: Siemens'in Türkiye'deki telekomünikasyon işi (operatör "
                     "altyapısı, kurumsal ağlar, mobil cihazlar)."),
            bullets=[
                "**Kâr merkezi olarak İK:** İK departmanını kurdu ve yönetti; iç hizmet anlaşmaları ve "
                "fiyatlandırmayla departmanın bir hizmet biriminden **kâr merkezine** dönüşmesinde "
                "kilit rol oynadı.",
                "**Leadership Excellence:** Türkiye'de Siemens Leadership Excellence programını yönetti; "
                "program **Siemens Avrupa genelinde örnek** gösterildi.",
                "**Ödül yönetimi:** şirket genelinde **iş değerlemesini (CRG, Hay)** yönetti, kademe ve "
                "bant bazlı ücret yapıları kurdu, karneleri değişken ücrete bağladı.",
                "**Yetenek sistemleri:** **değerlendirme ve gelişim merkezleri**, oryantasyon ve "
                "outplacement programları kurdu; küresel işe alım portalını Türkiye'de devreye aldı; "
                "SAP İK entegrasyonuna katkı sağladı.",
            ],
        ),
        Job(
            company="TAI – Türk Havacılık ve Uzay Sanayii",
            location="Ankara",
            title="Kıdemli İK Sorumlusu",
            dates="1988 – 1996",
            context="Türkiye'nin ulusal havacılık ve uzay şirketi; 1984'te F-16 ortak üretimi için kuruldu.",
            bullets=[
                "İş değerlemesi, ücret skalaları, ücret politikası, ücret anketleri, performans ve ödül "
                "alanlarındaki İK politikalarına katkı sağladı; ilk ve orta kademe yöneticilere "
                "performans değerlendirme ve gelişim atölyeleri verdi.",
            ],
        ),
    ],
    approach=[
        "**Kurumlar kurucularından uzun yaşar:** net yönetişim ve yedekleme şirketi büyütür "
        "(**ŞA-RA, halka arz yolu**).",
        "**Ölçülmeyen yönetilemez:** insan kararları veriye dayanmalı (**İşgücü Verimliliği Birimi**).",
        "**Adil sistemler güven yaratır:** şeffaf kademe, hedef ve ödül (**IC Holding, Siemens, ŞA-RA**).",
        "**İK sonuçlardan sorumludur:** İK bir işletme gibi yönetilmeli (**Siemens'te kâr merkezi İK**).",
        "**Hedefli çeşitlilik:** kapsayıcılık her KPI gibi yönetilmeli (**%4 → %25, EBRD Altın**).",
    ],
    competencies=[
        "İK ve İnsan Stratejisi", "İK Operasyon Modeli Tasarımı", "Organizasyonel Etkinlik",
        "İş ve Kültür Dönüşümü", "Değişim Yönetimi", "Yönetim Kurulu ve Paydaş Yönetimi",
        "İK Yönetişimi ve İnsan Riski", "Ücret ve Yan Haklar", "Ödül Stratejisi ve Toplam Ödül",
        "İş Değerlemesi (Hay, CRG)", "Kademe ve Ücret Yapıları", "İç Ücret Adaleti",
        "Performans ve Değişken Ücret", "Stratejik İşgücü Planlama", "İşgücü Maliyeti ve Verimlilik",
        "Yedekleme ve Kariyer Planlama", "Yetenek Yönetimi", "Liderlik Gelişimi",
        "Kültür ve Çalışan Bağlılığı", "Çeşitlilik ve Kapsayıcılık", "İşe Alım ve Erken Kariyer",
        "İK Dijital Dönüşümü ve HRIS", "SAP ve SAP SuccessFactors", "İK Analitiği",
        "İş Hukuku Uyumu", "Çok Lokasyon ve Mavi Yaka Yönetimi", "Değerlendirme ve Gelişim Merkezleri",
    ],
    education=[
        ("**Orta Doğu Teknik Üniversitesi (ODTÜ)**, İşletme Lisans", "Ankara"),
    ],
    details=[
        ("Diller", "Türkçe (anadil)  ·  İngilizce (ileri)  ·  Almanca (iyi düzeyde)"),
        ("Mobilite", "Çift vatandaşlık (TC ve AB); yurt içinde ve yurt dışında görev alabilir"),
    ],
    references=(getattr(_priv, "REFERENCES_TR", "") if _priv else "") or
               "Üst düzey referanslar (TED, Siemens) talep üzerine paylaşılır.",
    keywords=("CHRO, İnsan Kaynakları, İK Direktörü, İcra Kurulu, Yönetim Kurulu, kurumsallaşma, "
              "halka arz, ücret yönetimi, iş değerlemesi, Hay, performans yönetimi, değişken ücret, "
              "işgücü planlama, verimlilik, yedekleme, liderlik gelişimi, SAP SuccessFactors"),
    headings={
        "profile": "Yönetici Profili",
        "highlights": "Öne Çıkan Başarılar",
        "awards": "Ödüller ve Takdirler",
        "experience": "Profesyonel Deneyim",
        "approach": "Liderlik Yaklaşımı",
        "competencies": "Temel Yetkinlikler",
        "education": "Eğitim",
        "details": "Ek Bilgiler",
        "references": "Referanslar",
    },
    basename="Ilksen_Cetintas_CHRO_TR",
)
