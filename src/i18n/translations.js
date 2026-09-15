// Maps Citizen sidebar/mobile-nav item ids (src/data/nav.js) to translation
// keys, so the nav labels translate along with the rest of the Citizen
// Portal. Only consulted for role === 'citizen' — every other role keeps
// its plain English nav.label untouched.
export const NAV_ID_TO_KEY = {
  overview: 'overview',
  sites: 'safeSites',
  routes: 'routes',
  alerts: 'alerts',
  'report-issue': 'reportIssue',
  'emergency-sos': 'emergencySOS',
  settings: 'settings',
}

// Citizen Portal translation dictionary. Covers the main Citizen labels only
// (per the brief: "translate the main Citizen Portal labels first" rather
// than machine-translating the whole app). English is always the fallback —
// see useLanguage()'s t() in LanguageContext.jsx.
export const translations = {
  en: {
    overview: 'Overview',
    safeSites: 'Safe Sites',
    routes: 'Routes',
    alerts: 'Alerts',
    reportIssue: 'Report an Issue',
    emergencySOS: 'Emergency / SOS',
    settings: 'Settings',

    recommendedAction: 'Recommended action',
    recommendedRoute: 'Recommended route',
    recommendedSafeSite: 'Recommended safe site',
    yourArea: 'Your area',
    currentRisk: 'Current risk level',

    riskLow: 'Low',
    riskModerate: 'Moderate',
    riskHigh: 'High',
    riskCritical: 'Critical',
    riskScore: 'Risk score',

    noActiveAlerts: 'No active alerts in your area.',
    liveDataUnavailable: 'Live safety data is currently unavailable.',
    informationUnavailable: 'Information unavailable',

    getRoute: 'Get route',
    viewDetails: 'View details',
    reportIssueAction: 'Report issue',
    emergencyContacts: 'Emergency contacts',
    demoContact: 'Demo contact',

    spaceAvailable: 'Space available',
    limitedSpace: 'Limited space',
    almostFull: 'Almost full',
    shelterFull: 'Full',
    availabilityUnknown: 'Availability unknown',

    routeRecommended: 'Recommended',
    routeSafe: 'Safe',
    routeUseCaution: 'Use caution',
    routeBlocked: 'Blocked',

    otherRoutes: 'Other routes',
    accessibilityInfo: 'Accessibility',
    accessibilityUnavailable: 'Accessibility information unavailable',
    myReports: 'My reports',
    submitReport: 'Submit report',
    iNeedHelp: 'I need emergency help',
    startRoute: 'Start route',
    viewEmergencyInstructions: 'View emergency instructions',
  },
  ta: {
    overview: 'கண்ணோட்டம்',
    safeSites: 'பாதுகாப்பான இடங்கள்',
    routes: 'பாதைகள்',
    alerts: 'எச்சரிக்கைகள்',
    reportIssue: 'சிக்கலைப் புகாரளிக்கவும்',
    emergencySOS: 'அவசரநிலை / SOS',
    settings: 'அமைப்புகள்',

    recommendedAction: 'பரிந்துரைக்கப்பட்ட நடவடிக்கை',
    recommendedRoute: 'பரிந்துரைக்கப்பட்ட பாதை',
    recommendedSafeSite: 'பரிந்துரைக்கப்பட்ட பாதுகாப்பான இடம்',
    yourArea: 'உங்கள் பகுதி',
    currentRisk: 'தற்போதைய அபாய நிலை',

    riskLow: 'குறைவு',
    riskModerate: 'மிதமானது',
    riskHigh: 'அதிகம்',
    riskCritical: 'மிக அதிகம்',
    riskScore: 'அபாய மதிப்பெண்',

    noActiveAlerts: 'உங்கள் பகுதியில் தற்போது எச்சரிக்கைகள் இல்லை.',
    liveDataUnavailable: 'நேரடி பாதுகாப்புத் தகவல் தற்போது கிடைக்கவில்லை.',
    informationUnavailable: 'தகவல் கிடைக்கவில்லை',

    getRoute: 'பாதையைப் பெறவும்',
    viewDetails: 'விவரங்களைக் காண்க',
    reportIssueAction: 'சிக்கலைப் புகாரளிக்கவும்',
    emergencyContacts: 'அவசரகால தொடர்புகள்',
    demoContact: 'மாதிரி தொடர்பு',

    spaceAvailable: 'இடம் உள்ளது',
    limitedSpace: 'குறைவான இடம்',
    almostFull: 'கிட்டத்தட்ட நிறைந்துவிட்டது',
    shelterFull: 'முழுவதும் நிறைந்துவிட்டது',
    availabilityUnknown: 'கிடைக்கும் தன்மை தெரியவில்லை',

    routeRecommended: 'பரிந்துரைக்கப்பட்டது',
    routeSafe: 'பாதுகாப்பானது',
    routeUseCaution: 'எச்சரிக்கையுடன் செல்லவும்',
    routeBlocked: 'தடுக்கப்பட்டுள்ளது',

    otherRoutes: 'மற்ற பாதைகள்',
    accessibilityInfo: 'அணுகல் வசதிகள்',
    accessibilityUnavailable: 'அணுகல் வசதி தகவல் கிடைக்கவில்லை',
    myReports: 'எனது புகார்கள்',
    submitReport: 'புகாரைச் சமர்ப்பிக்கவும்',
    iNeedHelp: 'எனக்கு அவசர உதவி தேவை',
    startRoute: 'பாதையைத் தொடங்கவும்',
    viewEmergencyInstructions: 'அவசரகால வழிமுறைகளைக் காண்க',
  },
  hi: {
    overview: 'अवलोकन',
    safeSites: 'सुरक्षित स्थान',
    routes: 'मार्ग',
    alerts: 'चेतावनियाँ',
    reportIssue: 'समस्या की रिपोर्ट करें',
    emergencySOS: 'आपातकाल / एसओएस',
    settings: 'सेटिंग्स',

    recommendedAction: 'अनुशंसित कार्रवाई',
    recommendedRoute: 'अनुशंसित मार्ग',
    recommendedSafeSite: 'अनुशंसित सुरक्षित स्थान',
    yourArea: 'आपका क्षेत्र',
    currentRisk: 'वर्तमान जोखिम स्तर',

    riskLow: 'कम',
    riskModerate: 'मध्यम',
    riskHigh: 'उच्च',
    riskCritical: 'गंभीर',
    riskScore: 'जोखिम स्कोर',

    noActiveAlerts: 'आपके क्षेत्र में फ़िलहाल कोई सक्रिय चेतावनी नहीं है।',
    liveDataUnavailable: 'लाइव सुरक्षा डेटा फ़िलहाल उपलब्ध नहीं है।',
    informationUnavailable: 'जानकारी उपलब्ध नहीं है',

    getRoute: 'मार्ग प्राप्त करें',
    viewDetails: 'विवरण देखें',
    reportIssueAction: 'समस्या दर्ज करें',
    emergencyContacts: 'आपातकालीन संपर्क',
    demoContact: 'डेमो संपर्क',

    spaceAvailable: 'जगह उपलब्ध है',
    limitedSpace: 'सीमित जगह',
    almostFull: 'लगभग भर चुका है',
    shelterFull: 'पूरी तरह भर चुका है',
    availabilityUnknown: 'उपलब्धता अज्ञात है',

    routeRecommended: 'अनुशंसित',
    routeSafe: 'सुरक्षित',
    routeUseCaution: 'सावधानी बरतें',
    routeBlocked: 'अवरुद्ध',

    otherRoutes: 'अन्य मार्ग',
    accessibilityInfo: 'सुगम्यता',
    accessibilityUnavailable: 'सुगम्यता जानकारी उपलब्ध नहीं है',
    myReports: 'मेरी रिपोर्टें',
    submitReport: 'रिपोर्ट सबमिट करें',
    iNeedHelp: 'मुझे आपातकालीन सहायता चाहिए',
    startRoute: 'मार्ग शुरू करें',
    viewEmergencyInstructions: 'आपातकालीन निर्देश देखें',
  },
}
