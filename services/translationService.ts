import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * LibreTranslate Service
 * Integrates with LibreTranslate for dynamic app translation.
 * Uses a local cache to minimize API calls and ensure performance.
 */

const LIBRE_TRANSLATE_URL = 'https://libretranslate.de/translate';
const CACHE_KEY_PREFIX = '@translation_cache_';

export type SupportedLang = 'fr' | 'en' | 'ar';

export const translationService = {
  /**
   * Translates a string using LibreTranslate API.
   * Checks local cache first.
   */
  translate: async (text: string, target: SupportedLang, source: SupportedLang = 'fr'): Promise<string> => {
    if (!text || target === source) return text;

    const cacheKey = `${CACHE_KEY_PREFIX}${target}_${text.substring(0, 50)}`;
    
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return cached;

      const response = await axios.post(LIBRE_TRANSLATE_URL, {
        q: text,
        source: source,
        target: target,
        format: 'text',
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const translatedText = response.data.translatedText;
      
      // Cache the result
      await AsyncStorage.setItem(cacheKey, translatedText);
      return translatedText;
    } catch (error) {
      console.warn('[TRANSLATION ERROR] Failed to fetch from LibreTranslate:', error);
      return text; // Fallback to original text
    }
  },

  /**
   * Helper for bulk translation (useful for hotel lists)
   */
  translateList: async (list: string[], target: SupportedLang): Promise<string[]> => {
    return Promise.all(list.map(t => translationService.translate(t, target)));
  }
};

/**
 * Static Dictionary for core UI elements (Instant translation, no API needed)
 */
export const uiTranslations: Record<string, Record<SupportedLang, string>> = {
  'Accueil': { fr: 'Accueil', en: 'Home', ar: 'الرئيسية' },
  'Heures': { fr: 'Heures', en: 'Hours', ar: 'ساعات' },
  'Min': { fr: 'Min', en: 'Min', ar: 'دقيقة' },
  'Sec': { fr: 'Sec', en: 'Sec', ar: 'ثانية' },
  'dans': { fr: 'dans', en: 'in', ar: 'خلال' },
  'Adhan en cours...': { fr: 'Adhan en cours...', en: 'Adhan in progress...', ar: 'الأذان يرفع الآن...' },
  'Appel à la Prière': { fr: 'Appel à la Prière', en: 'Call to Prayer', ar: 'حي على الصلاة' },
  'Appuyez pour couper le son': { fr: 'Appuyez pour couper le son', en: 'Tap to mute', ar: 'اضغط لكتم الصوت' },
  'Localisation...': { fr: 'Localisation...', en: 'Locating...', ar: 'جاري تحديد الموقع...' },
  'Ma Position': { fr: 'Ma Position', en: 'My Location', ar: 'موقعي الحالي' },
  'Tunis, Tunisie': { fr: 'Tunis, Tunisie', en: 'Tunis, Tunisia', ar: 'تونس، تونس' },
  'Permission refusée': { fr: 'Permission refusée', en: 'Permission denied', ar: 'تم رفض الإذن' },
  'Services': { fr: 'Services', en: 'Services', ar: 'الخدمات' },
  'Adhkar': { fr: 'Adhkar', en: 'Adhkar', ar: 'الأذكار' },
  'Douaa': { fr: 'Douaa', en: 'Dua', ar: 'الأدعية' },
  'Mosquées': { fr: 'Mosquées', en: 'Mosques', ar: 'المساجد' },
  'Calendrier': { fr: 'Calendrier', en: 'Calendar', ar: 'التقويم' },
  'Prière': { fr: 'Prière', en: 'Prayer', ar: 'صلاة' },
  'Vols': { fr: 'Vols', en: 'Flights', ar: 'الرحلات الجوية' },
  'VOLS': { fr: 'VOLS', en: 'FLIGHTS', ar: 'رحلات' },
  'Hôtels': { fr: 'Hôtels', en: 'Hotels', ar: 'فنادق' },
  'LOGEMENT': { fr: 'LOGEMENT', en: 'STAY', ar: 'فنادق' },
  'GUIDE': { fr: 'GUIDE', en: 'GUIDE', ar: 'مرشد' },
  'Profil': { fr: 'Profil', en: 'Profile', ar: 'الملف الشخصي' },
  'Langue': { fr: 'Langue', en: 'Language', ar: 'اللغة' },
  'Formules': { fr: 'Formules', en: 'Packages', ar: 'عروض' },
  'Spirituelle': { fr: 'Spirituelle', en: 'Spiritual', ar: 'روحانيات' },
  'Assistant Sabeel': { fr: 'Assistant Sabeel', en: 'Sabeel Assistant', ar: 'مساعد سبيل' },
  'Besoin d’aide pour choisir ?': { fr: 'Besoin d’aide pour choisir ?', en: 'Need help choosing?', ar: 'تبحث عن مساعدة؟' },
  "Laissez-nous vous guider": { fr: "Laissez-nous vous guider", en: "Let us guide you", ar: "دعنا نوجهك" },
  'Quel est votre budget ?': { fr: 'Quel est votre budget ?', en: 'What is your budget?', ar: 'ما هي ميزانيتك؟' },
  "Trouvons l’offre idéale": { fr: "Trouvons l’offre idéale", en: "Let's find the ideal offer", ar: "لنجد العرض المثالي" },
  'Comparez les packs': { fr: 'Comparez les packs', en: 'Compare packages', ar: 'قارن العروض' },
  "Simplement et rapidement": { fr: "Simplement et rapidement", en: "Simple and fast", ar: "ببساطة وبسرعة" },
  'AVIS PÈLERINS': { fr: 'AVIS PÈLERINS', en: 'PILGRIM REVIEWS', ar: 'آراء الحجاج' },
  'VOIR PLUS': { fr: 'VOIR PLUS', en: 'SEE MORE', ar: 'عرض المزيد' },
  "Ce que les autres pèlerins disent sur les agences": { fr: "Ce que les autres pèlerins disent sur les agences", en: "What fellow pilgrims are saying", ar: "ما يقوله المعتمرون عن الوكالات" },
  'Makkah': { fr: 'La Mecque', en: 'Makkah', ar: 'مكة المكرمة' },
  'Madinah': { fr: 'Médine', en: 'Madinah', ar: 'المدينة المنورة' },
  'Jeddah': { fr: 'Djeddah', en: 'Jeddah', ar: 'جدة' },
  'Taif': { fr: 'Taëf', en: 'Taif', ar: 'الطائف' },
  'Informations personnelles': { fr: 'Informations personnelles', en: 'Personal Information', ar: 'المعلومات الشخصية' },
  'Mes Compagnons': { fr: 'Compagnons', en: 'Companions', ar: 'المرافقون' },
  'Documents': { fr: 'Documents', en: 'Documents', ar: 'المستندات' },
  'Paramètres': { fr: 'Paramètres', en: 'Settings', ar: 'الإعدادات' },
  'Notifications': { fr: 'Notifications', en: 'Notifications', ar: 'الإشعارات' },
  'Confidentialité': { fr: 'Confidentialité', en: 'Privacy', ar: 'الخصوصية' },
  'Aide & Support': { fr: 'Aide & Support', en: 'Help & Support', ar: 'المساعدة والدعم' },
  'Déconnexion': { fr: 'Déconnexion', en: 'Sign Out', ar: 'تسجيل الخروج' },
  'Agence Solo': { fr: 'Agence Solo', en: 'Solo Agency', ar: 'وكالة سولو' },
  'Vols & Transports': { fr: 'Vols & Transports', en: 'Flights & Transport', ar: 'الرحلات والنقل' },
  'Hébergement': { fr: 'Hébergement', en: 'Accommodation', ar: 'الإقامة' },
  'Guide & Services': { fr: 'Guide & Services', en: 'Guide & Services', ar: 'المرشد والخدمات' },
  'Modifier le profil': { fr: 'Modifier le profil', en: 'Edit Profile', ar: 'تعديل الملف الشخصي' },
  'Sauvegarder': { fr: 'Sauvegarder', en: 'Save', ar: 'حفظ' },
  'MON COMPTE': { fr: 'COMPTE', en: 'ACCOUNT', ar: 'الحساب' },
  'Mon Compte': { fr: 'Compte', en: 'Account', ar: 'الحساب' },
  'Mes avis': { fr: 'Avis', en: 'Reviews', ar: 'آراء' },
  'Mes documents': { fr: 'Documents', en: 'Documents', ar: 'المستندات' },
  'Éléments sauvegardés': { fr: 'Éléments sauvegardés', en: 'Saved items', ar: 'العناصر المحفوظة' },
  'RELATIONS & SERVICES': { fr: 'RELATIONS & SERVICES', en: 'RELATIONS & SERVICES', ar: 'العلاقات والخدمات' },
  'Mes compagnons': { fr: 'Compagnons', en: 'Companions', ar: 'المرافقون' },
  'Mon agence': { fr: 'Agence', en: 'Agency', ar: 'الوكالة' },
  'Mon Code QR & Identifiant': { fr: 'Code QR & Identifiant', en: 'QR Code & ID', ar: 'رمز QR والمعرف' },
  'PARAMÈTRES': { fr: 'PARAMÈTRES', en: 'SETTINGS', ar: 'الإعدادات' },
  'Changer le mot de passe': { fr: 'Changer le mot de passe', en: 'Change password', ar: 'تغيير كلمة المرور' },
  "Langue de l'application": { fr: "Langue de l'application", en: "App language", ar: "لغة التطبيق" },
  'Mode sombre': { fr: 'Mode sombre', en: 'Dark mode', ar: 'الوضع الداكن' },
  'Partager ma position': { fr: 'Partager la position', en: 'Share location', ar: 'مشاركة الموقع' },
  'INFORMATIONS': { fr: 'INFORMATIONS', en: 'INFORMATION', ar: 'معلومات' },
  'À propos de Sabeel': { fr: 'À propos de Sabeel', en: 'About Sabeel', ar: 'عن سبيل' },
  'COMPTE': { fr: 'COMPTE', en: 'ACCOUNT', ar: 'الحساب' },
  'Se déconnecter': { fr: 'Se déconnecter', en: 'Sign out', ar: 'تسجيل الخروج' },
  'Supprimer le compte': { fr: 'Supprimer le compte', en: 'Delete account', ar: 'حذف الحساب' },
  'Messages': { fr: 'Messages', en: 'Messages', ar: 'الرسائل' },
  'Favoris': { fr: 'Favoris', en: 'Favorites', ar: 'المفضلة' },
  'Carte': { fr: 'Carte', en: 'Map', ar: 'الخريطة' },
  'Avis': { fr: 'Avis', en: 'Reviews', ar: 'آراء' },
  'Compagnons': { fr: 'Compagnons', en: 'Companions', ar: 'المرافقون' },
  'Membre': { fr: 'Membre', en: 'Member', ar: 'عضو' },
  'Complétez votre profil': { fr: 'Complétez votre profil', en: 'Complete your profile', ar: 'اكمل ملفك الشخصي' },
  'Plus que quelques étapes pour débloquer toutes les fonctionnalités.': { fr: 'Plus que quelques étapes pour débloquer toutes les fonctionnalités.', en: 'Just a few more steps to unlock all features.', ar: 'بضع خطوات أخرى لفتح جميع الميزات.' },
  'Tous': { fr: 'Tous', en: 'All', ar: 'الكل' },
  'Filtres': { fr: 'Filtres', en: 'Filters', ar: 'الفلاتر' },
  'Emplacement': { fr: 'Emplacement', en: 'Location', ar: 'الموقع' },
  'Modifier': { fr: 'Modifier', en: 'Edit', ar: 'تعديل' },
  'Ville de départ': { fr: 'Ville de départ', en: 'Departure city', ar: 'مدينة المغادرة' },
  'Date du voyage': { fr: 'Date du voyage', en: 'Travel date', ar: 'تاريخ السفر' },
  'Escales': { fr: 'Escales', en: 'Stops', ar: 'التوقفات' },
  'Note minimum': { fr: 'Note minimum', en: 'Minimum rating', ar: 'الحد الأدنى للتقييم' },
  'Vols, Logement, Guide, Pack avec Agence': { fr: 'Vols, Logement, Guide, Pack avec Agence', en: 'Flights, Accommodation, Guide, Agency Packs', ar: 'طيران، إقامة، مرشد، باقات وكالات' },
  'Détails': { fr: 'Détails', en: 'Details', ar: 'التفاصيل' },
  'Prix': { fr: 'Prix', en: 'Price', ar: 'السعر' },
  'Réserver': { fr: 'Réserver', en: 'Book Now', ar: 'احجز الآن' },
  'Filtrer': { fr: 'Filtrer', en: 'Filter', ar: 'تصفية' },
  'Appliquer': { fr: 'Appliquer', en: 'Apply', ar: 'تطبيق' },
  'Direct': { fr: 'Direct', en: 'Direct', ar: 'مباشر' },
  '1 Escale': { fr: '1 Escale', en: '1 Stop', ar: 'توقف واحد' },
  'IDENTITÉ': { fr: 'IDENTITÉ', en: 'IDENTITY', ar: 'الهوية' },
  'COORDONNÉES': { fr: 'COORDONNÉES', en: 'CONTACT', ar: 'بيانات الاتصال' },
  'Prénom': { fr: 'Prénom', en: 'First Name', ar: 'الاسم الأول' },
  'Nom': { fr: 'Nom', en: 'Last Name', ar: 'اللقب' },
  'Genre': { fr: 'Genre', en: 'Gender', ar: 'الجنس' },
  'Nationalité': { fr: 'Nationalité', en: 'Nationality', ar: 'الجنسية' },
  'Date de naissance': { fr: 'Date de naissance', en: 'Date of birth', ar: 'تاريخ الميلاد' },
  'Téléphone': { fr: 'Téléphone', en: 'Phone', ar: 'الهاتف' },
  'Adresse': { fr: 'Adresse', en: 'Address', ar: 'العنوان' },
  'Ville': { fr: 'Ville', en: 'City', ar: 'المدينة' },
  'Pays': { fr: 'Pays', en: 'Country', ar: 'البلد' },
  'Enregistrer': { fr: 'Enregistrer', en: 'Save Changes', ar: 'حفظ التغييرات' },
  'Enregistrement...': { fr: 'Enregistrement...', en: 'Saving...', ar: 'جاري الحفظ...' },
  'Votre prénom': { fr: 'Votre prénom', en: 'Your first name', ar: 'اسمك الأول' },
  'Votre nom': { fr: 'Votre nom', en: 'Your last name', ar: 'لقبك' },
  'Votre nationalité': { fr: 'Votre nationalité', en: 'Your nationality', ar: 'جنسيتك' },
  'Votre ville': { fr: 'Votre ville', en: 'Your city', ar: 'مدينتك' },
  'Rue, numéro...': { fr: 'Rue, numéro...', en: 'Street, number...', ar: 'الشارع، الرقم...' },
  'Non renseignée': { fr: 'Non renseignée', en: 'Not specified', ar: 'غير محدد' },
  'Choisir le genre': { fr: 'Choisir le genre', en: 'Choose gender', ar: 'اختر الجنس' },
  'Choisir le pays': { fr: 'Choisir le pays', en: 'Choose country', ar: 'اختر البلد' },
  'Rechercher un pays...': { fr: 'Rechercher un pays...', en: 'Search for a country...', ar: 'ابحث عن بلد...' },
  'ID Sabeel : ': { fr: 'ID Sabeel : ', en: 'Sabeel ID: ', ar: 'معرف سبيل: ' },
  'Inconnu': { fr: 'Inconnu', en: 'Unknown', ar: 'غير معروف' },
  'Homme': { fr: 'Homme', en: 'Male', ar: 'ذكر' },
  'Femme': { fr: 'Femme', en: 'Female', ar: 'أنثى' },
  'Choisir un pays': { fr: 'Choisir un pays', en: 'Choose a country', ar: 'اختر بلداً' },
  'Salam, ': { fr: 'Salam, ', en: 'Salam, ', ar: 'سلام، ' },
  'vous': { fr: 'vous', en: 'you', ar: 'أنت' },
  'Portefeuille Sabeel': { fr: 'Portefeuille Sabeel', en: 'Sabeel Wallet', ar: 'محفظة سبيل' },
  'Enregistré avec succès !': { fr: 'Enregistré avec succès !', en: 'Saved successfully!', ar: 'تم الحفظ بنجاح!' },
  'Chargement...': { fr: 'Chargement...', en: 'Loading...', ar: 'جاري التحميل...' },
  'Annuler': { fr: 'Annuler', en: 'Cancel', ar: 'إلغاء' },
  'Confirmer': { fr: 'Confirmer', en: 'Confirm', ar: 'تأكيد' },
  'Fermer': { fr: 'Fermer', en: 'Close', ar: 'إغلاق' },
  'OK': { fr: 'OK', en: 'OK', ar: 'موافق' },
  'ALERTE SOS ENVOYÉE': { fr: 'ALERTE SOS ENVOYÉE', en: 'SOS ALERT SENT', ar: 'تم إرسال إنذار SOS' },
  'Votre position a été partagée avec les services de secours et votre guide.': {
    fr: 'Votre position a été partagée avec les services de secours et votre guide.',
    en: 'Your position has been shared with emergency services and your guide.',
    ar: 'تمت مشاركة موقعك مع خدمات الطوارئ ومرشدك.',
  },
  'Aucun compagnon': { fr: 'Aucun compagnon', en: 'No companions', ar: 'لا يوجد رفقاء' },
  "Vous n'avez pas encore de compagnons de voyage.": { fr: "Vous n'avez pas encore de compagnons de voyage.", en: "You don't have any travel companions yet.", ar: "ليس لديك أي رفقاء سفر بعد." },
  "Connectez-vous avec d'autres pèlerins pour voyager ensemble.": { fr: "Connectez-vous avec d'autres pèlerins pour voyager ensemble.", en: "Connect with fellow pilgrims to travel together.", ar: "تواصل مع زملائك المعتمرين للسفر معاً." },
  'Trouver des compagnons': { fr: 'Trouver des compagnons', en: 'Find companions', ar: 'البحث عن رفقاء' },
  'Guides Spirituels': { fr: 'Guides Spirituels', en: 'Spiritual Guides', ar: 'مرشدون روحانيون' },
  'Des experts passionnés pour vous accompagner dans votre voyage spirituel.': { fr: 'Des experts passionnés pour vous accompagner dans votre voyage spirituel.', en: 'Passionate experts to accompany you on your spiritual journey.', ar: 'خبراء شغوفون لمرافقتك في رحلتك الروحية.' },
  'Laissez-vous accompagner par nos guides experts pour une expérience spirituelle unique et mémorable.': { fr: 'Laissez-vous accompagner par nos guides experts pour une expérience spirituelle unique et mémorable.', en: 'Let our expert guides accompany you for a unique and memorable spiritual experience.', ar: 'دع مرشدينا الخبراء يرافقونك لتجربة روحية فريدة لا تنسى.' },
  ' avis': { fr: ' avis', en: ' reviews', ar: ' تقييماً' },
  " ans d'expérience": { fr: " ans d'expérience", en: " years of experience", ar: " سنوات من الخبرة" },
  'DT / jour': { fr: 'DT / jour', en: 'TND / day', ar: 'دت / يوم' },
  'Aucun guide trouvé': { fr: 'Aucun guide trouvé', en: 'No guides found', ar: 'لم يتم العثور على مرشدين' },
  "Essayez d'ajuster vos filtres de recherche": { fr: "Essayez d'ajuster vos filtres de recherche", en: "Try adjusting your search filters", ar: "حاول تعديل فلاتر البحث" },
  'Guides Privés': { fr: 'Guides Privés', en: 'Private Guides', ar: 'مرشدون خصوصيون' },
  'Réserver un Guide': { fr: 'Réserver un Guide', en: 'Book a Guide', ar: 'حجز مرشد' },
  'Choisir une date': { fr: 'Choisir une date', en: 'Choose a date', ar: 'اختر التاريخ' },
  'Nombre de personnes': { fr: 'Nombre de personnes', en: 'Number of people', ar: 'عدد الأشخاص' },
  'Envoyer la demande': { fr: 'Envoyer la demande', en: 'Send request', ar: 'إرسال الطلب' },
  "Le guide recevra votre demande et pourra l'accepter ou la refuser.": { fr: "Le guide recevra votre demande et pourra l'accepter ou la refuser.", en: "The guide will receive your request and can accept or refuse it.", ar: "سيتلقى المرشد طلبك وسيكون بإمانه قبوله أو رفضه." },
  '/ nuit': { fr: '/ nuit', en: '/ night', ar: '/ ليلة' },
  'Hôtels Umrah': { fr: 'Hôtels Umrah', en: 'Umrah Hotels', ar: 'فنادق العمرة' },
  'Vols Omra': { fr: 'Vols Omra', en: 'Umrah Flights', ar: 'رحلات العمرة' },
  'DT': { fr: 'DT', en: 'TND', ar: 'د.ت' },
  'Plus aucun vol ne correspond à votre recherche.': { fr: 'Plus aucun vol ne correspond à votre recherche.', en: 'No more flights match your search.', ar: 'لم يعد هناك أي رحلة تطابق بحثك.' },
  'Afficher la carte': { fr: 'Afficher la carte', en: 'Show map', ar: 'عرض الخريطة' },
  'Détails des vols': { fr: 'Détails des vols', en: 'Flight details', ar: 'تفاصيل الرحلات' },
  'Rechercher...': { fr: 'Rechercher...', en: 'Search...', ar: 'بحث...' },
  'Synchronisation GDS (Prix réels)...': { fr: 'Synchronisation GDS (Prix réels)...', en: 'GDS Sync (Real-time prices)...', ar: 'مزامنة GDS (الأسعار الحقيقية)...' },
  'Net': { fr: 'Net', en: 'Net', ar: 'صافي' },
  'Meilleur prix GDS': { fr: 'Meilleur prix GDS', en: 'Best GDS price', ar: 'أفضل سعر GDS' },
  'Aucun vol trouvé': { fr: 'Aucun vol trouvé', en: 'No flights found', ar: 'لم يتم العثور على رحلات' },
  'Vérifiez les tarifs sur Turkish Airlines Direct.': { fr: 'Vérifiez les tarifs sur Turkish Airlines Direct.', en: 'Check rates on Turkish Airlines Direct.', ar: 'تحقق من الأسعار على الخطوط التركية مباشرة.' },
  'Connecté': { fr: 'Connecté', en: 'Connected', ar: 'متصل' },
  'Suivi Réservation': { fr: 'Suivi Réservation', en: 'Booking Follow-up', ar: 'متابعة الحجز' },
  'Planning Umrah': { fr: 'Planning Umrah', en: 'Umrah Planning', ar: 'تخطيط العمرة' },
  'Général': { fr: 'Général', en: 'General', ar: 'عام' },
  'Mode Sombre': { fr: 'Mode Sombre', en: 'Dark Mode', ar: 'الوضع الليلي' },
  'Pèlerin': { fr: 'Pèlerin', en: 'Pilgrim', ar: 'معتمر' },
  'Escale': { fr: 'Escale', en: 'Stopover', ar: 'ترانزيت' },
  'Détails du vol': { fr: 'Détails du vol', en: 'Flight Details', ar: 'تفاصيل الرحلة' },
  'Prix Total (GDS)': { fr: 'Prix Total (GDS)', en: 'Total Price (GDS)', ar: 'السعر الإجمالي (GDS)' },
  '(Converti)': { fr: '(Converti)', en: '(Converted)', ar: '(محول)' },
  'Itinéraire': { fr: 'Itinéraire', en: 'Route', ar: 'المسار' },
  'Informations du vol': { fr: 'Informations du vol', en: 'Flight Information', ar: 'معلومات الرحلة' },
  'Appareil': { fr: 'Appareil', en: 'Aircraft', ar: 'الطائرة' },
  'Classe': { fr: 'Classe', en: 'Class', ar: 'الدرجة' },
  'Bagages': { fr: 'Bagages', en: 'Baggage', ar: 'الأمتعة' },
  'Services inclus': { fr: 'Services inclus', en: 'Included Services', ar: 'الخدمات المشمولة' },
  'Repas à bord': { fr: 'Repas à bord', en: 'Onboard Meal', ar: 'وجبات على متن الطائرة' },
  'Divertissement en vol': { fr: 'Divertissement en vol', en: 'In-flight Entertainment', ar: 'ترفيه على متن الطائرة' },
  'Wi-Fi disponible': { fr: 'Wi-Fi disponible', en: 'Wi-Fi Available', ar: 'واي فاي متوفر' },
  'Sélection de siège gratuite': { fr: 'Sélection de siège gratuite', en: 'Free Seat Selection', ar: 'اختيار المقعد مجاناً' },
  'Information importante': { fr: 'Information importante', en: 'Important Information', ar: 'معلومة هامة' },
  "Veuillez arriver à l'aéroport au moins 3 heures avant le départ pour les vols internationaux.": { 
    fr: "Veuillez arriver à l'aéroport au moins 3 heures avant le départ pour les vols internationaux.", 
    en: "Please arrive at the airport at least 3 hours before departure for international flights.", 
    ar: "يرجى الوصول إلى المطار قبل 3 ساعات على الأقل من موعد المغادرة للرحلات الدولية." 
  },
  'Réserver sur': { fr: 'Réserver sur', en: 'Book on', ar: 'احجز على' },
  'Économique': { fr: 'Économique', en: 'Economy', ar: 'اقتصادية' },
  'Vol': { fr: 'Vol', en: 'Flight', ar: 'رحلة' },
  'Équipements du séjour': { fr: 'Équipements du séjour', en: 'Accomodation Facilities', ar: 'مرافق الإقامة' },
  'Bien': { fr: 'Bien', en: 'Good', ar: 'جيد' },
  'commentaires': { fr: 'commentaires', en: 'reviews', ar: 'تعليقات' },
  'Itinéraire vers la Kaaba': { fr: 'Itinéraire vers la Kaaba', en: 'Route to the Kaaba', ar: 'الطريق إلى الكعبة' },
  'Voir sur la carte': { fr: 'Voir sur la carte', en: 'See on Map', ar: 'عرض على الخريطة' },
  'Questions fréquentes': { fr: 'Questions fréquentes', en: 'FAQ', ar: 'الأسئلة الشائعة' },
  'Servent-ils le petit-déjeuner?': { fr: 'Servent-ils le petit-déjeuner?', en: 'Do they serve breakfast?', ar: 'هل يتم تقديم الإفطار؟' },
  'Oui, disponible sur demande.': { fr: 'Oui, disponible sur demande.', en: 'Yes, available on request.', ar: 'نعم، متوفر عند الطلب.' },
  "Politiques de l'établissement": { fr: "Politiques de l'établissement", en: 'Property Policies', ar: 'سياسات المنشأة' },
  'Enfants : Les lits d\'appoint sont disponibles selon l\'âge.': { fr: 'Enfants : Les lits d\'appoint sont disponibles selon l\'âge.', en: 'Children: Extra beds available based on age.', ar: 'الأطفال: تتوفر أسرة إضافية حسب العمر.' },
  'Check-in flexible selon disponibilité.': { fr: 'Check-in flexible selon disponibilité.', en: 'Flexible check-in based on availability.', ar: 'تسجيل وصول مرن حسب التوفر.' },
  'Politiques': { fr: 'Politiques', en: 'Policies', ar: 'السياسات' },
  'Check-in': { fr: 'Check-in', en: 'Check-in', ar: 'تسجيل الوصول' },
  'Check-out': { fr: 'Check-out', en: 'Check-out', ar: 'تسجيل المغادرة' },
  'A partir de 14:00 jusqu\'à 00:00': { fr: 'A partir de 14:00 jusqu\'à 00:00', en: 'From 14:00 to 00:00', ar: 'من الساعة 14:00 حتى 00:00' },
  'De 00:00 jusqu\'à 12:00': { fr: 'De 00:00 jusqu\'à 12:00', en: 'From 00:00 to 12:00', ar: 'من الساعة 00:00 حتى 12:00' },
  'GRATUIT': { fr: 'GRATUIT', en: 'FREE', ar: 'مجاناً' },
  'Le WiFi est disponible partout et est gratuit.': { fr: 'Le WiFi est disponible partout et est gratuit.', en: 'WiFi is available throughout and is free.', ar: 'تتوفر خدمة واي فاي في كل مكان وهي مجانية.' },
  'Parking privé gratuit possible sur place (réservation requise).': { fr: 'Parking privé gratuit possible sur place (réservation requise).', en: 'Free private parking is possible on site (reservation required).', ar: 'يتوفر موقف خاص ومجاني للسيارات في الموقع (يتطلب الحجز).' },
  'Pas de frais de carte de crédit': { fr: 'Pas de frais de carte de crédit', en: 'No credit card fees', ar: 'لا توجد رسوم على بطاقة الائتمان' },
  'Enfants et lits supplémentaires': { fr: 'Enfants et lits supplémentaires', en: 'Children and extra beds', ar: 'الأطفال والأسرة الإضافية' },
  'Les enfants de tous âges sont les bienvenus.': { fr: 'Les enfants de tous âges sont les bienvenus.', en: 'Children of all ages are welcome.', ar: 'يرحب بالأطفال من جميع الأعمار.' },
  'Les enfants de 13 ans et plus seront facturés comme des adultes dans cet établissement.': { fr: 'Les enfants de 13 ans et plus seront facturés comme des adultes dans cet établissement.', en: 'Children aged 13 and older will be charged as adults at this property.', ar: 'سيتم احتساب الأطفال الذين تبلغ أعمارهم 13 عاماً فما فوق كبالغين في هذه المنشأة.' },
  'Pour voir les tarifs et informations d\'occupation corrects, veuillez ajouter le nombre d\'enfants de votre groupe et leurs ages a votre recherche.': { fr: 'Pour voir les tarifs et informations d\'occupation corrects, veuillez ajouter le nombre d\'enfants de votre groupe et leurs ages a votre recherche.', en: 'To see correct prices and occupancy information, please add the number of children in your group and their ages to your search.', ar: 'لمشاهدة الأسعار ومعلومات الإشغال الصحيحة، يرجى إضافة عدد الأطفال في مجموعتك وأعمارهم إلى بحثك.' },
  'Voir toutes les politiques': { fr: 'Voir toutes les politiques', en: 'See all policies', ar: 'عرض جميع السياسات' },
  'À partir de': { fr: 'À partir de', en: 'Starting from', ar: 'ابتداءً من' },
  'Confirmer le mot de passe': { fr: 'Confirmer le mot de passe', en: 'Confirm Password', ar: 'تأكيد كلمة المرور' },
  'ECONOMY': { fr: 'Économique', en: 'Economy', ar: 'اقتصادية' },
  'BUSINESS': { fr: 'Affaires', en: 'Business', ar: 'الأعمال' },
  'FIRST': { fr: 'Première', en: 'First Class', ar: 'الدرجة الأولى' },

  // Onboarding
  'Bienvenue chez Sabeel': { fr: 'Bienvenue chez Sabeel', en: 'Welcome to Sabeel', ar: 'مرحباً بك في سبيل' },
  'Sabeel est votre compagnon idéal pour un pèlerinage serein, sécurisé et spirituellement enrichi, connectant pèlerins, guides et agences.': { 
    fr: 'Sabeel est votre compagnon idéal pour un pèlerinage serein, sécurisé et spirituellement enrichi, connectant pèlerins, guides et agences.', 
    en: 'Sabeel is your ideal companion for a serene, secure, and spiritually enriched pilgrimage, connecting pilgrims, guides, and agencies.', 
    ar: 'سبيل هو رفيقك المثالي لرحلة عمرة هادئة، آمنة، ومثرية روحياً، يربط بين المعتمرين والمرشدين والوكالات.' 
  },
  'Offres Agences Umrah': { fr: 'Offres Agences Umrah', en: 'Umrah Agency Offers', ar: 'عروض وكالات العمرة' },
  "Explorez une large gamme d'offres complètes de voyages Umrah proposées par les meilleures agences certifiées.": { 
    fr: "Explorez une large gamme d'offres complètes de voyages Umrah proposées par les meilleures agences certifiées.", 
    en: 'Explore a wide range of comprehensive Umrah travel offers from the best certified agencies.', 
    ar: 'استكشف مجموعة واسعة من عروض رحلات العمرة الشاملة المقدمة من أفضل الوكالات المعتمدة.' 
  },
  'Umrah Solo': { fr: 'Umrah Solo', en: 'Solo Umrah', ar: 'عمرة سولو' },
  'Planifiez votre Umrah en toute liberté : comparez et réservez vos hôtels, vols et guides privés selon vos préférences.': { 
    fr: 'Planifiez votre Umrah en toute liberté : comparez et réservez vos hôtels, vols et guides privés selon vos préférences.', 
    en: 'Plan your Umrah with complete freedom: compare and book your hotels, flights, and private guides according to your preferences.', 
    ar: 'خطط لعمرتك بكل حرية: قارن واحجز فنادقك ورحلاتك الجوية ومرشديك الخاصين وفقاً لتفضيلاتك.' 
  },
  'Accompagnement & Suivi Familial': { fr: 'Accompagnement & Suivi Familial', en: 'Companionship & Family Tracking', ar: 'المرافقة والمتابعة العائلية' },
  "Gardez l'esprit tranquille en suivant la position en temps réel de vos parents durant leur séjour à Makkah.": { 
    fr: "Gardez l'esprit tranquille en suivant la position en temps réel de vos parents durant leur séjour à Makkah.", 
    en: 'Keep your peace of mind by following the real-time position of your parents during their stay in Makkah.', 
    ar: 'كن مطمئن البال من خلال متابعة موقع والديك في الوقت الفعلي أثناء إقامتهم في مكة المكرمة.' 
  },
  'Sécurité SOS': { fr: 'Sécurité SOS', en: 'SOS Safety', ar: 'أمان SOS' },
  "Un bouton d'urgence disponible 24h/24 pour alerter votre guide et les services d'urgence en un clic.": { 
    fr: "Un bouton d'urgence disponible 24h/24 pour alerter votre guide et les services d'urgence en un clic.", 
    en: 'An emergency button available 24/7 to alert your guide and emergency services in one click.', 
    ar: 'زر طوارئ متاح على مدار الساعة لتنبيه مرشدك وخدمات الطوارئ بنقرة واحدة.' 
  },
  'Se connecter': { fr: 'Se connecter', en: 'Login', ar: 'تسجيل الدخول' },
  'Créer un compte': { fr: 'Créer un compte', en: 'Create Account', ar: 'إنشاء حساب' },

  // Auth Screens
  'Connexion': { fr: 'Connexion', en: 'Login', ar: 'تسجيل الدخول' },
  'Content de vous revoir ! Connectez-vous à votre compte Sabeel.': { 
    fr: 'Content de vous revoir ! Connectez-vous à votre compte Sabeel.', 
    en: 'Glad to see you again! Log in to your Sabeel account.', 
    ar: 'سعداء برؤيتك مرة أخرى! سجل الدخول إلى حساب سبيل الخاص بك.' 
  },
  'Email': { fr: 'Email', en: 'Email', ar: 'البريد الإلكتروني' },
  'Mot de passe': { fr: 'Mot de passe', en: 'Password', ar: 'كلمة المرور' },
  'Se souvenir de moi': { fr: 'Se souvenir de moi', en: 'Remember me', ar: 'تذكرني' },
  'Mot de passe oublié ?': { fr: 'Mot de passe oublié ?', en: 'Forgot password?', ar: 'نسيت كلمة المرور؟' },
  'Pas encore de compte ?': { fr: 'Pas encore de compte ?', en: "Don't have an account yet?", ar: 'ليس لديك حساب بعد؟' },
  "S'inscrire": { fr: "S'inscrire", en: 'Sign Up', ar: 'إنشاء حساب' },
  'Entrez votre email': { fr: 'Entrez votre email', en: 'Enter your email', ar: 'أدخل بريدك الإلكتروني' },
  'Entrez votre mot de passe': { fr: 'Entrez votre mot de passe', en: 'Enter your password', ar: 'أدخل كلمة المرور' },
  'Email ou mot de passe incorrect': { fr: 'Email ou mot de passe incorrect', en: 'Incorrect email or password', ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
  'Succès': { fr: 'Succès', en: 'Success', ar: 'تم بنجاح' },
  'Bienvenue !': { fr: 'Bienvenue !', en: 'Welcome!', ar: 'مرحباً بك!' },

  // Register
  'Création de compte': { fr: 'Création de compte', en: 'Account Creation', ar: 'إنشاء حساب' },
  'Rejoignez la communauté Sabeel pour une expérience de pèlerinage unique.': { 
    fr: 'Rejoignez la communauté Sabeel pour une expérience de pèlerinage unique.', 
    en: 'Join the Sabeel community for a unique pilgrimage experience.', 
    ar: 'انضم إلى مجتمع سبيل لتجربة عمرة فريدة.' 
  },
  'Nom complet': { fr: 'Nom complet', en: 'Full Name', ar: 'الاسم الكامل' },
  "J'accepte les conditions d'utilisation": { fr: "J'accepte les conditions d'utilisation", en: 'I accept the terms of use', ar: 'أنا أوافق على شروط الاستخدام' },
  'Déjà un compte ?': { fr: 'Déjà un compte ?', en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },

  // Profile / Settings
  'Choisir la langue': { fr: 'Choisir la langue', en: 'Choose Language', ar: 'اختر اللغة' },
  "L'application va redémarrer pour appliquer les changements de direction.": { 
    fr: "L'application va redémarrer pour appliquer les changements de direction.", 
    en: 'The app will restart to apply the direction changes.', 
    ar: 'سيعاد تشغيل التطبيق لتطبيق تغييرات الاتجاه.' 
  },
  'Langue mise à jour.': { fr: 'Langue mise à jour.', en: 'Language updated.', ar: 'تم تحديث اللغة.' },

  // SOS
  'SOS Urgence': { fr: 'SOS Urgence', en: 'SOS Emergency', ar: 'طوارئ SOS' },
  'Aide': { fr: 'Aide', en: 'Help', ar: 'مساعدة' },
  'ALERTE SOS ENVOYÉE': { fr: 'ALERTE SOS ENVOYÉE', en: 'SOS ALERT SENT', ar: 'تم إرسال تنبيه SOS' },
  'Votre position a été partagée avec les services de secours et votre guide.': { 
    fr: 'Votre position a été partagée avec les services de secours et votre guide.', 
    en: 'Your position has been shared with emergency services and your guide.', 
    ar: 'تمت مشاركة موقعك مع خدمات الإنقاذ ومرشدك.' 
  },
  'RESTER CALME': { fr: 'RESTER CALME', en: 'STAY CALM', ar: 'ابق هادئاً' },

  // Navigation
  'Solo': { fr: 'Solo', en: 'Solo', ar: 'سولو' },
  'Agences': { fr: 'Agences', en: 'Agencies', ar: 'الوكالات' },
  'Spirituel': { fr: 'Spirituel', en: 'Spiritual', ar: 'روحاني' },

  // Filters & Search
  'Trier par': { fr: 'Trier par', en: 'Sort by', ar: 'ترتيب حسب' },
  'Prix croissant': { fr: 'Prix croissant', en: 'Price: Low to High', ar: 'السعر: من الأقل للأعلى' },
  'Prix décroissant': { fr: 'Prix décroissant', en: 'Price: High to Low', ar: 'السعر: من الأعلى للأقل' },
  'Étoiles': { fr: 'Étoiles', en: 'Stars', ar: 'النجوم' },
  'Distance Haram': { fr: 'Distance Haram', en: 'Distance to Haram', ar: 'المسافة إلى الحرم' },
  
  // Spirituelle
  'Guide Spirituel': { fr: 'Guide Spirituel', en: 'Spiritual Guide', ar: 'المرشد الروحي' },
  'Douas': { fr: 'Douas', en: 'Duas', ar: 'الأدعية' },
  'Coran': { fr: 'Coran', en: 'Quran', ar: 'القرآن' },
  'Temps de prière': { fr: 'Temps de prière', en: 'Prayer Times', ar: 'أوقات الصلاة' },
  'Qibla': { fr: 'Qibla', en: 'Qibla', ar: 'القبلة' },
  'Tasbih': { fr: 'Tasbih', en: 'Tasbih', ar: 'تسبيح' },

  // Reservation & Follow-up
  'Suivie réservation': { fr: 'Suivie réservation', en: 'Booking Tracking', ar: 'متابعة الحجز' },
  'En attente': { fr: 'En attente', en: 'Pending', ar: 'في الانتظار' },
  'Confirmé': { fr: 'Confirmé', en: 'Confirmed', ar: 'مؤكد' },
  'Annulé': { fr: 'Annulé', en: 'Cancelled', ar: 'ملغي' },

  // Notifications
  'Toutes les notifications': { fr: 'Toutes les notifications', en: 'All notifications', ar: 'جميع الإشعارات' },
  'Marquer tout comme lu': { fr: 'Marquer tout comme lu', en: 'Mark all as read', ar: 'تحديد الكل كمقروء' },
  'Aucune notification': { fr: 'Aucune notification', en: 'No notifications', ar: 'لا توجد إشعارات' },

  // Various
  'Suivant': { fr: 'Suivant', en: 'Next', ar: 'التالي' },
  'Commencer': { fr: 'Commencer', en: 'Get Started', ar: 'ابدأ الآن' },
  'Passer': { fr: 'Passer', en: 'Skip', ar: 'تخطي' },
  'Quel est votre numéro ?': { fr: 'Quel est votre numéro ?', en: 'What is your number?', ar: 'ما هو رقمك؟' },
  'Nous vous enverrons un code pour vérifier votre téléphone.': { 
    fr: 'Nous vous enverrons un code pour vérifier votre téléphone.', 
    en: 'We will send you a code to verify your phone.', 
    ar: 'سنرسل لك رمزاً للتحقق من هاتفك.' 
  },
  'Numéro de téléphone': { fr: 'Numéro de téléphone', en: 'Phone number', ar: 'رقم الهاتف' },
  "ou s'inscrire avec": { fr: "ou s'inscrire avec", en: 'or sign up with', ar: 'أو التسجيل بواسطة' },
  'Continuer avec Google': { fr: 'Continuer avec Google', en: 'Continue with Google', ar: 'المتابعة بواسطة جوجل' },
  'Et votre email ?': { fr: 'Et votre email ?', en: 'And your email?', ar: 'وبريدك الإلكتروني؟' },
  'Pour recevoir vos confirmations de réservation.': { 
    fr: 'Pour recevoir vos confirmations de réservation.', 
    en: 'To receive your booking confirmations.', 
    ar: 'لتلقي تأكيدات الحجز الخاصة بك.' 
  },
  'Adresse email': { fr: 'Adresse email', en: 'Email address', ar: 'عنوان البريد الإلكتروني' },
  'Créez un mot de passe': { fr: 'Créez un mot de passe', en: 'Create a password', ar: 'أنشئ كلمة مرور' },
  'Au moins 8 caractères.': { fr: 'Au moins 8 caractères.', en: 'At least 8 characters.', ar: '8 أحرف على الأقل.' },
  'Comment vous appelez-vous ?': { fr: 'Comment vous appelez-vous ?', en: 'What is your name?', ar: 'ما هو اسمك؟' },
  "C'est ainsi que les autres utilisateurs vous verront.": { 
    fr: "C'est ainsi que les autres utilisateurs vous verront.", 
    en: 'This is how other users will see you.', 
    ar: 'هكذا سيراك المستخدمون الآخرون.' 
  },
  'Rejoindre Sabeel': { fr: 'Rejoindre Sabeel', en: 'Join Sabeel', ar: 'الانضمام إلى سبيل' },
  'Continuer': { fr: 'Continuer', en: 'Continue', ar: 'استمرار' },
  'Bienvenue sur Sabeel !': { fr: 'Bienvenue sur Sabeel !', en: 'Welcome to Sabeel!', ar: 'مرحباً بك في سبيل!' },
  'Votre compte a été créé avec succès. Veuillez vous connecter pour commencer votre voyage.': { 
    fr: 'Votre compte a été créé avec succès. Veuillez vous connecter pour commencer votre voyage.', 
    en: 'Your account has been successfully created. Please log in to start your journey.', 
    ar: 'تم إنشاء حسابك بنجاح. يرجى تسجيل الدخول لبدء رحلتك.' 
  },
  "C'est parti": { fr: "C'est parti", en: "Let's go", ar: 'لنبدأ' },
  'Politique de confidentialité': { fr: 'Politique de confidentialité', en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  'Gestion des données utilisateur': { fr: 'Gestion des données utilisateur', en: 'User Data Management', ar: 'إدارة بيانات المستخدم' },
  'Sécurité des informations': { fr: 'Sécurité des informations', en: 'Information Security', ar: 'أمن المعلومات' },
  'Votre vie privée est notre priorité': { fr: 'Votre vie privée est notre priorité', en: 'Your privacy is our priority', ar: 'خصوصيتك هي أولويتنا' },
  "Sabeel s'engage à protéger vos données tout au long de votre voyage spirituel.": { 
    fr: "Sabeel s'engage à protéger vos données tout au long de votre voyage spirituel.", 
    en: 'Sabeel is committed to protecting your data throughout your spiritual journey.', 
    ar: 'سبيل ملتزم بحماية بياناتك طوال رحلتك الروحية.' 
  },
  'Dernière mise à jour : Mars 2024': { fr: 'Dernière mise à jour : Mars 2024', en: 'Last update: March 2024', ar: 'آخر تحديث: مارس 2024' },
  'Présentation': { fr: 'Présentation', en: 'Presentation', ar: 'عرض عام' },
  'Notre Mission': { fr: 'Notre Mission', en: 'Our Mission', ar: 'مهمتنا' },
  'Notre Vision': { fr: 'Notre Vision', en: 'Our Vision', ar: 'رؤيتنا' },
  'Fait avec ❤️ pour les pèlerins': { fr: 'Fait avec ❤️ pour les pèlerins', en: 'Made with ❤️ for pilgrims', ar: 'صنع بـ ❤️ للمعتمرين' },
  'Tous droits réservés.': { fr: 'Tous droits réservés.', en: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.' },
  'Comment pouvons-nous vous aider ?': { fr: 'Comment pouvons-nous vous aider ?', en: 'How can we help you?', ar: 'كيف يمكننا مساعدتك؟' },
  'Sélectionnez un sujet ou consultez la FAQ pour une réponse rapide.': { 
    fr: 'Sélectionnez un sujet ou consultez la FAQ pour une réponse rapide.', 
    en: 'Select a topic or consult the FAQ for a quick answer.', 
    ar: 'اختر موضوعاً أو اطلع على الأسئلة الشائعة للحصول على إجابة سريعة.' 
  },
  'Consulter la FAQ': { fr: 'Consulter la FAQ', en: 'Consult the FAQ', ar: 'الاطلاع على الأسئلة الشائعة' },
  'Questions Fréquentes': { fr: 'Questions Fréquentes', en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' },
  'Rechercher une question...': { fr: 'Rechercher une question...', en: 'Search for a question...', ar: 'ابحث عن سؤال...' },
  'Vous ne trouvez pas de réponse ?': { fr: 'Vous ne trouvez pas de réponse ?', en: "Can't find an answer?", ar: 'لم تجد إجابة؟' },
  'Posez votre question...': { fr: 'Posez votre question...', en: 'Ask your question...', ar: 'اطرح سؤالك...' },
  'Envoyez-nous un message': { fr: 'Envoyez-nous un message', en: 'Send us a message', ar: 'أرسل لنا رسالة' },
  'En quoi pouvons-nous vous aider ?': { fr: 'En quoi pouvons-nous vous aider ?', en: 'How can we help you?', ar: 'كيف يمكننا مساعدتك؟' },
  'Envoyer': { fr: 'Envoyer', en: 'Send', ar: 'إرسال' },
  'Plus tard': { fr: 'Plus tard', en: 'Later', ar: 'لاحقاً' },
  "Veuillez redémarrer l'application manuellement pour voir les changements (RTL).": { 
    fr: "Veuillez redémarrer l'application manuellement pour voir les changements (RTL).", 
    en: 'Please restart the app manually to see the changes (RTL).', 
    ar: 'يرجى إعادة تشغيل التطبيق يدوياً لرؤية التغييرات.' 
  },
  "L'application doit être redémarrée pour appliquer les changements de direction (RTL). Redémarrer maintenant ?": { 
    fr: "L'application doit être redémarrée pour appliquer les changements de direction (RTL). Redémarrer maintenant ?", 
    en: 'The app needs to be restarted to apply direction changes (RTL). Restart now?', 
    ar: 'يجب إعادة تشغيل التطبيق لتطبيق تغييرات الاتجاه. إعادة التشغيل الآن؟' 
  },
  'Info': { fr: 'Info', en: 'Info', ar: 'معلومات' },
  'Guide d\'utilisation': { fr: 'Guide d\'utilisation', en: 'User Guide', ar: 'دليل الاستخدام' },
  'Explication des fonctionnalités': { fr: 'Explication des fonctionnalités', en: 'Feature Explanation', ar: 'شرح الميزات' },
  'Contacter l\'équipe': { fr: 'Contacter l\'équipe', en: 'Contact the Team', ar: 'الاتصال بالفريق' },
  'Apprenez à utiliser toutes les fonctionnalités de Sabeel pas à pas.': { 
    fr: 'Apprenez à utiliser toutes les fonctionnalités de Sabeel pas à pas.', 
    en: 'Learn how to use all Sabeel features step by step.', 
    ar: 'تعلم كيفية استخدام جميع ميزات سبيل خطوة بخطوة.' 
  },
  'Découvrez comment Sabeel facilite votre parcours spirituel.': { 
    fr: 'Découvrez comment Sabeel facilite votre parcours spirituel.', 
    en: 'Discover how Sabeel facilitates your spiritual journey.', 
    ar: 'اكتشف كيف يسهل سبيل رحلتك الروحية.' 
  },
  'Notre équipe est disponible 24/7 pour répondre à vos questions techniques.': { 
    fr: 'Notre équipe est disponible 24/7 pour répondre à vos questions techniques.', 
    en: 'Our team is available 24/7 to answer your technical questions.', 
    ar: 'فريقنا متاح على مدار الساعة طوال أيام الأسبوع للرد على أسئلتكم التقنية.' 
  },
  'Chez Sabeel, nous accordons une importance primordiale à la protection de votre vie privée. Cette politique explique comment nous recueillons, utilisons et protégeons vos informations personnelles lors de votre pèlerinage.': {
    fr: 'Chez Sabeel, nous accordons une importance primordiale à la protection de votre vie privée. Cette politique explique comment nous recueillons, utilisons et protégeons vos informations personnelles lors de votre pèlerinage.',
    en: 'At Sabeel, we place paramount importance on protecting your privacy. This policy explains how we collect, use, and protect your personal information during your pilgrimage.',
    ar: 'في سبيل، نولي أهمية قصوى لحماية خصوصيتك. تشرح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية أثناء رحلتك.'
  },
  'Vous avez le plein contrôle sur vos données. Vous pouvez accéder, modifier ou demander la suppression de vos informations personnelles, y compris vos documents de voyage et vos données de localisation, à tout moment via les réglages de votre profil.': {
    fr: 'Vous avez le plein contrôle sur vos données. Vous pouvez accéder, modifier ou demander la suppression de vos informations personnelles, y compris vos documents de voyage et vos données de localisation, à tout moment via les réglages de votre profil.',
    en: 'You have full control over your data. You can access, modify, or request the deletion of your personal information, including travel documents and location data, at any time via your profile settings.',
    ar: 'لديك التحكم الكامل في بياناتك. يمكنك الوصول إلى معلوماتك الشخصية أو تعديلها أو طلب حذفها، بما في ce ذلك مستندات السفر وبيانات الموقع، في أي وقت من خلال إعدادات ملفك الشخصي.'
  },
  'Vos données sont cryptées et stockées sur des serveurs sécurisés. Nous utilisons des protocoles de sécurité de pointe pour garantir que vos informations sensibles (passeports, visas) ne soient jamais accessibles par des tiers non autorisés.': {
    fr: 'Vos données sont cryptées et stockées sur des serveurs sécurisés. Nous utilisons des protocoles de sécurité de pointe pour garantir que vos informations sensibles (passeports, visas) ne soient jamais accessibles par des tiers non autorisés.',
    en: 'Your data is encrypted and stored on secure servers. We use state-of-the-art security protocols to ensure that your sensitive information (passports, visas) is never accessible by unauthorized third parties.',
    ar: 'يتم تشفير بياناتك وتخزينها على خوادم آمنة. نحن نستخدم بروتوكولات أمان متطورة لضمان عدم وصول أطراف ثالثة غير مخولة إلى معلوماتك الحساسة (جوازات السفر والتأشيرات).'
  },
  'Sabeel est le compagnon ultime pour votre pèlerinage. Conçu pour simplifier votre voyage vers les Lieux Saints, notre application intègre des outils modernes pour vous guider, vous assister et vous connecter avec votre agence de voyage en toute sérénité.': {
    fr: 'Sabeel est le compagnon ultime pour votre pèlerinage. Conçu pour simplifier votre voyage vers les Lieux Saints, notre application intègre des outils modernes pour vous guider, vous assister et vous connecter avec votre agence de voyage en toute sérénité.',
    en: 'Sabeel is the ultimate companion for your pilgrimage. Designed to simplify your journey to the Holy Sites, our app integrates modern tools to guide, assist, and connect you with your travel agency in complete serenity.',
    ar: 'سبيل هو الرفيق الأمثل لرحلتك. صمم لتبسيط رحلتك إلى البقاع المقدسة، يوفر تطبيقنا أدوات حديثة لتوجيهك ومساعدتك وربطك مع وكالة سفرك بكل طمأنينة.'
  },
  'Réinventer l\'expérience du pèlerinage par l\'innovation technologique, tout en respectant le caractère spirituel sacré de l\'Umrah et du Hajj.': {
    fr: 'Réinventer l\'expérience du pèlerinage par l\'innovation technologique, tout en respectant le caractère spirituel sacré de l\'Umrah et du Hajj.',
    en: 'Reinventing the pilgrimage experience through technological innovation, while respecting the sacred spiritual nature of Umrah and Hajj.',
    ar: 'إعادة ابتكار تجربة العمرة والحج من خلال الابتكار التكنولوجي، مع احترام الطابع الروحاني المقدس.'
  },
  'Devenir la plateforme de référence mondiale pour l\'accompagnement digital des pèlerins, en offrant un service d\'une fiabilité absolue et d\'une simplicité exemplaire.': {
    fr: 'Devenir la plateforme de référence mondiale pour l\'accompagnement digital des pèlerins, en offrant un service d\'une fiabilité absolue et d\'une simplicité exemplaire.',
    en: 'Become the global reference platform for digital pilgrim accompaniment, offering absolute reliability and exemplary simplicity.',
    ar: 'أن نصبح المنصة المرجعية العالمية للمرافقة الرقمية للمعتمرين، من خلال تقديم خدمة ذات موثوقية عالية وبساطة مثالية.'
  },
  'Comment changer ma destination ?': { fr: 'Comment changer ma destination ?', en: 'How to change my destination?', ar: 'كيف أغير وجهتي؟' },
  'Vous pouvez ajuster votre itinéraire via l\'onglet Planning Umrah ou en contactant directement votre agence assignée.': {
    fr: 'Vous pouvez ajuster votre itinéraire via l\'onglet Planning Umrah ou en contactant directement votre agence assignée.',
    en: 'You can adjust your itinerary via the Umrah Planning tab or by contacting your assigned agency directly.',
    ar: 'يمكنك تعديل مسارك من خلال تبويب "تخطيط العمرة" أو بالتواصل مباشرة مع وكالتك.'
  },
  'Comment scanner un QR Code ?': { fr: 'Comment scanner un QR Code ?', en: 'How to scan a QR Code?', ar: 'كيف أمسح رمز QR؟' },
  'Utilisez l\'icône QR Code sur l\'écran d\'accueil ou dans votre profil. L\'accompagnateur scannera votre code pour confirmer votre présence.': {
    fr: 'Utilisez l\'icône QR Code sur l\'écran d\'accueil ou dans votre profil. L\'accompagnateur scannera votre code pour confirmer votre présence.',
    en: 'Use the QR Code icon on the home screen or in your profile. The companion will scan your code to confirm your presence.',
    ar: 'استخدم أيقونة رمز QR على الشاشة الرئيسية أو في ملفك الشخصي. سيقوم المرافق بمسح رمزك لتأكيد حضورك.'
  },
  'L\'application fonctionne-t-elle hors ligne ?': { fr: 'L\'application fonctionne-t-elle hors ligne ?', en: 'Does the app work offline?', ar: 'هل يعمل التطبيق بدون إنترنت؟' },
  'Oui, les informations essentielles (planning, contacts d\'urgence) sont accessibles sans connexion internet une fois téléchargées.': {
    fr: 'Oui, les informations essentielles (planning, contacts d\'urgence) sont accessibles sans connexion internet une fois téléchargées.',
    en: 'Yes, essential information (planning, emergency contacts) is accessible without an internet connection once downloaded.',
    ar: 'نعم، المعلومات الأساسية (التخطيط، اتصالات الطوارئ) متاحة بدون إنترنت بمجرد تحميلها.'
  },
  'Le bouton SOS est situé au centre de votre barre de navigation. Un clic déclenche une alerte immédiate vers votre agence et les secours locaux.': {
    fr: 'Le bouton SOS est situé au centre de votre barre de navigation. Un clic déclenche une alerte immédiate vers votre agence et les secours locaux.',
    en: 'The SOS button is located in the center of your navigation bar. One click triggers an immediate alert to your agency and local emergency services.',
    ar: 'زر SOS موجود في وسط شريط التنقل. نقرة واحدة تطلق تنبيهاً فورياً لوكالتك وخدمات الطوارئ المحلية.'
  },
  'Vol Direct': { fr: 'Vol Direct', en: 'Direct Flight', ar: 'طيران مباشر' },
  'Hôtel 5* (Mecca)': { fr: 'Hôtel 5* (Mecque)', en: '5* Hotel (Makkah)', ar: 'فندق 5 نجوم (مكة)' },
  'Hôtel 4* (Medina)': { fr: 'Hôtel 4* (Médine)', en: '4* Hotel (Madinah)', ar: 'فندق 4 نجوم (المدينة)' },
  'Visa Inclus': { fr: 'Visa Inclus', en: 'Visa Included', ar: 'تأشيرة مشمولة' },
  'Transferts VIP': { fr: 'Transferts VIP', en: 'VIP Transfers', ar: 'انتقالات VIP' },
  'Assistant avec le groupe': { fr: 'Assistant avec le groupe', en: 'Group Assistant', ar: 'مرافق مع المجموعة' },
  'Vivez une expérience spirituelle unique avec notre pack Umrah Confort. Nous nous occupons de tous les détails logistiques pour que vous puissiez vous concentrer sur votre culte. Hôtels proches du Haram et accompagnement religieux par des guides expérimentés.': {
    fr: 'Vivez une expérience spirituelle unique avec notre pack Umrah Confort. Nous nous occupons de tous les détails logistiques pour que vous puissiez vous concentrer sur votre culte. Hôtels proches du Haram et accompagnement religieux par des guides expérimentés.',
    en: 'Live a unique spiritual experience with our Umrah Comfort pack. We take care of all logistical details so you can focus on your worship. Hotels near the Haram and religious accompaniment by experienced guides.',
    ar: 'عش تجربة روحانية فريدة مع باقة "عمرة كونفورت". نحن نهتم بجميع التفاصيل اللوجستية حتى تتمكن من التركيز على عبادتك. فنادق قريبة من الحرم ومرافقة دينية من قبل مرشدين ذوي خبرة.'
  },
  'Jour 1': { fr: 'Jour 1', en: 'Day 1', ar: 'اليوم 1' },
  'Arrivée à Médine': { fr: 'Arrivée à Médine', en: 'Arrival in Madinah', ar: 'الوصول إلى المدينة المنورة' },
  'Accueil aéroport et transfert hôtel.': { fr: 'Accueil aéroport et transfert hôtel.', en: 'Airport welcome and hotel transfer.', ar: 'الاستقبال في المطار والانتقال إلى الفندق.' },
  'Jour 2-5': { fr: 'Jour 2-5', en: 'Day 2-5', ar: 'الأيام 2-5' },
  'Séjour à Médine': { fr: 'Séjour à Médine', en: 'Stay in Madinah', ar: 'الإقامة في المدينة المنورة' },
  'Prières au Masjid Nabawi et Ziyarat.': { fr: 'Prières au Masjid Nabawi et Ziyarat.', en: 'Prayers at Masjid Nabawi and Ziyarat.', ar: 'الصلوات في المسجد النبوي والزيارات.' },
  'Jour 6': { fr: 'Jour 6', en: 'Day 6', ar: 'اليوم 6' },
  'Départ pour la Mecque': { fr: 'Départ pour la Mecque', en: 'Departure for Makkah', ar: 'المغادرة إلى مكة المكرمة' },
  'Ihram et Omra.': { fr: 'Ihram et Omra.', en: 'Ihram and Umrah.', ar: 'الإحرام والعمرة.' },
  'Jour 7-14': { fr: 'Jour 7-14', en: 'Day 7-14', ar: 'الأيام 7-14' },
  'Séjour à la Mecque': { fr: 'Séjour à la Mecque', en: 'Stay in Makkah', ar: 'الإقامة في مكة المكرمة' },
  'Prières et Tawaf.': { fr: 'Prières et Tawaf.', en: 'Prayers and Tawaf.', ar: 'الصلوات والطواف.' },
  'Centre Urbain Nord, Tunis': { fr: 'Centre Urbain Nord, Tunis', en: 'Centre Urbain Nord, Tunis', ar: 'المركز العمراني الشمالي، تونس' },
  'Découvrez ce pack Umrah exceptionnel avec': { fr: 'Découvrez ce pack Umrah exceptionnel avec', en: 'Discover this exceptional Umrah pack with', ar: 'اكتشف هذه العمرة الاستثنائية مع' },
  'à': { fr: 'à', en: 'at', ar: 'بـ' },
  'Inclus dans le pack': { fr: 'Inclus dans le pack', en: 'Included in the pack', ar: 'مشمول في الباقة' },
  'Programme': { fr: 'Programme', en: 'Program', ar: 'البرنامج' },
  'Total à payer': { fr: 'Total à payer', en: 'Total to pay', ar: 'الإجمالي للدفع' },
  'Réserver maintenant': { fr: 'Réserver maintenant', en: 'Book now', ar: 'احجز الآن' },
  'Prix / Personne': { fr: 'Prix / Personne', en: 'Price / Person', ar: 'السعر / للشخص' },
  'Comment ajouter un compagnon ?': { fr: 'Comment ajouter un compagnon ?', en: 'How to add a companion?', ar: 'كيفية إضافة مرافق؟' },
  'Allez dans "Mes compagnons" et cliquez sur "Ajouter". Vous pouvez alors lier le compte de vos parents ou amis.': {
    fr: 'Allez dans "Compagnons" et cliquez sur "Ajouter". Vous pouvez alors lier le compte de vos parents ou amis.',
    en: 'Go to "Companions" and click "Add". You can then link your parents\' or friends\' account.',
    ar: 'انتقل إلى "المرافقون" وانقر فوق "إضافة". يمكنك بعد ذلك ربط حساب والديك أو أصدقائك.'
  },
  "Qu'est-ce que le portefeuille Sabeel ?": { fr: "Qu'est-ce que le portefeuille Sabeel ?", en: 'What is the Sabeel Wallet?', ar: 'ما هي محفظة سبيل؟' },
  "C'est votre espace sécurisé pour stocker vos documents de voyage (Passeport, Visa, Assurance) et accéder à vos réservations.": {
    fr: "C'est votre espace sécurisé pour stocker vos documents de voyage (Passeport, Visa, Assurance) et accéder à vos réservations.",
    en: 'It is your secure space to store your travel documents (Passport, Visa, Insurance) and access your bookings.',
    ar: 'إنه مساحتك الآمنة لتخزين مستندات سفرك (جواز السفر، التأشيرة، التأمين) والوصول إلى حجوزاتك.'
  },
  'Aucun résultat trouvé.': { fr: 'Aucun résultat trouvé.', en: 'No results found.', ar: 'لم يتم العثور على نتائج.' },
  "Besoin de plus d'aide ?": { fr: "Besoin de plus d'aide ?", en: 'Need more help?', ar: 'هل تحتاج إلى مزيد من المساعدة؟' },
  'Contacter le Support': { fr: 'Contacter le Support', en: 'Contact Support', ar: 'الاتصال بالدعم' },
  'Assalamu alaikum! Je suis Sabeel Assistant. Comment puis-je vous aider ?': {
    fr: 'Assalamu alaikum! Je suis Sabeel Assistant. Comment puis-je vous aider ?',
    en: 'Assalamu alaikum! I am Sabeel Assistant. How can I help you?',
    ar: 'السلام عليكم! أنا مساعد سبيل. كيف يمكنني مساعدتك؟'
  },
  'En ligne': { fr: 'En ligne', en: 'Online', ar: 'متصل' },
  'Historique': { fr: 'Historique', en: 'History', ar: 'السجل' },
  'Nouveau Chat': { fr: 'Nouveau Chat', en: 'New Chat', ar: 'محادثة جديدة' },
  'Aucun historique de discussion': { fr: 'Aucun historique de discussion', en: 'No chat history', ar: 'لا يوجد سجل محادثات' },
  'Je traite votre demande...': { fr: 'Je traite votre demande...', en: 'I am processing your request...', ar: 'جاري معالجة طلبك...' },
  'Services Umrah': { fr: 'Services Umrah', en: 'Umrah Services', ar: 'خدمات العمرة' },
  'Votre voyage sacré': { fr: 'Votre voyage sacré', en: 'Your Sacred Journey', ar: 'رحلتك المقدسة' },
  'Choisissez la formule qui vous convient le mieux pour votre pèlerinage.': { 
    fr: 'Choisissez la formule qui vous convient le mieux pour votre pèlerinage.', 
    en: 'Choose the package that suits you best for your pilgrimage.', 
    ar: 'اختر الباقة التي تناسبك بشكل أفضل لرحلتك.' 
  },
  'Formule avec Agences': { fr: 'Formule avec Agences', en: 'Agency Package', ar: 'باقة الوكالات' },
  'Tout-en-un': { fr: 'Tout-en-un', en: 'All-in-one', ar: 'الكل في واحد' },
  'Packs Complets': { fr: 'Packs Complets', en: 'Complete Packs', ar: 'باقات كاملة' },
  'Vivez une expérience sereine avec nos agences partenaires : Vols, Hôtels, Visas et Guide inclus.': { 
    fr: 'Vivez une expérience sereine avec nos agences partenaires : Vols, Hôtels, Visas et Guide inclus.', 
    en: 'Experience serenity with our partner agencies: Flights, Hotels, Visas, and Guide included.', 
    ar: 'عش تجربة هادئة مع وكالاتنا الشريكة: تشمل الرحلات الجوية والفنادق والتأشيرات والمرشد.' 
  },
  'Explorer les offres': { fr: 'Explorer les offres', en: 'Explore Offers', ar: 'استكشف العروض' },
  'Umrah en Solo': { fr: 'Umrah en Solo', en: 'Solo Umrah', ar: 'عمرة سولو' },
  'Composez vous-même votre voyage': { fr: 'Composez vous-même votre voyage', en: 'Create your own journey', ar: 'صمم رحلتك بنفسك' },
  'Dormir à Makkah/Médine': { fr: 'Dormir à Makkah/Médine', en: 'Stay in Makkah/Medina', ar: 'الإقامة في مكة/المدينة' },
  'Trouver un billet': { fr: 'Trouver un billet', en: 'Find a ticket', ar: 'البحث عن تذكرة' },
  'Soutien spirituel': { fr: 'Soutien spirituel', en: 'Spiritual support', ar: 'الدعم الروحي' },
  'Navettes & Taxis': { fr: 'Navettes & Taxis', en: 'Shuttles & Taxis', ar: 'الحافلات وسيارات الأجرة' },
  'Aide au choix': { fr: 'Aide au choix', en: 'Help choosing', ar: 'مساعدة في الاختيار' },
  'Notre assistant IA peut vous aider à décider.': { 
    fr: 'Notre assistant IA peut vous aider à décider.', 
    en: 'Our AI assistant can help you decide.', 
    ar: 'مساعدنا الذكي يمكنه مساعدتك في القرار.' 
  },
  'Le partage de position est actuellement activé. Votre agence peut vous localiser en cas de besoin.': {
    fr: 'Le partage de position est actuellement activé. Votre agence peut vous localiser en cas de besoin.',
    en: 'Location sharing is currently enabled. Your agency can locate you if needed.',
    ar: 'مشاركة الموقع مفعلة حالياً. يمكن لوكالتك تحديد موقعك عند الحاجة.'
  },
  'Le partage de position est actuellement désactivé. Activez-le pour permettre à votre agence de vous assister au mieux.': {
    fr: 'Le partage de position est actuellement désactivé. Activez-le pour permettre à votre agence de vous assister au mieux.',
    en: 'Location sharing is currently disabled. Enable it to allow your agency to better assist you.',
    ar: 'مشاركة الموقع معطلة حالياً. قم بتفعيلها لتتمكن وكالتك من مساعدتك بشكل أفضل.'
  },
  'Désactiver le partage': { fr: 'Désactiver le partage', en: 'Disable sharing', ar: 'تعطيل المشاركة' },
  'Activer le partage': { fr: 'Activer le partage', en: 'Enable sharing', ar: 'تفعيل المشاركة' },
};
