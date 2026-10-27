/**
 * HRGen GIA LIMS — Autonomous AI Diagnostic Copilot & Anomaly Detection
 * Standard: 2026 Clinical Intelligence & GAMP 5 Human-In-The-Loop
 * Non-Clinical Sandbox: Bilingual explanations and voice-dictation drafts only.
 * Hard constraint: AI never approves QC, releases reports, or overrides clinical gates.
 */

const { GoogleGenAI, Type } = require('@google/genai');

function detectRuleAnomalies(tests = [], patient = {}, specimen = {}){
  const testMap = new Map();
  for(const t of tests){
    const c = String(t.code||'').toUpperCase();
    const val = parseFloat(t.value);
    testMap.set(c, { ...t, numVal: Number.isFinite(val) ? val : null });
  }

  const anomalies = [];

  // 1. Potassium + Hemolysis Contradiction
  const k = testMap.get('K') ?? testMap.get('POTASSIUM');
  if(k && k.numVal !== null && k.numVal > 5.3){
    const isHemolyzed = specimen.reason === 'HEMOLYSIS' || String(specimen.notes||'').toUpperCase().includes('HEMOL');
    if(isHemolyzed){
      anomalies.push({
        type: 'PSEUDOHYPERKALEMIA_RISK',
        severity: 'HIGH',
        message: 'Elevated Potassium (K+) detected in a hemolyzed specimen. Risk of in-vitro RBC lysis pseudohyperkalemia.',
        recommendation: 'Request recollection before clinical intervention for hyperkalemia.'
      });
    }
  }

  // 2. Glucose vs HbA1c Discrepancy
  const fbs = testMap.get('FBS') ?? testMap.get('GLUCOSE') ?? testMap.get('GLU');
  const hba1c = testMap.get('HBA1C');
  if(fbs && fbs.numVal !== null && hba1c && hba1c.numVal !== null){
    if(fbs.numVal > 180 && hba1c.numVal < 5.7){
      anomalies.push({
        type: 'GLUCOSE_HBA1C_DISCORDANCE',
        severity: 'MEDIUM',
        message: 'Acute hyperglycemia (FBS > 180 mg/dL) with normal chronic HbA1c (< 5.7%).',
        recommendation: 'Correlate with acute stress, corticosteroid intake, or verify fasting compliance.'
      });
    } else if(fbs.numVal < 90 && hba1c.numVal > 8.5){
      anomalies.push({
        type: 'GLUCOSE_HBA1C_DISCORDANCE',
        severity: 'MEDIUM',
        message: 'Euglycemic presentation with significantly elevated chronic glycemic index (HbA1c > 8.5%).',
        recommendation: 'Review patient medication timing or recent hypoglycemic episodes.'
      });
    }
  }

  // 3. Critical Anemia / Panic Hemoglobin
  const hb = testMap.get('HB') ?? testMap.get('HEMOGLOBIN');
  if(hb && hb.numVal !== null && hb.numVal < 7.0){
    anomalies.push({
      type: 'CRITICAL_PANIC_ANEMIA',
      severity: 'CRITICAL',
      message: `Critically low Hemoglobin observed (${hb.numVal} g/dL). High risk of hemodynamic instability.`,
      recommendation: 'Immediate pathologist validation, critical communication logging, and urgent clinician alert required.'
    });
  }

  // 4. Acute / Chronic Renal Impairment
  const creat = testMap.get('CREAT') ?? testMap.get('CREATININE');
  const egfr = testMap.get('EGFR');
  if(creat && creat.numVal !== null && creat.numVal >= 2.0){
    anomalies.push({
      type: 'RENAL_FUNCTION_IMPAIRMENT',
      severity: 'HIGH',
      message: `Serum Creatinine elevated at ${creat.numVal} mg/dL (eGFR: ${egfr?.value || 'Reduced'}).`,
      recommendation: 'Evaluate urine microalbumin/protein, check prior historical baseline, and review nephrotoxic medications.'
    });
  }

  // 5. Hepatic Transaminase Inversion (AST / ALT)
  const ast = testMap.get('SGOT') ?? testMap.get('AST');
  const alt = testMap.get('SGPT') ?? testMap.get('ALT');
  if(ast && ast.numVal !== null && alt && alt.numVal !== null){
    if(ast.numVal > 120 || alt.numVal > 120){
      const deRitisRatio = alt.numVal > 0 ? (ast.numVal / alt.numVal).toFixed(2) : 'N/A';
      anomalies.push({
        type: 'HEPATIC_ENZYME_ELEVATION',
        severity: 'MEDIUM',
        message: `Marked transaminase elevation (AST: ${ast.numVal}, ALT: ${alt.numVal}; De Ritis Ratio: ${deRitisRatio}).`,
        recommendation: 'Correlate with viral hepatitis markers, alcohol history, or drug-induced liver injury.'
      });
    }
  }

  return anomalies;
}

/**
 * Synthesizes bilingual patient explanation and pathologist notes
 */
function buildFallbackSummaries(anomalies = [], tests = [], patient = {}){
  const pName = patient.name || 'Patient';
  const hasCritical = anomalies.some(a => a.severity === 'CRITICAL');
  const hasHigh = anomalies.some(a => a.severity === 'HIGH');

  let pathologistNote = `Laboratory investigation review for ${pName}. Total tests evaluated: ${tests.length}. `;
  if(anomalies.length === 0){
    pathologistNote += 'No major inter-analyte physiological discrepancies detected. Routine clinical correlation advised.';
  } else {
    pathologistNote += `Detected ${anomalies.length} clinical observation(s): ` + anomalies.map(a => `[${a.type}] ${a.message}`).join(' ');
  }

  let hindiSummary = '';
  let englishSummary = '';

  if(hasCritical){
    hindiSummary = `चेतावनी: आपकी जांच में कुछ मान आपातकालीन स्तर पर हैं। कृपया तुरंत अपने डॉक्टर से संपर्क करें।`;
    englishSummary = `ALERT: Critical values observed in your laboratory tests. Please consult your physician immediately.`;
  } else if(hasHigh){
    hindiSummary = `आपकी रिपोर्ट में कुछ महत्वपूर्ण जांच परिणाम सामान्य सीमा से बाहर हैं। डॉक्टर से परामर्श लें।`;
    englishSummary = `Some key investigation parameters are outside the reference interval. Clinical consultation recommended.`;
  } else {
    hindiSummary = `आपकी अधिकतर जांच रिपोर्ट सामान्य सीमा में प्रतीत होती हैं। किसी भी प्रश्न के लिए अपने चिकित्सक से परामर्श लें।`;
    englishSummary = `Your routine laboratory investigation parameters appear stable. Please review with your doctor for clinical advice.`;
  }

  return { pathologistNote, hindiSummary, englishSummary };
}

/**
 * Main evaluation entry point - Non-Clinical Copilot Sandbox
 */
async function evaluateCopilot(order = {}, patient = {}){
  const tests = order.tests || [];
  const specimen = order.specimen || {};
  const anomalies = detectRuleAnomalies(tests, patient, specimen);
  const summaries = buildFallbackSummaries(anomalies, tests, patient);

  let aiModelUsed = 'GIA-CLINICAL-RULE-ENGINE';
  let llmEnrichment = null;

  if(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10){
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Act as a senior pathologist clinical decision support assistant in a non-clinical draft sandbox. Review these lab results:
Patient: ${patient.name || 'Anonymous'}, Age: ${patient.age || 'Unknown'}, Gender: ${patient.gender || 'Unknown'}
Tests: ${JSON.stringify(tests.map(t => ({ code: t.code, name: t.name, value: t.value, unit: t.unit, status: t.status })))}
Rule anomalies found: ${JSON.stringify(anomalies)}

Respond strictly in valid JSON adhering to the schema. Include a professional differential observation for the reviewing pathologist, along with compassionate patient guidance in both simple Hindi and English.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              differentialInsight: {
                type: Type.STRING,
                description: '2-3 sentences of clinical observation for the reviewing pathologist'
              },
              patientExplanationHindi: {
                type: Type.STRING,
                description: 'Simple, compassionate explanation in Hindi for the patient'
              },
              patientExplanationEnglish: {
                type: Type.STRING,
                description: 'Simple, compassionate explanation in English for the patient'
              },
              riskLevel: {
                type: Type.STRING,
                enum: ['NORMAL', 'MONITOR', 'CRITICAL'],
                description: 'Clinical priority level'
              }
            },
            required: ['differentialInsight', 'patientExplanationHindi', 'patientExplanationEnglish', 'riskLevel']
          }
        }
      });

      if (response && response.text) {
        llmEnrichment = JSON.parse(response.text);
        aiModelUsed = 'gemini-2.5-flash';
      }
    } catch(err){
      // Graceful fallback to rule engine without throwing 500
      aiModelUsed = 'GIA-CLINICAL-RULE-ENGINE (FALLBACK)';
    }
  }

  return {
    orderId: order.id,
    evaluatedAt: new Date().toISOString(),
    aiModel: aiModelUsed,
    humanReviewRequired: true,
    clinicalGateStatus: 'NON_CLINICAL_DRAFT_ONLY',
    canApproveQC: false,
    canReleaseReport: false,
    anomaliesCount: anomalies.length,
    anomalies,
    pathologistReview: llmEnrichment?.differentialInsight || summaries.pathologistNote,
    patientExplanation: {
      hindi: llmEnrichment?.patientExplanationHindi || summaries.hindiSummary,
      english: llmEnrichment?.patientExplanationEnglish || summaries.englishSummary
    },
    riskLevel: llmEnrichment?.riskLevel || (anomalies.some(a => a.severity === 'CRITICAL') ? 'CRITICAL' : anomalies.some(a => a.severity === 'HIGH') ? 'MONITOR' : 'NORMAL')
  };
}

/**
 * Non-clinical voice dictation draft generator using @google/genai structured outputs
 */
async function generateDictationDraft(transcript = '', catalog = []) {
  const normText = String(transcript || '').trim();
  let aiModelUsed = 'GIA-DICTATION-REGEX-ENGINE';
  let draftedResults = null;

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Extract laboratory test observations from this voice dictation transcript in a non-clinical draft mode:
Transcript: "${normText}"
Available Lab Test Codes: ${JSON.stringify(catalog.map(c => ({ code: c.code, name: c.name, unit: c.unit })))}

Respond in valid JSON adhering to the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              extractedObservations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    testCode: { type: Type.STRING },
                    numericValue: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    morphologyNote: { type: Type.STRING }
                  },
                  required: ['testCode', 'numericValue']
                }
              }
            },
            required: ['extractedObservations']
          }
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        draftedResults = parsed.extractedObservations;
        aiModelUsed = 'gemini-2.5-flash';
      }
    } catch (err) {
      // Graceful fallback to regex normalization
    }
  }

  // Fallback if LLM is offline or not configured
  if (!draftedResults) {
    const aliases = {
      'HEMOGLOBIN':'HB','HAEMOGLOBIN':'HB','HB':'HB','SUGAR':'FBS','GLUCOSE':'FBS','FASTING SUGAR':'FBS',
      'TLC':'WBC','TOTAL LEUKOCYTE':'WBC','WBC':'WBC','PLATELET':'PLT','PLATELETS':'PLT','PLT':'PLT',
      'CREATININE':'CREAT','CREAT':'CREAT','UREA':'UREA','BUN':'BUN','URIC ACID':'URIC_ACID',
      'BILIRUBIN':'BILI_TOTAL','TOTAL BILIRUBIN':'BILI_TOTAL','CHOLESTEROL':'CHOL','LIPID':'CHOL'
    };
    let norm = normText.toLowerCase()
      .replace(/\b(point|dashamlav)\b/g, '.')
      .replace(/\bshunya\b/g, '0').replace(/\bek\b/g, '1').replace(/\bdo\b/g, '2').replace(/\bteen\b/g, '3')
      .replace(/\bchar\b/g, '4').replace(/\bpaanch\b/g, '5').replace(/\bchhe\b/g, '6').replace(/\bsaat\b/g, '7')
      .replace(/\baath\b/g, '8').replace(/\bnau\b/g, '9').replace(/\bdas\b/g, '10').replace(/\bgyarah\b/g, '11')
      .replace(/\bbaarah\b/g, '12').replace(/\bterah\b/g, '13').replace(/\bchaudah\b/g, '14').replace(/\bpandrah\b/g, '15')
      .replace(/\b(1\s+sau\s+bis|sau\s+bis|ek\s+sau\s+bis)\b/g, '120')
      .replace(/\b(1\s+sau\s+das|sau\s+das|ek\s+sau\s+das)\b/g, '110')
      .replace(/\b(1\s+sau|sau|ek\s+sau)\b/g, '100');

    // Collapse spaces around decimal dot between digits
    norm = norm.replace(/(\d+)\s*\.\s*(\d+)/g, (match, p1, p2) => p1 + '.' + p2);

    draftedResults = [];
    for (const m of norm.matchAll(/([A-Za-z][A-Za-z0-9_-]{0,20})\s*[:=]?\s*(-?\d+(?:\.\d+)?)/g)) {
      const raw = m[1].toUpperCase(), n = Number(m[2]);
      const mappedCode = aliases[raw] || raw;
      const item = catalog.find(x => x.code === mappedCode || x.code === raw || (x.name && x.name.toUpperCase().startsWith(raw)));
      draftedResults.push({
        testCode: item ? item.code : mappedCode,
        numericValue: n,
        unit: item ? item.unit : '',
        morphologyNote: ''
      });
    }
  }

  return {
    rawTranscript: normText,
    aiModelUsed,
    humanReviewRequired: true,
    confirmationRequiredBeforeSave: true,
    clinicalGateStatus: 'NON_CLINICAL_DRAFT_ONLY',
    canApproveQC: false,
    canReleaseReport: false,
    draftObservations: draftedResults
  };
}

module.exports = {
  detectRuleAnomalies,
  buildFallbackSummaries,
  evaluateCopilot,
  generateDictationDraft
};

