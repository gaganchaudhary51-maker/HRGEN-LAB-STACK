import { useEffect, useMemo, useState } from 'react';
import OperationsHub from './OperationsHub';
import StaffAuthModal, { StaffRole } from './components/StaffAuthModal';
import PhleboLiveTrackingModal from './components/PhleboLiveTrackingModal';
import PatientPortalModal from './components/PatientPortalModal';
import PhleboCompanionWorkspace from './components/PhleboCompanionWorkspace';
import SalesFieldWorkspace from './components/SalesFieldWorkspace';
import SuperAdminPortal, { NavTabItem } from './components/SuperAdminPortal';
import TenantAdminWorkspace from './components/TenantAdminWorkspace';
import LimsBridge from './services/limsBridge';
import ThreeHeroScene from './components/ThreeHeroScene';
import Interactive3DAnatomyAtlas from './components/Interactive3DAnatomyAtlas';
import OrganTestBreakdownDrawer from './components/OrganTestBreakdownDrawer';
import DiseaseAnatomyResonanceArena from './components/DiseaseAnatomyResonanceArena';
import AligarhPickupHubsSection, { ALIGARH_HUBS, AligarhHub } from './components/AligarhPickupHubsSection';
import EkgHeartbeatWave from './components/EkgHeartbeatWave';
import PackageDetailModal, { DiagnosticPackage } from './components/PackageDetailModal';
import SmartAiReportModal from './components/SmartAiReportModal';
import SpecimenTubeGraphic from './components/SpecimenTubeGraphic';
import './operations.css';
import VitalityAssessment from './components/VitalityAssessment/VitalityAssessment';
import './components/VitalityAssessment/vitality-assessment.css';
import {
  Activity,
  ArrowRight,
  Bike,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Crown,
  Droplet,
  FileText,
  FlaskConical,
  HeartPulse,
  Info,
  MapPin,
  MessageCircle,
  Microscope,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ThermometerSnowflake,
  Truck,
  X,
  Zap,
} from 'lucide-react';

// Healthians & Redcliffe 8 Core Organ Blocks
const ORGAN_BLOCKS = [
  { id: 'heart', name: 'Heart Health', icon: '🫀', tag: 'Lipid & Cardiac', filterCat: 'Heart Health', testsCount: '18 Tests' },
  { id: 'diabetes', name: 'Diabetes Care', icon: '🩸', tag: 'HbA1c & Glucose', filterCat: 'Diabetes', testsCount: '12 Tests' },
  { id: 'liver', name: 'Liver Function', icon: '🫁', tag: 'LFT & Enzymes', filterCat: 'Profiles', testsCount: '14 Tests' },
  { id: 'kidney', name: 'Kidney / Renal', icon: '🩺', tag: 'KFT & Creatinine', filterCat: 'Kidney', testsCount: '12 Tests' },
  { id: 'thyroid', name: 'Thyroid Health', icon: '🦋', tag: 'T3, T4, TSH', filterCat: 'Profiles', testsCount: '4 Tests' },
  { id: 'bone', name: 'Bone & Joints', icon: '🦴', tag: 'Vit D3 & Calcium', filterCat: 'Joint Care', testsCount: '8 Tests' },
  { id: 'women', name: 'Women Vital', icon: '👩', tag: 'Hormones & Iron', filterCat: 'Full Body', testsCount: '22 Tests' },
  { id: 'senior', name: 'Senior Care', icon: '👨', tag: 'Full Vitality', filterCat: 'Senior Care', testsCount: '58 Tests' },
];

// Master Clinical Parameter Categories with Adult Biological Reference Intervals & Exact Analyzers
const MASTER_HEMOGRAM = {
  groupKey: 'hemogram',
  groupName: 'Complete Hemogram / CBC (24 Parameters)',
  analyzer: 'Sysmex XN-550 Automated 5-Part Differential Counter',
  vacutainer: 'Lavender (EDTA)',
  tests: [
    { name: 'Hemoglobin (Hb)', range: '13.0 - 17.0 g/dL (M) / 12.0 - 15.0 g/dL (F)', unit: 'g/dL', desc: 'Oxygen-carrying metalloprotein within erythrocytes' },
    { name: 'Total Leucocyte Count (TLC / WBC)', range: '4,000 - 11,000', unit: '/cumm', desc: 'Circulating defensive white blood cells' },
    { name: 'Platelet Count', range: '1.50 - 4.50', unit: 'Lakhs/cumm', desc: 'Thrombocytes mediating primary hemostatic plug' },
    { name: 'RBC Count', range: '4.50 - 5.50 (M) / 3.80 - 4.80 (F)', unit: 'mill/cumm', desc: 'Circulating mature red blood cells' },
    { name: 'Packed Cell Volume (PCV)', range: '40.0 - 50.0 % (M) / 36.0 - 46.0 % (F)', unit: '%', desc: 'Volume fraction of red blood cells' },
    { name: 'Mean Corpuscular Volume (MCV)', range: '80.0 - 100.0', unit: 'fL', desc: 'Average erythrocyte volume' },
    { name: 'Mean Corpuscular Hemoglobin (MCH)', range: '27.0 - 32.0', unit: 'pg', desc: 'Average mass of hemoglobin per red cell' },
    { name: 'MCHC', range: '31.5 - 34.5', unit: 'g/dL', desc: 'Average cellular hemoglobin concentration' },
    { name: 'RDW-CV', range: '11.5 - 14.5', unit: '%', desc: 'Red cell distribution width (anisocytosis index)' },
    { name: 'Neutrophils (DLC)', range: '40.0 - 70.0', unit: '%', desc: 'First-line bacterial phagocytic granulocytes' },
    { name: 'Lymphocytes (DLC)', range: '20.0 - 40.0', unit: '%', desc: 'Viral immunity and antibody-producing cells' },
    { name: 'Monocytes (DLC)', range: '2.0 - 10.0', unit: '%', desc: 'Circulating tissue macrophage precursors' },
    { name: 'Eosinophils (DLC)', range: '1.0 - 6.0', unit: '%', desc: 'Allergic response and parasitic defense' },
    { name: 'Basophils (DLC)', range: '0.0 - 2.0', unit: '%', desc: 'Histamine-secreting granulocytes' },
    { name: 'Absolute Neutrophil Count (ANC)', range: '2,000 - 7,000', unit: '/cumm', desc: 'Circulating neutrophil mass' },
    { name: 'Absolute Lymphocyte Count (ALC)', range: '1,000 - 3,000', unit: '/cumm', desc: 'Circulating lymphocyte mass' },
    { name: 'Mean Platelet Volume (MPV)', range: '7.0 - 11.0', unit: 'fL', desc: 'Platelet turnover index' }
  ]
};

const MASTER_LIVER = {
  groupKey: 'liver',
  groupName: 'Liver Function Test - LFT (12 Parameters)',
  analyzer: 'Beckman Coulter DxC 700 AU (Enzymatic UV)',
  vacutainer: 'Gold SST Gel',
  tests: [
    { name: 'SGPT / ALT', range: '< 45 U/L (M) / < 34 U/L (F)', unit: 'U/L', desc: 'Specific marker for hepatocellular inflammation' },
    { name: 'SGOT / AST', range: '< 40 U/L (M) / < 35 U/L (F)', unit: 'U/L', desc: 'Mitochondrial hepatic and cardiac enzyme' },
    { name: 'Total Bilirubin', range: '0.20 - 1.20', unit: 'mg/dL', desc: 'Heme catabolism pigment; screens for jaundice' },
    { name: 'Direct (Conjugated) Bilirubin', range: '0.00 - 0.30', unit: 'mg/dL', desc: 'Hepatic conjugated water-soluble bile' },
    { name: 'Indirect (Unconjugated) Bilirubin', range: '0.10 - 0.90', unit: 'mg/dL', desc: 'Pre-hepatic hemolysis index' },
    { name: 'Alkaline Phosphatase (ALP)', range: '44 - 147', unit: 'U/L', desc: 'Biliary tree and bone turnover enzyme' },
    { name: 'Gamma GT (GGTP)', range: '9 - 48', unit: 'U/L', desc: 'Biliary enzyme sensitive to alcohol & medications' },
    { name: 'Total Serum Protein', range: '6.40 - 8.30', unit: 'g/dL', desc: 'Overall circulating albumin and globulin' },
    { name: 'Serum Albumin', range: '3.50 - 5.20', unit: 'g/dL', desc: 'Hepatic synthetic oncotic protein' },
    { name: 'Serum Globulin', range: '2.00 - 3.50', unit: 'g/dL', desc: 'Transport and immune defense globulins' },
    { name: 'A/G Ratio', range: '1.20 - 2.20', unit: 'Ratio', desc: 'Ratio of albumin to globulin' }
  ]
};

const MASTER_KIDNEY = {
  groupKey: 'kidney',
  groupName: 'Kidney Function & Electrolytes - KFT (10 Parameters)',
  analyzer: 'Beckman Coulter DxC 700 AU (Kinetic Jaffe & Crown-Ether ISE)',
  vacutainer: 'Gold SST Gel',
  tests: [
    { name: 'Serum Creatinine', range: '0.70 - 1.30 (M) / 0.50 - 1.10 (F)', unit: 'mg/dL', desc: 'Phosphocreatine metabolite; primary filtration index' },
    { name: 'Blood Urea', range: '15.0 - 40.0', unit: 'mg/dL', desc: 'Nitrogenous waste product eliminated by kidneys' },
    { name: 'Blood Urea Nitrogen (BUN)', range: '7.0 - 20.0', unit: 'mg/dL', desc: 'Circulating urea nitrogen concentration' },
    { name: 'Serum Uric Acid', range: '3.50 - 7.20 (M) / 2.60 - 6.00 (F)', unit: 'mg/dL', desc: 'Purine nucleotide breakdown product; gout screen' },
    { name: 'Estimated GFR (eGFR)', range: '> 90.0', unit: 'mL/min/1.73m²', desc: 'Glomerular filtration rate efficiency' },
    { name: 'Serum Calcium', range: '8.80 - 10.20', unit: 'mg/dL', desc: 'Bone mineral and neuromuscular cation' },
    { name: 'Serum Phosphorus', range: '2.50 - 4.50', unit: 'mg/dL', desc: 'Phosphate buffer and mineral baseline' },
    { name: 'Serum Sodium (Na+)', range: '136.0 - 145.0', unit: 'mmol/L', desc: 'Extracellular osmolarity governing electrolyte' },
    { name: 'Serum Potassium (K+)', range: '3.50 - 5.10', unit: 'mmol/L', desc: 'Intracellular cardiac conduction cation' },
    { name: 'Serum Chloride (Cl-)', range: '98.0 - 107.0', unit: 'mmol/L', desc: 'Principal extracellular acid-base anion' }
  ]
};

const MASTER_LIPID = {
  groupKey: 'lipid',
  groupName: 'Lipid Profile · Cardiovascular Risk (9 Parameters)',
  analyzer: 'Beckman Coulter DxC 700 AU (Direct Enzymatic CHOD-PAP)',
  vacutainer: 'Gold SST Gel',
  tests: [
    { name: 'Total Cholesterol', range: '< 200.0', unit: 'mg/dL', desc: 'Circulating sterol lipid concentration' },
    { name: 'HDL Cholesterol (Good)', range: '> 40.0 (M) / > 50.0 (F)', unit: 'mg/dL', desc: 'Cardioprotective reverse transport lipoprotein' },
    { name: 'LDL Cholesterol (Bad)', range: '< 100.0', unit: 'mg/dL', desc: 'Atherogenic coronary arterial plaque marker' },
    { name: 'Triglycerides', range: '< 150.0', unit: 'mg/dL', desc: 'Dietary blood lipid energy storage' },
    { name: 'VLDL Cholesterol', range: '< 30.0', unit: 'mg/dL', desc: 'Very low density triglyceride carrier' },
    { name: 'Non-HDL Cholesterol', range: '< 130.0', unit: 'mg/dL', desc: 'Total atherogenic particle concentration' },
    { name: 'TC / HDL Ratio', range: '< 4.50', unit: 'Ratio', desc: 'Overall ischemic event risk ratio' },
    { name: 'LDL / HDL Ratio', range: '< 3.00', unit: 'Ratio', desc: 'Atherogenic plaque deposition index' }
  ]
};

const MASTER_DIABETES = {
  groupKey: 'diabetes',
  groupName: 'Diabetes & Glycemic Homeostasis (4 Parameters)',
  analyzer: 'Bio-Rad D-10 HPLC + Beckman Coulter AU',
  vacutainer: 'Lavender EDTA + Grey Fluoride',
  tests: [
    { name: 'Fasting Blood Sugar (FBS)', range: '70.0 - 99.0', unit: 'mg/dL', desc: 'Basal overnight glucose homeostasis in fluoride' },
    { name: 'HbA1c Glycated Hemoglobin', range: '< 5.7 % (Normal) / 5.7 - 6.4 % (Prediabetes)', unit: '%', desc: 'Gold-standard 90-day three-month mean glucose' },
    { name: 'Estimated Average Glucose (eAG)', range: '90.0 - 120.0', unit: 'mg/dL', desc: 'Calculated continuous glucose average' },
    { name: 'Post-Prandial Blood Sugar (PPBS)', range: '< 140.0', unit: 'mg/dL', desc: 'Post-meal glucose clearance' }
  ]
};

const MASTER_THYROID = {
  groupKey: 'thyroid',
  groupName: 'Thyroid Endocrine Profile (3 Parameters)',
  analyzer: 'Roche Cobas e411 ECLIA (Chemiluminescence)',
  vacutainer: 'Gold SST Gel',
  tests: [
    { name: 'Ultrasensitive TSH (3rd Gen)', range: '0.35 - 4.94', unit: 'uIU/mL', desc: 'Pituitary feedback hormone for thyroid regulation' },
    { name: 'Total Triiodothyronine (T3)', range: '0.80 - 2.00', unit: 'ng/mL', desc: 'Active peripheral tissue metabolic hormone' },
    { name: 'Total Thyroxine (T4)', range: '5.10 - 14.10', unit: 'ug/dL', desc: 'Primary prohormone from thyroid gland' }
  ]
};

const MASTER_VITAMINS = {
  groupKey: 'vitamins',
  groupName: 'Vital Micronutrients (2 Parameters)',
  analyzer: 'Roche Cobas e411 ECLIA (Chemiluminescence)',
  vacutainer: 'Gold SST Gel',
  tests: [
    { name: 'Vitamin D3 (25-OH Total)', range: '30.0 - 100.0 (Optimal) / < 20.0 (Deficient)', unit: 'ng/mL', desc: 'Calcidiol reservoir essential for bone density and immunity' },
    { name: 'Vitamin B12 (Cyanocobalamin)', range: '211.0 - 911.0', unit: 'pg/mL', desc: 'Cobalamin cofactor vital for nerve myelin and RBCs' }
  ]
};

// Rich Curated Packages with Healthians / Redcliffe Clinical Tonality & Authentic DSD Aligarh Specs
const HEALTHIANS_FEATURED_PACKAGES: DiagnosticPackage[] = [
  {
    id: 'smartadvance',
    name: 'DSD Smart Health Advance',
    desc: 'Comprehensive 84-parameter executive screen: Full Hemogram, Liver Enzymes, Kidney Function, Lipid Subfractions, Thyroid and HbA1c with dual MD Pathologist sign-off.',
    price: 499,
    old: 1499,
    tag: 'Best Seller · 84 Parameters',
    category: 'Camp Packages',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=85',
    organEmoji: '👨',
    organ3DColor: '#10b981',
    parametersCount: 84,
    fastingHours: 10,
    sampleType: 'EDTA Blood + Fluoride + SST Gel',
    tat: 'Reports within 6 Hours',
    whyTake: 'सालाना प्रिवेंटिव हेल्थ चेकअप: लिवर, किडनी, कोलेस्ट्रॉल, साइलेंट डायबिटीज और खून की कमी का शुरुआती स्टेज पर पता लगाने हेतु।',
    symptoms: ['सामान्य कमजोरी व थकान', 'अचानक वजन में बदलाव', 'पाचन व गैस की समस्या', 'हाई बीपी / शुगर हिस्ट्री'],
    inclusionsList: ['Complete Hemogram (24 Tests)', 'Liver Function LFT (12 Tests)', 'Kidney Function KFT (10 Tests)', 'Lipid Profile (9 Tests)', 'Thyroid TSH (3rd Gen)', 'HbA1c Glycated Glucose'],
    analyzerName: 'Beckman Coulter DxC 700 AU + Sysmex XN-550',
    vacutainerTubes: [
      { name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'CBC & HbA1c' },
      { name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'LFT, KFT & Lipids' },
      { name: 'Grey Fluoride', capColor: '#94a3b8', liquidColor: '#b91c1c', type: 'Fasting Sugar' }
    ],
    categoriesBreakdown: [MASTER_HEMOGRAM, MASTER_LIVER, MASTER_KIDNEY, MASTER_LIPID, MASTER_THYROID, MASTER_DIABETES],
    clinicalSignificance: 'Comprehensive metabolic baseline evaluating cardiovascular risk, liver inflammation, renal clearance, glycemic average, and thyroid hormone activity.'
  },
  {
    id: 'executive',
    name: 'Executive Full Body Health Screen',
    desc: 'Complete metabolic workup: CBC, LFT, KFT, Lipid, Thyroid, HbA1c, Vitamin D3 (25-OH), Vitamin B12, and Urine Complete Analysis.',
    price: 999,
    old: 2899,
    tag: 'Most Comprehensive · 92 Tests',
    category: 'Camp Packages',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=85',
    organEmoji: '✨',
    organ3DColor: '#00f0ff',
    parametersCount: 92,
    fastingHours: 12,
    sampleType: 'Blood (3 Vials) + Spot Urine',
    tat: 'Same Day by 7 PM',
    whyTake: 'हड्डियों, नसों और गहरी विटामिन्स की कमी जांच: विटामिन D3 व B12 के साथ पूरा सिस्टेमिक प्रोफाइल।',
    symptoms: ['जोड़ों व कमर में दर्द', 'हाथ-पैरों में झनझनाहट/सुन्नता', 'बालों का अत्यधिक झड़ना', 'नींद न आना व तनाव'],
    inclusionsList: ['Vitamin D3 25-OH Total', 'Active Vitamin B12', 'Full CBC Hemogram (24)', 'Complete LFT & KFT Panels', 'Atherogenic Lipid Fractions', 'Urine Routine & Microalbumin'],
    analyzerName: 'Roche Cobas e411 + Beckman Coulter AU',
    vacutainerTubes: [
      { name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Vitamins & Hormones' },
      { name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'Complete Blood Count' },
      { name: 'Grey Fluoride', capColor: '#94a3b8', liquidColor: '#b91c1c', type: 'Hexokinase Sugar' }
    ],
    categoriesBreakdown: [MASTER_HEMOGRAM, MASTER_LIVER, MASTER_KIDNEY, MASTER_LIPID, MASTER_THYROID, MASTER_DIABETES, MASTER_VITAMINS],
    clinicalSignificance: 'Deep holistic evaluation covering micronutrient deficiencies (Vitamin D & B12), metabolic syndrome, and systemic inflammatory baseline.'
  },
  {
    id: 'basiccamp',
    name: 'Basic Health Pack (Vital 4)',
    desc: 'Core preventive screening: Complete Blood Count (24), Fasting Blood Glucose, Urine Routine (15), and Serum Creatinine (KFT).',
    price: 299,
    old: 699,
    tag: 'Camp Special · 42 Params',
    category: 'Camp Packages',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🩸',
    organ3DColor: '#38bdf8',
    parametersCount: 42,
    fastingHours: 8,
    sampleType: 'EDTA Blood + Urine',
    tat: 'Reports within 4 Hours',
    whyTake: 'इन्फेक्शन, खून की कमी (एनीमिया) और किडनी फिल्टरेशन का तुरंत और किफायती परीक्षण।',
    symptoms: ['चक्कर आना या पीलापन', 'हल्का बुखार या बार-बार इन्फेक्शन', 'पेशाब में जलन', 'रूटीन वर्कअप'],
    inclusionsList: ['Complete Blood Count (CBC 24)', 'Serum Creatinine (Renal GFR)', 'Fasting Blood Sugar (Glucose)', 'Urine Routine & Microscopy (15)'],
    analyzerName: 'Sysmex XN-550 + Beckman Coulter AU',
    vacutainerTubes: [
      { name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'Hematology CBC' },
      { name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Serum Creatinine' }
    ],
    categoriesBreakdown: [MASTER_HEMOGRAM, MASTER_KIDNEY, MASTER_DIABETES],
    clinicalSignificance: 'Rapid triage of acute infection, anemia, baseline kidney filtration, and overt hyperglycemia.'
  },
  {
    id: 'thyrodiabetes',
    name: 'Thyro-Diabetic Screen',
    desc: 'Combined endocrine panel: Ultrasensitive TSH, Total T3, Total T4, Fasting Glucose, Average Glucose, and HbA1c glycated hemoglobin.',
    price: 960,
    old: 1750,
    tag: 'Endocrine Specialist Panel',
    category: 'Diabetes',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🦋',
    organ3DColor: '#a855f7',
    parametersCount: 34,
    fastingHours: 10,
    sampleType: 'EDTA Blood + SST Gel',
    tat: 'Same Day within 6 Hours',
    whyTake: 'थायरॉइड और शुगर का दोहरा खतरा: जब वजन अनियंत्रित हो और लगातार थकान महसूस हो।',
    symptoms: ['गले में भारीपन या सूजन', 'सर्दियों में अत्यधिक ठंड लगना', 'वजन तेजी से बढ़ना/घटना', 'बार-बार प्यास व यूरिन आना'],
    inclusionsList: ['Ultrasensitive TSH (3rd Gen)', 'Total Triiodothyronine (T3)', 'Total Thyroxine (T4)', 'HbA1c Glycated (HPLC)', 'Fasting Blood Sugar (FBS)'],
    analyzerName: 'Roche Cobas e411 + Bio-Rad D-10 HPLC',
    vacutainerTubes: [
      { name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Thyroid Hormones' },
      { name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'HbA1c Glycated' },
      { name: 'Grey Fluoride', capColor: '#94a3b8', liquidColor: '#b91c1c', type: 'Fluoride Glucose' }
    ],
    categoriesBreakdown: [MASTER_THYROID, MASTER_DIABETES, MASTER_HEMOGRAM],
    clinicalSignificance: 'Designed for patients managing concurrent thyroid dysfunction and metabolic glucose resistance.'
  },
  {
    id: 'hypertension',
    name: 'Cardiac & Hypertension Shield',
    desc: 'Advanced cardiac risk panel: Extended Lipid Profile, High Sensitivity CRP, Serum Electrolytes (Na/K/Cl), Kidney Function, and Urine Microalbumin.',
    price: 4710,
    old: 7850,
    tag: 'Cardiologist Recommended',
    category: 'Heart Health',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🫀',
    organ3DColor: '#ff2a5f',
    parametersCount: 76,
    fastingHours: 12,
    sampleType: 'Serum + EDTA + Fluoride',
    tat: 'Same Day within 6 Hours',
    whyTake: 'दिल की नसों में ब्लॉकेज, हाई कोलेस्ट्रॉल व धमनियों में सूजन (Arterial Inflammation) का सटीक मूल्यांकन।',
    symptoms: ['सीने में हल्का दबाव या जकड़न', 'सीढ़ियां चढ़ने पर सांस फूलना', 'हाई ब्लड प्रेशर (Hypertension)', 'घबराहट व दिल की धड़कन तेज होना'],
    inclusionsList: ['Lipid Profile (Cholesterol, HDL, LDL)', 'High Sensitivity CRP (hs-CRP)', 'Serum Electrolytes (Na/K/Cl)', 'Kidney Function Panel (KFT)', 'Atherogenic Cardiac Ratios'],
    analyzerName: 'Beckman Coulter DxC 700 AU (Direct ISE)',
    vacutainerTubes: [
      { name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Lipid & hs-CRP' },
      { name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'Hemogram & Platelets' }
    ],
    categoriesBreakdown: [MASTER_LIPID, MASTER_KIDNEY, MASTER_HEMOGRAM],
    clinicalSignificance: 'Evaluates microvascular endothelial strain, lipid atherogenic particles, and renal electrolyte balance under hypertensive pressure.'
  },
  {
    id: 'senior',
    name: 'Senior Citizen Complete Care',
    desc: 'Tailored geriatric panel: Bone health (Calcium + Phosphorus + Alkaline Phosphatase), Renal, Liver, Lipid, Cardiac risk, CBC, and Urine culture screen.',
    price: 6789,
    old: 9100,
    tag: 'Geriatric Specialized · 58 Params',
    category: 'Senior Care',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=85',
    organEmoji: '👴',
    organ3DColor: '#fbbf24',
    parametersCount: 58,
    fastingHours: 10,
    sampleType: 'Blood + Clean-catch Urine',
    tat: 'Same Day Delivery',
    whyTake: '60+ आयु वर्ग के वरिष्ठ नागरिकों हेतु विशेष प्रोफाइल: कमजोर हड्डियां, यूरिक एसिड, लिवर-किडनी व प्रोस्टेट स्क्रीनिंग।',
    symptoms: ['घुटनों व जोड़ों में गंभीर दर्द', 'रात में बार-बार पेशाब आना', 'याददाश्त में कमी व कमजोरी', 'पुरानी दवाओं का साइड-इफेक्ट'],
    inclusionsList: ['Bone Matrix (Calcium, Phosphorus, ALP)', 'Serum Uric Acid & Creatinine', 'Cardiac Lipid & Liver Enzymes', 'Complete Hemogram (Sysmex 5-Part)', 'Urine Microscopy & Protein'],
    analyzerName: 'Beckman Coulter AU + Sysmex XN-550',
    vacutainerTubes: [
      { name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Bone & Biochemistry' },
      { name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'Geriatric CBC' }
    ],
    categoriesBreakdown: [MASTER_KIDNEY, MASTER_LIVER, MASTER_LIPID, MASTER_HEMOGRAM],
    clinicalSignificance: 'Comprehensive monitoring for age-related bone mineral density loss, joint inflammation, cardiovascular stiffening, and subclinical renal decline.'
  }
];

const INDIVIDUAL_TESTS: DiagnosticPackage[] = [
  {
    id: 'cbccamp',
    name: 'Complete Blood Count (CBC - 24 Tests)',
    desc: 'Haemoglobin, TLC, DLC (Neutrophils, Lymphocytes), Platelet Count, RBC, PCV and Red Cell Indices.',
    price: 99,
    old: 250,
    tag: 'NABL Certified',
    category: 'Individual Tests',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🩸',
    organ3DColor: '#e11d48',
    parametersCount: 24,
    fastingHours: 0,
    sampleType: 'Lavender EDTA Tube',
    tat: '3 Hours',
    whyTake: 'एनीमिया, प्लेटलेट काउंट, एलर्जी और शरीर में किसी भी प्रकार के इन्फेक्शन की सबसे पहली बुनियादी जांच।',
    symptoms: ['लगातार कमजोरी', 'बार-बार बुखार व ठंड', 'त्वचा पर नीले चकत्ते', 'डेंगू / प्लेटलेट फॉलोअप'],
    inclusionsList: ['Hemoglobin (Hb)', 'Total Leucocyte Count (TLC)', 'Platelet Count (Lakhs/cumm)', 'Differential Count (DLC 5-Part)', 'PCV & MCV Indices'],
    analyzerName: 'Sysmex XN-550 5-Part Differential Counter',
    vacutainerTubes: [{ name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'Whole Blood' }],
    categoriesBreakdown: [MASTER_HEMOGRAM]
  },
  {
    id: 'lipidprofile',
    name: 'Lipid Profile · Cardiac Risk (9 Tests)',
    desc: 'Total Cholesterol, HDL (Good), LDL (Bad), VLDL, Triglycerides and Atherogenic Cardiac Ratios.',
    price: 149,
    old: 450,
    tag: 'Heart Care',
    category: 'Profiles',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🫀',
    organ3DColor: '#ff2a5f',
    parametersCount: 9,
    fastingHours: 12,
    sampleType: 'Gold SST Tube',
    tat: '4 Hours',
    whyTake: 'कोलेस्ट्रॉल और ट्राइग्लिसराइड्स की जांच: दिल का दौरा (Heart Attack) और ब्रेन स्ट्रोक के जोखिम का आंकलन।',
    symptoms: ['सीने में भारीपन', 'मोटापा या ऑयली डाइट', 'फैमिली हिस्ट्री (हार्ट रोग)', 'स्मोकिंग या स्ट्रेस'],
    inclusionsList: ['Total Cholesterol', 'HDL Good Cholesterol', 'LDL Bad Cholesterol', 'Triglycerides Energy Fat', 'TC/HDL Risk Ratio'],
    analyzerName: 'Beckman Coulter DxC 700 AU (CHOD-PAP)',
    vacutainerTubes: [{ name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Serum Separator' }],
    categoriesBreakdown: [MASTER_LIPID]
  },
  {
    id: 'lftprofile',
    name: 'Liver Function Test - LFT (12 Tests)',
    desc: 'Bilirubin Total/Direct, SGOT, SGPT, ALP, Total Protein, Albumin, Globulin & A/G Ratio.',
    price: 149,
    old: 399,
    tag: 'Liver Health',
    category: 'Profiles',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🫁',
    organ3DColor: '#f59e0b',
    parametersCount: 12,
    fastingHours: 8,
    sampleType: 'Gold SST Tube',
    tat: '4 Hours',
    whyTake: 'पीलिया (Jaundice), फैटी लिवर (Fatty Liver) और शराब या दवाओं से लिवर पर हुए नुकसान का पता लगाने हेतु।',
    symptoms: ['आंखों व त्वचा का पीलापन', 'पेट के ऊपरी हिस्से में भारीपन', 'भूख न लगना व मतली', 'गहरे रंग का पेशाब'],
    inclusionsList: ['SGOT / AST Enzyme', 'SGPT / ALT Enzyme', 'Total & Direct Bilirubin', 'Alkaline Phosphatase (ALP)', 'Serum Albumin & A/G Ratio'],
    analyzerName: 'Beckman Coulter DxC 700 AU (Enzymatic UV)',
    vacutainerTubes: [{ name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Hepatic Serum' }],
    categoriesBreakdown: [MASTER_LIVER]
  },
  {
    id: 'kftprofile',
    name: 'Kidney Function Test - KFT (10 Tests)',
    desc: 'Serum Creatinine, Blood Urea, BUN, Uric Acid, Calcium & Electrolytes.',
    price: 149,
    old: 399,
    tag: 'Renal Function',
    category: 'Profiles',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🩺',
    organ3DColor: '#06b6d4',
    parametersCount: 10,
    fastingHours: 8,
    sampleType: 'Gold SST Tube',
    tat: '4 Hours',
    whyTake: 'गुर्दों (Kidneys) की फिल्टर करने की क्षमता और यूरिक एसिड व यूरिया की सटीक रिपोर्ट।',
    symptoms: ['पैरों व आंखों के नीचे सूजन', 'पेशाब की मात्रा में अचानक बदलाव', 'कमर में दोनों तरफ दर्द', 'जोड़ों में यूरिक एसिड का दर्द'],
    inclusionsList: ['Serum Creatinine (Jaffe Kinetic)', 'Blood Urea Nitrogen (BUN)', 'Serum Uric Acid', 'Serum Calcium', 'Estimated GFR Rate'],
    analyzerName: 'Beckman Coulter DxC 700 AU',
    vacutainerTubes: [{ name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Renal Serum' }],
    categoriesBreakdown: [MASTER_KIDNEY]
  },
  {
    id: 'thyroidprofile',
    name: 'Thyroid Profile (T3, T4, TSH 3rd Gen)',
    desc: 'Total Triiodothyronine (T3), Total Thyroxine (T4) & Ultrasensitive TSH.',
    price: 199,
    old: 499,
    tag: 'Endocrine Panel',
    category: 'Profiles',
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🦋',
    organ3DColor: '#a855f7',
    parametersCount: 3,
    fastingHours: 8,
    sampleType: 'Gold SST Tube',
    tat: '4 Hours',
    whyTake: 'थायरॉइड ग्रंथि के हॉर्मोन संतुलन की जांच — हाइपोथायरॉइडिज़्म व हाइपरथायरॉइडिज़्म के निदान हेतु।',
    symptoms: ['बिना कारण वजन बढ़ना या घटना', 'गले में भारीपन', 'बालों का पतला होना', 'मूड स्विंग्स व सुस्ती'],
    inclusionsList: ['Ultrasensitive TSH (3rd Gen ECLIA)', 'Total Triiodothyronine (T3)', 'Total Thyroxine (T4)'],
    analyzerName: 'Roche Cobas e411 ECLIA Chemiluminescence',
    vacutainerTubes: [{ name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Hormone Serum' }],
    categoriesBreakdown: [MASTER_THYROID]
  },
  {
    id: 'vitd',
    name: 'Vitamin D3 (25-Hydroxy Vitamin D)',
    desc: 'Measures total 25-OH Vitamin D for bone density, calcium metabolism and immunity.',
    price: 499,
    old: 1200,
    tag: 'Bone Vitality',
    category: 'Individual Tests',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🦴',
    organ3DColor: '#38bdf8',
    parametersCount: 1,
    fastingHours: 0,
    sampleType: 'Gold SST Tube',
    tat: '6 Hours',
    whyTake: 'कमजोर हड्डियों (ऑस्टियोपोरोसिस), मांसपेशियों में खिंचाव व रोग प्रतिरोधक क्षमता (Immunity) की जांच।',
    symptoms: ['हड्डियों व पिंडलियों में दर्द', 'दिनभर भारी थकान रहना', 'इम्यूनिटी कमजोर होना', 'धूप में कम निकलना'],
    inclusionsList: ['25-Hydroxy Vitamin D3 [25(OH)D Total]'],
    analyzerName: 'Roche Cobas e411 Chemiluminescence',
    vacutainerTubes: [{ name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Vitamin Serum' }],
    categoriesBreakdown: [MASTER_VITAMINS]
  },
  {
    id: 'vitb12',
    name: 'Vitamin B12 (Cyanocobalamin)',
    desc: 'Assesses active Vitamin B12 levels vital for red blood cell formation and neurological function.',
    price: 499,
    old: 1100,
    tag: 'Nerve Health',
    category: 'Individual Tests',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=85',
    organEmoji: '⚡',
    organ3DColor: '#10b981',
    parametersCount: 1,
    fastingHours: 8,
    sampleType: 'Gold SST Tube',
    tat: '6 Hours',
    whyTake: 'नसों की कमजोरी, हाथ-पैरों में झनझनाहट और ब्रेन व मेमोरी स्वास्थ्य के लिए बेहद महत्वपूर्ण विटामिन जांच।',
    symptoms: ['हाथ-पैरों में चींटियां चलना', 'याददाश्त में कमी या भुलक्कड़पन', 'मुंह में बार-बार छाले होना', 'शुद्ध शाकाहारी खान-पान'],
    inclusionsList: ['Active Vitamin B12 (Cyanocobalamin)'],
    analyzerName: 'Roche Cobas e411 Chemiluminescence',
    vacutainerTubes: [{ name: 'Gold SST Gel', capColor: '#eab308', liquidColor: '#ca8a04', hasGelSeparator: true, type: 'Neurological Serum' }],
    categoriesBreakdown: [MASTER_VITAMINS]
  },
  {
    id: 'diabeticbasic',
    name: 'Diabetic Profile (FBS + PPBS + HbA1c)',
    desc: 'Fasting blood glucose, post-meal glucose and 3-month glycated hemoglobin average.',
    price: 199,
    old: 550,
    tag: 'Glycemic Control',
    category: 'Profiles',
    image: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&w=900&q=85',
    organEmoji: '🩸',
    organ3DColor: '#00f0ff',
    parametersCount: 3,
    fastingHours: 10,
    sampleType: 'Grey Fluoride + EDTA',
    tat: '4 Hours',
    whyTake: 'डायबिटीज की सम्पूर्ण और सटीक जांच: तुरंत की शुगर के साथ-साथ पिछले 90 दिनों का शुगर औसत (HbA1c)।',
    symptoms: ['बार-बार पेशाब लगना', 'अचानक ज्यादा भूख व प्यास लगना', 'चोट या घाव देरी से भरना', 'आंखों के आगे धुंधलापन'],
    inclusionsList: ['HbA1c Glycated Hemoglobin (HPLC)', 'Fasting Blood Sugar (Hexokinase)', 'Post-Prandial Blood Sugar (PPBS)', 'Estimated Average Glucose (eAG)'],
    analyzerName: 'Bio-Rad D-10 HPLC + Beckman Coulter AU',
    vacutainerTubes: [
      { name: 'Grey Fluoride', capColor: '#94a3b8', liquidColor: '#b91c1c', type: 'Glucose Preservation' },
      { name: 'Lavender EDTA', capColor: '#a855f7', liquidColor: '#7f1d1d', type: 'HbA1c Whole Blood' }
    ],
    categoriesBreakdown: [MASTER_DIABETES]
  }
];

const ALL_PACKAGES = [...HEALTHIANS_FEATURED_PACKAGES, ...INDIVIDUAL_TESTS];

const FAQS = [
  {
    q: 'Can I drink water during my 10-12 hour fasting period?',
    a: 'Yes, absolutely. Plain drinking water is permitted and actually recommended because proper hydration keeps your veins dilated, making sample collection smoother and painless. However, please avoid tea, coffee, milk, and juices.'
  },
  {
    q: 'How and when will I receive my NABL diagnostic test report?',
    a: 'Your digital report is signed by dual MD Pathologists and released electronically within 4 to 6 hours after sample processing. You will receive an encrypted PDF link via WhatsApp and SMS, and you can also access it inside our Patient Portal.'
  },
  {
    q: 'Why does the Patient Portal say "Report Download Locked"?',
    a: 'Diagnostic reports are strictly locked until our MD Pathologists review analyzer QC controls and sign off. To ensure patient safety and avoid misinterpretation, unverified or in-process samples cannot be downloaded. Once testing is verified, the download unlocks automatically.'
  },
  {
    q: 'How does DSD maintain sample integrity and temperature control?',
    a: 'Every phlebotomist carries an insulated digital cold-chain bag maintaining an automated temperature between 2°C and 8°C. Samples are sealed with unique barcode labels at your doorstep before transport.'
  }
];

const money = (n: number) => '₹' + n.toLocaleString('en-IN');
const WA_NUMBER = '919258888085';
const CLINIC_PHOTO = 'https://images.openai.com/static-rsc-1/UfOGXNZ4JfOoRFI_yn4iN_vsT0-NTdrIIoo-Bpur3sjeJ5qMivHTnf5ow1mPQDbBXo8RFT9pHI46n_n7nK2lFzno3ZEnTFD0y3ZA8rTMrUU4tcEcuSAjl2D_Pv8yruhFu7YMGnDkdQbiuWBcUMSewE5ua3kI0axlKLwcJn46XTY';

const DEFAULT_NAV_TABS: NavTabItem[] = [
  { id: 'packages', label: 'Health Packages', href: '#packages', visible: true, order: 1 },
  { id: 'concerns', label: 'Health Concerns', href: '#organs', visible: true, order: 2 },
  { id: 'patient-portal', label: 'Patient Portal & Reports', href: '#', isSpecial: 'portal', visible: true, order: 3 },
  { id: 'track-phlebo', label: 'Track Phlebo 3D', href: '#', isSpecial: 'tracking', visible: true, order: 4 },
  { id: 'vitality', label: 'Vitality AI ✨', href: '#vitality-score', isSpecial: 'vitality', visible: true, order: 5 },
  { id: 'staff-portal', label: 'Staff Portal', href: '#', visible: true, order: 6 },
];

export default function App() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locMsg, setLocMsg] = useState('');
  const [preRoutedHub, setPreRoutedHub] = useState<AligarhHub | null>(ALIGARH_HUBS[0]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    hub: 'Central NABL Lab & Ramghat Road Hub',
    hubId: 'hub-ramghat',
    locality: 'Ramghat Road',
    slot: 'Tomorrow, 7:00 – 8:30 AM (Fasting)',
  });
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [liveTrackingOpen, setLiveTrackingOpen] = useState(false);
  const [patientPortalOpen, setPatientPortalOpen] = useState(false);
  const [smartReportOpen, setSmartReportOpen] = useState(false);
  const [smartReportBookingId, setSmartReportBookingId] = useState('DSD-2401');
  const [phleboWorkspaceOpen, setPhleboWorkspaceOpen] = useState(false);
  const [salesWorkspaceOpen, setSalesWorkspaceOpen] = useState(false);
  const [superAdminOpen, setSuperAdminOpen] = useState(false);
  const [tenantAdminOpen, setTenantAdminOpen] = useState(false);
  const [portalRole, setPortalRole] = useState('admin');
  const [portalUser, setPortalUser] = useState('');

  // Live CSS Theme custom properties initialization
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('dsd_theme_settings');
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme);
        const root = document.documentElement;
        if (parsed.primaryColor) root.style.setProperty('--brand-primary', parsed.primaryColor);
        if (parsed.accentColor) root.style.setProperty('--brand-accent', parsed.accentColor);
        if (parsed.cardRadius) {
          root.style.setProperty('--card-radius', 
            parsed.cardRadius === 'sharp' ? '6px' :
            parsed.cardRadius === 'squircle' ? '18px' :
            parsed.cardRadius === 'pill' ? '28px' : '16px'
          );
        }
        if (parsed.cardDensity) {
          root.style.setProperty('--card-density-padding',
            parsed.cardDensity === 'compact' ? '0.75rem' :
            parsed.cardDensity === 'spacious' ? '1.75rem' : '1.25rem'
          );
        }
      }
    } catch {
      // fallback to defaults
    }
  }, []);

  const [navTabs, setNavTabs] = useState<NavTabItem[]>(() => {
    try {
      const saved = localStorage.getItem('hrgen-saas-nav-tabs');
      return saved ? JSON.parse(saved) : DEFAULT_NAV_TABS;
    } catch {
      return DEFAULT_NAV_TABS;
    }
  });

  // Modals & Accordions
  const [selectedDetailPkg, setSelectedDetailPkg] = useState<DiagnosticPackage | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [breakdownDrawerOpen, setBreakdownDrawerOpen] = useState(false);
  const [activeBreakdownPkg, setActiveBreakdownPkg] = useState<DiagnosticPackage | null>(null);
  const [heroViewMode, setHeroViewMode] = useState<'3D_ATLAS' | 'DNA_STRAND'>('3D_ATLAS');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Welcome to Dr. Shastri Diagnostics. How can we assist you with test packages, fasting guidelines or home collection today?' }
  ]);

  const [cardEdits, setCardEdits] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem('dsd-card-edits') || '{}');
    } catch {
      return {};
    }
  });

  const cartItems = useMemo(
    () => ALL_PACKAGES.filter(t => cart[t.id]),
    [cart]
  );
  const count = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart]
  );
  const total = useMemo(
    () =>
      money(
        cartItems.reduce(
          (sum, t) => sum + (cardEdits[t.id]?.price ?? t.price) * cart[t.id],
          0
        )
      ),
    [cartItems, cart, cardEdits]
  );

  const filteredPackages = useMemo(() => {
    return ALL_PACKAGES.map(t => ({ ...t, ...(cardEdits[t.id] || {}) })).filter(pkg => {
      const matchesSearch = (pkg.name + ' ' + pkg.desc).toLowerCase().includes(search.toLowerCase());
      if (selectedOrgan) {
        const organDef = ORGAN_BLOCKS.find(o => o.id === selectedOrgan);
        if (organDef) {
          const matchesCategory = pkg.category.toLowerCase() === organDef.filterCat.toLowerCase();
          const matchesTitle = pkg.name.toLowerCase().includes(organDef.name.toLowerCase()) || 
                               pkg.desc.toLowerCase().includes(organDef.tag.toLowerCase());
          return matchesSearch && (matchesCategory || matchesTitle);
        }
      }
      return matchesSearch;
    });
  }, [search, selectedOrgan, cardEdits]);

  function qty(id: string, d: number) {
    setCart(old => {
      const n = { ...old };
      n[id] = (n[id] || 0) + d;
      if (n[id] <= 0) delete n[id];
      return n;
    });
  }

  const handleOpenDetailModal = (pkg: DiagnosticPackage) => {
    setSelectedDetailPkg(pkg);
    setDetailModalOpen(true);
  };

  function locate() {
    if (!navigator.geolocation) {
      setLocMsg('GPS unavailable. Enter address manually.');
      return;
    }
    setLocMsg('Requesting location permission…');
    navigator.geolocation.getCurrentPosition(
      p => {
        setLoc({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocMsg('GPS Location attached to booking ✓');
      },
      () => setLocMsg('Location not shared. Please enter address manually.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function whatsapp() {
    if (!count) {
      setCartOpen(true);
      return;
    }
    if (!form.name.trim() || !/^[0-9+\s-]{10,15}$/.test(form.phone)) {
      setBookingOpen(true);
      return;
    }
    const items = cartItems
      .map(
        t => t.name + ' × ' + cart[t.id] + ' — ' + money(t.price * cart[t.id])
      )
      .join('\n');
    const msg =
      'New booking request — Dr. Shastri Diagnostics (DSD Care Aligarh)%0AName: ' +
      encodeURIComponent(form.name) +
      '%0APhone: ' +
      encodeURIComponent(form.phone) +
      '%0ASelected Aligarh Hub: ' +
      encodeURIComponent(form.hub) +
      '%0ANeighborhood / Locality: ' +
      encodeURIComponent(form.locality) +
      '%0ATests: ' +
      encodeURIComponent(items) +
      '%0ATotal: ' +
      total +
      '%0ACollection: 60-Min Cold-Chain Doorstep Phlebo (3.8°C)%0ASlot: ' +
      encodeURIComponent(form.slot) +
      '%0AAddress: ' +
      encodeURIComponent(form.address || 'To be confirmed') +
      (loc ? '%0AGPS: ' + encodeURIComponent(loc.lat + ', ' + loc.lng) : '');

    // Synchronize booking directly into GIA Clinical LIMS Core on port 3001
    const bookingRef = `DSD-${Date.now().toString().slice(-4)}`;
    LimsBridge.pushBookingToLims({
      patientName: form.name,
      phone: form.phone,
      testCode: cartItems[0]?.id?.slice(0, 5).toUpperCase() || 'CBC',
      bookingRef
    }).catch(console.warn);

    window.open(
      'https://wa.me/' + WA_NUMBER + '?text=' + msg,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q) return;
    const low = q.toLowerCase();
    let answer = 'For exact availability and current rates, contact DSD on WhatsApp at +91 92588 88085.';
    if (/price|cost|rate|kitna|कीमत|दाम/.test(low)) answer = 'Our camp packages start at ₹299 (Basic) and ₹499 (Smart Health Advance 84 params) with free doorstep sample collection. Confirm on WhatsApp: +91 92588 88085.';
    else if (/fasting|fast|भूखा/.test(low)) answer = '10 to 12 hours overnight fasting is required for Lipid, Sugar and Liver panels. Plain water is allowed and recommended.';
    else if (/report|result/.test(low)) answer = 'Reports are signed by dual MD Pathologists and released within 4 to 6 hours on WhatsApp and inside the Patient Portal.';
    else if (/home|collection|sample|phlebo|घर/.test(low)) answer = 'Home sample collection is 100% free with cold-chain 3.8°C digital monitoring. Phlebotomists arrive in 60 minutes across Aligarh.';
    setChatMessages(old => [...old, { from: 'user', text: q }, { from: 'bot', text: answer }]);
    setChatInput('');
  }

  return (
    <div className="min-h-screen">
      
      {/* TOP TELEMETRY BAR WITH REAL EKG HEARTBEAT TRACE */}
      <div className="topline flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-sky-400" />
          <span><b>Dr. Shastri Diagnostics</b> · Aligarh Central NABL Lab & Delhi-NCR Hub | Powered by <b>FlaboTrack™ (Flabo.in)</b></span>
        </div>
        
        {/* Real-time EKG wave monitor */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/70 border border-emerald-500/30 px-3 py-0.5 rounded-full">
          <HeartPulse size={13} className="text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 font-bold">EKG 72 BPM</span>
          <div className="w-28 h-5 overflow-hidden">
            <EkgHeartbeatWave heartRate={72} color="#10b981" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            Live Home Collection Slots Available
          </span>
          <span className="hidden md:inline text-slate-400">1246, Vidyanagar · Ramghat Road</span>
        </div>
      </div>

      {/* STICKY LUXURY HEADER */}
      <header className="header">
        <a className="brand" href="#">
          <img className="logoImage" src="/resources/dsd-logo.png" alt="Dr. Shastri Diagnostics" />
          <div className="brandMeta">
            <b>Dr. Shastri Diagnostics</b>
            <small>NABL ISO-15189 Certified Lab</small>
          </div>
        </a>

        <nav>
          {navTabs
            .filter(t => t.visible)
            .sort((a, b) => a.order - b.order)
            .map(tab => {
              if (tab.isSpecial === 'portal') {
                return (
                  <button 
                    key={tab.id}
                    type="button" 
                    className="navPillBtn green flex items-center gap-1.5"
                    onClick={() => setPatientPortalOpen(true)}
                  >
                    <FileText size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              }
              if (tab.isSpecial === 'tracking') {
                return (
                  <button 
                    key={tab.id}
                    type="button" 
                    className="navPillBtn"
                    onClick={() => setLiveTrackingOpen(true)}
                  >
                    <Bike size={14} /> {tab.label}
                  </button>
                );
              }
              if (tab.isSpecial === 'vitality') {
                return (
                  <a
                    key={tab.id}
                    href="#vitality-score"
                    className="navlink font-semibold text-amber-300"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('vitality-score')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {tab.label}
                  </a>
                );
              }
              if (tab.id === 'staff-portal') {
                return (
                  <button 
                    key={tab.id}
                    type="button"
                    className="navlink text-xs text-slate-400 hover:text-white"
                    onClick={() => setPortalOpen(true)}
                  >
                    {tab.label}
                  </button>
                );
              }
              return (
                <a 
                  key={tab.id} 
                  href={tab.href || '#'} 
                  className="navlink"
                  onClick={(e) => {
                    if (tab.href?.startsWith('#')) {
                      e.preventDefault();
                      const el = document.querySelector(tab.href);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {tab.label}
                </a>
              );
            })}
        </nav>

        <div className="headActions">
          <button 
            type="button" 
            className="cartBtn"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={17} /> Cart <b>{count}</b>
          </button>
        </div>
      </header>

      <main>
        {/* CINEMATIC 3D VFX HERO */}
        <section className="hero3DContainer">
          <div>
            <div className="eyebrow">
              <span className="pulse"></span> 60-MIN DOORSTEP ARRIVAL · NABL CERTIFIED
            </div>

            <h1 className="heroHeading">
              Precision Diagnostics <br />
              <span className="heroGradientText">at your home.</span>
            </h1>

            <p className="heroSubtitle">
              Experience the gold-standard in preventive diagnostics from Dr. Shastri Diagnostics. 100% cold-chain monitored sample transit, Beckman Coulter automated analyzers, and same-day MD Pathologist verified reports.
            </p>

            <div className="heroBtns">
              <a
                className="primaryBtn"
                href="#packages"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explore Curated Packages <ArrowRight size={17} />
              </a>

              <button
                type="button"
                className="secondaryBtn"
                onClick={() => setPatientPortalOpen(true)}
              >
                <FileText size={16} className="text-emerald-400" /> Patient Login / Report Status
              </button>
            </div>

            {/* 4 Telemetry Metrics Grid */}
            <div className="telemetryGrid">
              <div className="telemetryPill">
                <ThermometerSnowflake size={22} className="text-sky-400 shrink-0" />
                <div>
                  <b>100% Cold-Chain (3.8°C)</b>
                  <small>Automated digital sensor logging</small>
                </div>
              </div>

              <div className="telemetryPill">
                <Clock3 size={22} className="text-emerald-400 shrink-0" />
                <div>
                  <b>60-Min Doorstep Phlebo</b>
                  <small>Swiggy-style live 3D ride map</small>
                </div>
              </div>

              <div className="telemetryPill">
                <Microscope size={22} className="text-purple-400 shrink-0" />
                <div>
                  <b>Beckman Coulter Analyzers</b>
                  <small>6-Sigma automated multi-systems</small>
                </div>
              </div>

              <div className="telemetryPill">
                <ShieldCheck size={22} className="text-amber-400 shrink-0" />
                <div>
                  <b>Dual MD Pathologist</b>
                  <small>Double-verified encrypted reports</small>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive 3D Anatomy Atlas (Learn Anatomy 3D Style) with Switcher */}
          <div className="hero3DCanvasWrapper relative">
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 text-[10.5px]">
              <button
                type="button"
                onClick={() => setHeroViewMode('3D_ATLAS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  heroViewMode === '3D_ATLAS' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                3D Human Atlas
              </button>
              <button
                type="button"
                onClick={() => setHeroViewMode('DNA_STRAND')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  heroViewMode === 'DNA_STRAND' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                DNA Strand
              </button>
            </div>

            {heroViewMode === '3D_ATLAS' ? (
              <Interactive3DAnatomyAtlas
                selectedOrgan={selectedOrgan}
                onSelectOrgan={(organId) => {
                  setSelectedOrgan(selectedOrgan === organId ? null : organId);
                  // Find related package to trigger test breakdown
                  const relatedPkg = HEALTHIANS_FEATURED_PACKAGES.find(p => 
                    (organId === 'heart' && p.category === 'Heart Health') ||
                    (organId === 'diabetes' && p.category === 'Diabetes') ||
                    p.id === 'smartadvance'
                  ) || HEALTHIANS_FEATURED_PACKAGES[0];
                  setActiveBreakdownPkg(relatedPkg);
                  setBreakdownDrawerOpen(true);
                }}
                className="w-full h-full"
              />
            ) : (
              <ThreeHeroScene className="w-full h-full" />
            )}
          </div>
        </section>

        {/* SEARCH BAR */}
        <section className="searchbarSection">
          <div className="searchbarBox">
            <Search size={20} className="text-sky-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search 500+ tests, profiles or packages (e.g. HbA1c, CBC, Lipid, Thyroid, Full Body)…"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>
        </section>

        {/* STEP 1: DISEASE INTERACTIVE RESONANCE ARENA (Real 3D Human Anatomy Atlas + Test Tubes Explosion) */}
        <DiseaseAnatomyResonanceArena
          onAddToCart={(pkg) => {
            qty(pkg.id, 1);
            setCartOpen(true);
          }}
        />

        {/* HEALTH CONCERNS & ORGAN DISCOVERY (HEALTHIANS / REDCLIFFE BENCHMARK) */}
        <section className="organGridSection" id="organs">
          <div className="sectionTitleRow">
            <div>
              <div className="eyebrow">EXPLORE BY HEALTH CONCERN</div>
              <h2>Find tests by organ & vital condition</h2>
              <p>Select an organ to instantly filter specialized diagnostic panels.</p>
            </div>
            {selectedOrgan && (
              <button 
                type="button" 
                onClick={() => setSelectedOrgan(null)}
                className="text-xs text-sky-400 font-bold hover:underline"
              >
                Reset Filter (Showing All)
              </button>
            )}
          </div>

          <div className="organGrid">
            {ORGAN_BLOCKS.map(organ => (
              <div 
                key={organ.id}
                className={`organCard ${selectedOrgan === organ.id ? 'active' : ''}`}
                style={{
                  transform: selectedOrgan === organ.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedOrgan === organ.id ? '0 0 30px rgba(0, 240, 255, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.2)' : undefined,
                  borderColor: selectedOrgan === organ.id ? '#00f0ff' : undefined
                }}
                onClick={() => {
                  const nextOrgan = selectedOrgan === organ.id ? null : organ.id;
                  setSelectedOrgan(nextOrgan);
                  
                  if (nextOrgan) {
                    // Auto-open 3D Organ breakdown drawer
                    const matchedPkg = HEALTHIANS_FEATURED_PACKAGES.find(p => 
                      (nextOrgan === 'heart' && p.category === 'Heart Health') ||
                      (nextOrgan === 'diabetes' && p.category === 'Diabetes') ||
                      (nextOrgan === 'senior' && p.category === 'Senior Care') ||
                      p.id === 'smartadvance'
                    ) || HEALTHIANS_FEATURED_PACKAGES[0];
                    setActiveBreakdownPkg(matchedPkg);
                    setBreakdownDrawerOpen(true);
                  }
                }}
              >
                <div className="organIconBadge">{organ.icon}</div>
                <div className="organCardName">{organ.name}</div>
                <div className="organCardTag">{organ.testsCount}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CURATED DIAGNOSTIC PACKAGES (HEALTHIANS & REDCLIFFE LAYOUT) */}
        <section className="curatedPackagesSection" id="packages">
          <div className="sectionTitleRow">
            <div>
              <div className="eyebrow">CURATED CLINICAL PACKAGES</div>
              <h2>Popular Comprehensive Health Packages</h2>
              <p>NABL-certified comprehensive packages with transparent parameters and fasting guidelines.</p>
            </div>
            <a 
              href="#vitality-score" 
              className="text-xs font-bold text-sky-400 flex items-center gap-1.5 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('vitality-score')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Take 60s AI Health Quiz <Sparkles size={14} />
            </a>
          </div>

          <div className="curatedPackagesGrid">
            {filteredPackages.map(pkg => {
              const discountPercent = Math.max(0, Math.round(((pkg.old - pkg.price) / pkg.old) * 100));
              const accentColor = pkg.organ3DColor || '#00f0ff';

              return (
                <article 
                  key={pkg.id} 
                  className="curatedCard group relative flex flex-col justify-between"
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="curatedCardTop p-6">
                    {/* 8K Luxury Clinical Laboratory & Diagnostic Photography Header */}
                    {pkg.image && (
                      <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-[calc(var(--card-radius,20px)-1px)] group/img">
                        <img 
                          src={pkg.image} 
                          alt={pkg.name} 
                          className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500 filter brightness-90 group-hover/img:brightness-100"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        
                        {/* Frosted Glass Floating Badge */}
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                          <span className="backdrop-blur-md bg-slate-950/75 border border-white/20 text-white font-mono text-[10.5px] font-bold px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {pkg.analyzerName || 'Beckman Coulter DxC 700 + Roche e411'}
                          </span>
                          {discountPercent > 0 && (
                            <span className="backdrop-blur-md bg-rose-500/85 text-white font-bold text-xs px-2.5 py-0.5 rounded-lg shadow-lg">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Top Row: 3D Organ Badge + Badges */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="organ3DBadge relative"
                          style={{ '--organ-glow': `${accentColor}55` } as React.CSSProperties}
                        >
                          <div className="organGlowBackdrop" />
                          <div className="organIconMesh">
                            {pkg.organEmoji || '🔬'}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="curatedParamPill block w-fit">
                              {pkg.parametersCount || 10}+ Biomarkers
                            </span>
                            <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              NABL ISO 15189
                            </span>
                            {pkg.tag && !pkg.tag.toLowerCase().includes('parameters') && (
                              <span className="text-[10px] font-mono text-cyan-400 font-medium">
                                · {pkg.tag.split('·')[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 
                      className="curatedTitle text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => handleOpenDetailModal(pkg)}
                      title="Click to view full clinical parameters & preparation"
                    >
                      <span>{pkg.name}</span>
                      <ChevronRight size={18} className="text-slate-500 group-hover:text-cyan-300 transition-transform group-hover:translate-x-1" />
                    </h3>
                    <p className="curatedDesc text-xs text-slate-400 leading-relaxed mb-4">
                      {pkg.desc}
                    </p>

                    {/* WHY TAKE THIS TEST (CLINICAL PURPOSE & SYMPTOMS) */}
                    {pkg.whyTake && (
                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4 space-y-1.5">
                        <div className="text-[10.5px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={12} /> क्लिनिकल उद्देश्य (Clinical Purpose)
                        </div>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed">
                          {pkg.whyTake}
                        </p>
                      </div>
                    )}

                    {/* SYMPTOMS PILLS */}
                    {pkg.symptoms && pkg.symptoms.length > 0 && (
                      <div className="mb-4">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                          लक्षण एवं संकेत (Key Symptoms):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.symptoms.map((sym: string) => (
                            <span 
                              key={sym} 
                              className="text-[10.5px] px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            >
                              • {sym}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC CONSTITUENT TESTS INCLUSIONS */}
                    <div className="mb-4">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                        जांच प्रोफाइल (Profile Inclusions):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(pkg.inclusionsList || ['Complete Hemogram', 'Liver LFT', 'Kidney KFT', 'Lipid Profile']).map((inc: string, iIdx: number) => (
                          <span key={iIdx} className="inclusionTag text-[11px] bg-slate-900 border border-slate-700/60 text-slate-300 flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                            {inc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* LUXURY CLINICAL PHOTO ACCREDITATION & DETAIL TRIGGER */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 border border-slate-800/80 flex items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-medium text-slate-300">
                          Central NABL Lab · Dual MD Pathologist Sign-Off
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailPkg(pkg);
                          setDetailModalOpen(true);
                        }}
                        className="text-[10.5px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline transition-all shrink-0"
                        title="Inspect clinical specimen tubes and analyzer worklists"
                      >
                        <FlaskConical size={12} />
                        <span>View Vials & Details</span>
                      </button>
                    </div>

                  </div>

                    {/* PHASE 1: PRE-ANALYTICAL CLINICAL METADATA BADGES */}
                  <div className="px-6 pb-2 flex flex-wrap gap-1.5">
                    {pkg.fastingHours && pkg.fastingHours > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        ☕ Fasting {pkg.fastingHours}–{pkg.fastingHours + 2} Hrs
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                        ✓ Non-Fasting (Anytime)
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/25">
                      ⏱ TAT: {pkg.tat || 'Same Day'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      🧪 {pkg.sampleType || 'Blood (Vacutainer)'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25">
                      ⚙ 6-Sigma Analyzer
                    </span>
                  </div>

                  {/* CLINICAL SPECS & ANALYZER ROW */}
                  <div className="curatedSpecsRow">
                    <div className="curatedSpecItem">
                      <Droplet size={14} className="text-cyan-400 shrink-0" />
                      <span className="truncate">{pkg.sampleType || 'Blood & Urine'}</span>
                    </div>
                    <div className="curatedSpecItem">
                      <Clock3 size={14} className="text-amber-400 shrink-0" />
                      <span>{pkg.fastingHours ? `${pkg.fastingHours}h Fasting` : 'Non-fasting OK'}</span>
                    </div>
                    <div className="curatedSpecItem">
                      <Activity size={14} className="text-emerald-400 shrink-0" />
                      <span>{pkg.tat || 'Reports in 6 hrs'}</span>
                    </div>
                    <div className="curatedSpecItem" title={pkg.analyzerName || 'Beckman Coulter AU480'}>
                      <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
                      <span className="truncate font-medium">{pkg.analyzerName || 'Beckman Coulter'}</span>
                    </div>
                  </div>

                  {/* VALUE ADD: FREE MBBS DOCTOR TELECONSULTATION (HEALTHIANS BENCHMARK) */}
                  <div className="px-6 pt-3 pb-1">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-300">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Includes Free 1-on-1 MBBS Doctor Teleconsultation & Diet Plan</span>
                    </div>
                  </div>

                  {/* PRICING & ACTIONS */}
                  <div className="curatedCardBottom p-6">
                    <div className="curatedPriceBox">
                      <span className="curatedPriceMain text-2xl font-black text-white">₹{pkg.price}</span>
                      {pkg.old > pkg.price && (
                        <span className="curatedPriceOld text-xs text-slate-500 line-through">₹{pkg.old}</span>
                      )}
                    </div>

                    <div className="curatedActionGroup flex items-center gap-2">
                      <button 
                        type="button" 
                        className="btnViewDetails flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px] px-3.5 py-2.5 rounded-xl"
                        onClick={() => handleOpenDetailModal(pkg)}
                        title="View complete clinical breakdown & fasting instructions"
                      >
                        <Info size={13} className="text-cyan-400" />
                        Details
                      </button>

                      <button 
                        type="button" 
                        className="btnViewDetails flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px] px-3.5 py-2.5 rounded-xl"
                        onClick={() => {
                          setActiveBreakdownPkg(pkg);
                          setBreakdownDrawerOpen(true);
                        }}
                      >
                        <FlaskConical size={14} className="text-cyan-400" />
                        3D Anatomy
                      </button>

                      <button 
                        type="button" 
                        className="btnBookNow text-xs font-black min-h-[44px] px-4 py-2.5 rounded-xl"
                        onClick={() => {
                          qty(pkg.id, 1);
                          setCartOpen(true);
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredPackages.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              No matching diagnostic packages found. Try resetting the search or organ filter.
            </div>
          )}
        </section>

        {/* 60-MINUTE DOORSTEP PHLEBOTOMY EXPRESS HUBS (ALIGARH DISTRICT COVERAGE) */}
        <AligarhPickupHubsSection
          onSelectHubForBooking={(hub) => {
            setPreRoutedHub(hub);
            setForm(prev => ({
              ...prev,
              hub: hub.name,
              hubId: hub.id,
              locality: hub.coverageAreas[0] || 'Ramghat Road'
            }));
            setBookingOpen(true);
          }}
          onOpenLiveTracking={() => setLiveTrackingOpen(true)}
        />

        {/* VITALITY AI HEALTH ASSESSMENT SECTION */}
        <div className="vitalityScoreSection">
          <VitalityAssessment
            onAddToCart={(pkgId) => {
              qty(pkgId, 1);
              setCartOpen(true);
            }}
            onBookPackage={(pkgId) => {
              qty(pkgId, 1);
              setBookingOpen(true);
            }}
          />
        </div>

        {/* CLINICAL LABORATORY QUALITY & ACCREDITATIONS */}
        <section className="qualitySection">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
              Uncompromising Diagnostic Precision
            </span>
            <h2 className="text-3xl font-extrabold text-white">Why Patients & Doctors Trust DSD Care</h2>
            <p className="text-slate-400 text-sm">
              We operate with 6-Sigma clinical precision to ensure every single parameter is accurate, validated, and reproducible.
            </p>
          </div>

          <div className="qualityGrid">
            <div className="qualityCard">
              <div className="qualityCardIcon"><Microscope size={22} /></div>
              <div className="qualityCardTitle">Beckman Coulter & Roche Analyzers</div>
              <div className="qualityCardDesc">
                Fully automated clinical chemistry and hematology systems eliminating human pipette errors.
              </div>
            </div>

            <div className="qualityCard">
              <div className="qualityCardIcon"><ThermometerSnowflake size={22} /></div>
              <div className="qualityCardTitle">3.8°C Cold-Chain Guaranteed</div>
              <div className="qualityCardDesc">
                Continuous IoT digital sensor monitoring protects sensitive enzymes from degradation during transport.
              </div>
            </div>

            <div className="qualityCard">
              <div className="qualityCardIcon"><ShieldCheck size={22} /></div>
              <div className="qualityCardTitle">Dual MD Pathologist Verification</div>
              <div className="qualityCardDesc">
                Every abnormal and critical result is personally reviewed and cryptographically signed before release.
              </div>
            </div>

            <div className="qualityCard">
              <div className="qualityCardIcon"><FileText size={22} /></div>
              <div className="qualityCardTitle">Smart QR-Coded Reports</div>
              <div className="qualityCardDesc">
                Tamper-proof digital reports with historical trends and instant verification for consulting physicians.
              </div>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="faqSection">
          <div className="text-center mb-8 space-y-1">
            <div className="eyebrow">FREQUENTLY ASKED QUESTIONS</div>
            <h2 className="text-2xl font-bold text-white">Everything you need to know before your test</h2>
          </div>

          <div>
            {FAQS.map((faq, fIdx) => (
              <div key={fIdx} className="faqItem">
                <button
                  type="button"
                  className="faqQuestion"
                  onClick={() => setOpenFaq(openFaq === fIdx ? null : fIdx)}
                >
                  <span>{faq.q}</span>
                  {openFaq === fIdx ? <ChevronUp size={18} className="text-sky-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                {openFaq === fIdx && (
                  <div className="faqAnswer">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CLINIC & LAB LOCATION SECTION */}
        <section className="clinicDetails">
          <div className="clinicPhotoWrap">
            <img src={CLINIC_PHOTO} alt="Dr. Shastri Diagnostics" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div className="clinicCopy">
            <div className="eyebrow">FIND OUR LAB</div>
            <h2>Dr. Shastri Diagnostics</h2>
            <p>1246, Vidyanagar Colony, Ramghat Road, Aligarh, Uttar Pradesh 202001.</p>
            <p className="text-slate-400 text-xs mt-1">Near Kunjilal Food House · Opposite Vishal Mart, near Lohchab Imaging Centre.</p>
            
            <div className="clinicChips">
              <span><Microscope size={14} /> Pathology & Diagnostics</span>
              <span><MessageCircle size={14} /> Instant WhatsApp Reports</span>
              <span><Truck size={14} /> Free Home Sample Collection</span>
              <span><FlaskConical size={14} /> Advanced Hormone Panels</span>
            </div>

            <div className="clinicActions">
              <a 
                className="primaryBtn" 
                href={'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Hello Dr. Shastri Diagnostics, please confirm test availability and home collection.')} 
                target="_blank" 
                rel="noreferrer"
              >
                WhatsApp: +91 92588 88085 <ArrowRight size={16}/>
              </a>
              <a 
                className="secondaryBtn" 
                href="https://www.google.com/maps/search/?api=1&query=Dr+Shastri+Diagnostics+1246+Vidyanagar+Aligarh" 
                target="_blank" 
                rel="noreferrer"
              >
                <MapPin size={16}/> Get Directions
              </a>
              <button 
                type="button" 
                className="secondaryBtn"
                onClick={() => setPatientPortalOpen(true)}
              >
                <FileText size={16} /> Patient Report Portal
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* GLOBAL PLATFORM FOOTER */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-8 px-6 mt-16 backdrop-blur">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img src="/resources/dsd-logo.png" alt="DSD Care" className="w-7 h-7 object-contain opacity-80" onError={e => e.currentTarget.style.display = 'none'} />
            <div>
              <span className="font-semibold text-slate-200">Dr. Shastri Diagnostics (DSD Care)</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>Powered by HRGen SaaS Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Multi-Tenant SaaS Live
            </span>
            <button
              type="button"
              onClick={() => setTenantAdminOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-medium text-xs shadow-sm hover:shadow-cyan-500/20"
              title="Lab Owner Portal (Custom Test Prices, Package Rates, Flebo Fleet & Rights)"
            >
              <Building2 size={14} className="text-cyan-400" />
              <span>Tenant Admin (Lab Owner)</span>
            </button>
            <button
              type="button"
              onClick={() => setSuperAdminOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all font-medium text-xs shadow-sm hover:shadow-purple-500/20"
              title="Platform Owner SaaS Control Panel (Tenant, CMS, Universal Catalog)"
            >
              <Crown size={14} className="text-purple-400" />
              <span>Super Admin Panel</span>
            </button>
          </div>
        </div>
      </footer>

      {/* =========================================================================
         ALL FUNCTIONAL MODALS & WORKSPACES
         ========================================================================= */}

      {/* Package Detail & Inclusions Modal */}
      {detailModalOpen && (
        <PackageDetailModal
          pkg={selectedDetailPkg}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onBook={(pkg) => {
            qty(pkg.id, 1);
            setCartOpen(true);
          }}
        />
      )}

      {/* Patient Portal & Strict Report Lock Policy Modal */}
      {patientPortalOpen && (
        <PatientPortalModal 
          isOpen={patientPortalOpen}
          onClose={() => setPatientPortalOpen(false)}
          onOpenLiveTracking={() => setLiveTrackingOpen(true)}
          onOpenSmartAiReport={(id) => {
            setSmartReportBookingId(id);
            setSmartReportOpen(true);
          }}
        />
      )}

      {/* 2026 Trending Clinical AI Smart Report Modal */}
      {smartReportOpen && (
        <SmartAiReportModal
          isOpen={smartReportOpen}
          onClose={() => setSmartReportOpen(false)}
          bookingId={smartReportBookingId}
          patientName="Sunita Sharma"
          patientAge={52}
          patientGender="Female"
          onExplore3DOrgan={(organId) => {
            setSelectedOrgan(organId);
            setBreakdownDrawerOpen(true);
          }}
        />
      )}

      {/* Swiggy/Zomato Style 3D Live Phlebo Ride Tracking Modal */}
      {liveTrackingOpen && (
        <PhleboLiveTrackingModal 
          isOpen={liveTrackingOpen}
          onClose={() => setLiveTrackingOpen(false)}
          bookingRef={'DSD-2401'}
          dispatchHubId={form.hubId || preRoutedHub?.id || 'hub-ramghat'}
          locality={form.locality || 'Ramghat Road'}
          patientAddress={form.address || `${form.locality || 'Ramghat Road'}, Aligarh`}
          patientName={form.name || 'Sunita Sharma'}
          patientPhone={form.phone || '+91 98370 12345'}
          packageName={cartItems[0]?.name || 'DSD Smart Health Advance'}
        />
      )}

      {/* Staff & Field Force Multi-Role Authentication Modal */}
      {portalOpen && (
        <StaffAuthModal 
          isOpen={portalOpen}
          onClose={() => setPortalOpen(false)}
          onSuccess={(role, user) => {
            setPortalRole(role);
            setPortalUser(user.name);
            setPortalOpen(false);
            if (role === 'superadmin') {
              setSuperAdminOpen(true);
            } else if (role === 'admin') {
              setTenantAdminOpen(true);
            } else if (role === 'phlebo') {
              setPhleboWorkspaceOpen(true);
            } else if (role === 'sales') {
              setSalesWorkspaceOpen(true);
            } else {
              setOperationsOpen(true);
            }
          }}
        />
      )}

      {/* SaaS Platform Owner Super Admin Portal */}
      {superAdminOpen && (
        <SuperAdminPortal 
          isOpen={superAdminOpen}
          onClose={() => setSuperAdminOpen(false)}
          currentNavTabs={navTabs}
          onUpdateNavTabs={(updatedTabs) => {
            setNavTabs(updatedTabs);
            localStorage.setItem('hrgen-saas-nav-tabs', JSON.stringify(updatedTabs));
          }}
          onUpdateCmsSettings={(cms) => {
            if (cms.platformName) {
              document.title = `${cms.platformName} • Diagnostic SaaS Portal`;
            }
          }}
        />
      )}

      {/* Tenant Admin (Lab Owner) Dedicated Portal */}
      {tenantAdminOpen && (
        <TenantAdminWorkspace
          isOpen={tenantAdminOpen}
          onClose={() => setTenantAdminOpen(false)}
          tenantName="Dr. Shastri Diagnostics (Central Lab)"
          tenantLocation="1246, Vidyanagar Colony, Ramghat Road, Aligarh"
        />
      )}

      {/* Enterprise Operations Control Hub */}
      {operationsOpen && (
        <OperationsHub 
          onClose={() => setOperationsOpen(false)}
          initialRole={portalRole as StaffRole}
          userLabel={portalUser || 'Dr. S. K. Shastri'}
          onUpdateCatalogPrice={(id, price) => {
            setCardEdits(prev => ({
              ...prev,
              [id]: { ...(prev[id] || {}), price }
            }));
          }}
        />
      )}

      {/* Phlebotomist Field Companion Workspace */}
      {phleboWorkspaceOpen && (
        <PhleboCompanionWorkspace 
          onClose={() => setPhleboWorkspaceOpen(false)}
          collectorName={portalUser || 'Rahul Sharma'}
        />
      )}

      {/* Field Sales Officer (Doctor Visits) Workspace */}
      {salesWorkspaceOpen && (
        <SalesFieldWorkspace 
          onClose={() => setSalesWorkspaceOpen(false)}
          officerName={portalUser || 'Vikas Saxena'}
        />
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="overlay" onClick={() => setCartOpen(false)}>
          <aside className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <div>
                <small>DSD HEALTH CART</small>
                <h2>Selected Tests ({count})</h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Your cart is empty. Add a package to schedule collection.
              </div>
            ) : (
              <div className="cartList">
                {cartItems.map(t => (
                  <div className="cartLine" key={t.id}>
                    <div>
                      <b className="text-sm text-white">{t.name}</b>
                      <div className="text-xs text-slate-400">{money(cardEdits[t.id]?.price ?? t.price)} each</div>
                    </div>
                    <div className="stepper">
                      <button onClick={() => qty(t.id, -1)}>-</button>
                      <span className="font-bold text-white text-sm">{cart[t.id]}</span>
                      <button onClick={() => qty(t.id, 1)}>+</button>
                    </div>
                  </div>
                ))}

                <div className="totalRow">
                  <span>Grand Total (Free Home Visit)</span>
                  <b>{total}</b>
                </div>

                <button
                  type="button"
                  className="primary full"
                  onClick={() => {
                    setCartOpen(false);
                    setBookingOpen(true);
                  }}
                >
                  Schedule Home Collection <ArrowRight size={16} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Home Collection Booking Form Drawer */}
      {bookingOpen && (
        <div className="overlay" onClick={() => setBookingOpen(false)}>
          <aside className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <div>
                <small>FREE HOME SAMPLE COLLECTION</small>
                <h2>Patient & Address Details</h2>
              </div>
              <button onClick={() => setBookingOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* PRE-ROUTED DISPATCH HIGHLIGHT BANNER */}
            <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/80 via-cyan-950/50 to-slate-900 border border-cyan-500/30 text-xs shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Zap size={14} className="text-cyan-400 fill-cyan-400 animate-pulse" />
                  ⚡ Pre-Routed Dispatch Active
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30">
                  {preRoutedHub?.avgArrivalMins || 25} Min Doorstep
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1 border-t border-cyan-500/20">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Assigned Hub:</span>
                  <span className="text-white font-semibold truncate block">{form.hub || preRoutedHub?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Lead Phlebo:</span>
                  <span className="text-sky-300 font-semibold flex items-center gap-1">
                    👤 {preRoutedHub?.leadPhlebo || 'Rahul Sharma'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                <ThermometerSnowflake size={13} className="shrink-0" />
                <span className="font-medium">❄️ 100% Cold-Chain Monitored (3.8°C Target Active)</span>
              </div>
            </div>

            <form onSubmit={e => { e.preventDefault(); whatsapp(); }}>
              <label>
                Full Name
                <input
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label>
                WhatsApp Mobile Number
                <input
                  required
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </label>

              <label>
                Select Aligarh Locality & Dispatch Hub
                <select
                  value={form.locality}
                  onChange={e => {
                    const locVal = e.target.value;
                    const matchedHub = ALIGARH_HUBS.find(h => 
                      h.coverageAreas.some(a => a.toLowerCase() === locVal.toLowerCase() || locVal.toLowerCase().includes(a.toLowerCase()))
                    ) || ALIGARH_HUBS[0];
                    setPreRoutedHub(matchedHub);
                    setForm(prev => ({
                      ...prev,
                      locality: locVal,
                      hub: matchedHub.name,
                      hubId: matchedHub.id
                    }));
                  }}
                >
                  {ALIGARH_HUBS.map(h => (
                    <optgroup key={h.id} label={`${h.name} (${h.avgArrivalMins} min Express)`}>
                      {h.coverageAreas.map(area => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <optgroup label="Other Locations">
                    <option value="Other Aligarh Location">Other Aligarh Location (Doorstep Covered)</option>
                  </optgroup>
                </select>
              </label>

              <div className="mb-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Assigned Dispatch Hub:</span>
                <span className="text-sky-300 font-bold truncate max-w-[200px]">{form.hub}</span>
              </div>

              <label>
                Complete Address & Landmark in Aligarh
                <textarea
                  required
                  rows={3}
                  placeholder="House number, colony, landmark…"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </label>

              <button 
                type="button" 
                onClick={locate} 
                className="secondaryBtn w-full justify-center mb-4 text-xs"
              >
                <MapPin size={16} /> {loc ? 'GPS Location Attached ✓' : 'Attach Live GPS Location'}
              </button>
              {locMsg && <p className="text-xs text-sky-400 -mt-2 mb-3">{locMsg}</p>}

              {/* PHASE 5: Visual Fasting Slot Selector */}
              <div className="mb-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Clock3 size={13} className="text-amber-400" />
                  Preferred Collection Slot
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/20">Select Morning Fasting Slot</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { slot: 'Tomorrow, 6:00–7:00 AM (Fasting)', label: '6:00–7:00 AM', tag: 'Recommended for Sugar & Lipid', fasting: true, color: 'emerald' },
                    { slot: 'Tomorrow, 7:00–8:00 AM (Fasting)', label: '7:00–8:00 AM', tag: 'Peak Fasting Window', fasting: true, color: 'emerald' },
                    { slot: 'Tomorrow, 8:00–9:00 AM (Fasting)', label: '8:00–9:00 AM', tag: 'CBC & General Panels', fasting: true, color: 'sky' },
                    { slot: 'Tomorrow, 9:00–10:30 AM (Post-Prandial)', label: '9:00–10:30 AM', tag: 'Post-Prandial / Non-fasting', fasting: false, color: 'slate' },
                  ].map(({ slot, label, tag, fasting, color }) => {
                    const isSelected = form.slot === slot;
                    const borderCls = isSelected
                      ? (color === 'emerald' ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200' : color === 'sky' ? 'border-sky-400 bg-sky-500/15 text-sky-200' : 'border-slate-500 bg-slate-700/40 text-slate-200')
                      : 'border-slate-700/60 bg-slate-900/70 text-slate-400 hover:border-slate-500 hover:text-slate-200';
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setForm({ ...form, slot })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${borderCls}`}
                      >
                        <div className="font-bold text-[12px] font-mono">{label}</div>
                        <div className="text-[10px] mt-0.5 opacity-80">{tag}</div>
                        {fasting && (
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/25 font-mono font-bold">
                            ☕ FASTING REQUIRED
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* OTP & Cold Chain Assurance strip */}
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/25 text-[10.5px] text-cyan-200 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold"><ShieldCheck size={12} className="text-cyan-400" /> FlaboTrack Phlebotomist Checklist on Arrival:</div>
                  <div className="text-slate-400 pl-4 space-y-0.5">
                    <div>✓ 4-digit Patient Collection OTP verification</div>
                    <div>✓ Sterile single-use BD Vacutainer kit (sealed)</div>
                    <div>✓ Cold-chain insulated box (2°C–8°C) with digital sensor</div>
                  </div>
                </div>
              </div>

              <button className="primary full mt-2" type="submit">
                Confirm Booking on WhatsApp ({total}) <ArrowRight size={16} />
              </button>
            </form>
          </aside>
        </div>
      )}

      {/* WhatsApp Floating Chatbot */}
      <div className="dsdChat">
        <button 
          type="button" 
          className="dsdChatLauncher" 
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageCircle size={20} />
          <span>Chat with Lab</span>
        </button>

        {chatOpen && (
          <section className="dsdChatPanel">
            <header>
              <div>
                <b>DSD Care Assistant</b>
                <div className="text-[10px] text-emerald-400">Online · Aligarh Lab Team</div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </header>

            <div className="dsdChatMessages">
              {chatMessages.map((m, i) => (
                <div key={i} className={`dsdChatMessage ${m.from}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={sendChat}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about tests, fasting, rates…"
              />
              <button type="submit"><ArrowRight size={16} /></button>
            </form>
          </section>
        )}
      </div>

      {/* 3D Organ Constituent Test Breakdown Drawer */}
      <OrganTestBreakdownDrawer
        isOpen={breakdownDrawerOpen}
        onClose={() => setBreakdownDrawerOpen(false)}
        packageData={activeBreakdownPkg}
        organId={selectedOrgan}
        onAddToCart={(pkg) => {
          qty(pkg.id, 1);
          setCartOpen(true);
        }}
      />

      {/* 2026 SPATIAL MOBILE BOTTOM DOCK BAR (VISIBLE UNDER 1024PX) */}
      <nav 
        className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900/90 border border-slate-700/80 backdrop-blur-2xl rounded-2xl p-1.5 shadow-2xl shadow-cyan-950/60 flex items-center justify-around text-[10.5px] font-bold text-slate-300"
        aria-label="Mobile Navigation Dock"
      >
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Microscope size={18} className="text-cyan-400" />
          <span>Atlas</span>
        </button>

        <button
          type="button"
          onClick={() => setSmartReportOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-md transition-all active:scale-95"
        >
          <Sparkles size={18} className="text-cyan-400 animate-pulse" />
          <span>2026 AI</span>
        </button>

        <button
          type="button"
          onClick={() => setLiveTrackingOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Bike size={18} className="text-emerald-400" />
          <span>Track 3D</span>
        </button>

        <button
          type="button"
          onClick={() => setPatientPortalOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <FileText size={18} className="text-sky-400" />
          <span>Reports</span>
        </button>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ShoppingBag size={18} className="text-amber-400" />
          <span>Cart</span>
          {count > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </nav>

    </div>
  );
}
