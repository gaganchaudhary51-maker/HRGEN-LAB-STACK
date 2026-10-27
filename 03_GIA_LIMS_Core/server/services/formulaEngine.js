const OPS = {'+':1,'-':1,'*':2,'/':2};
function tokenize(expr){return String(expr||'').replace(/\s+/g,'').match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/]/g)||[];}
function toRpn(expr){const out=[],stack=[];for(const t of tokenize(expr)){if(/^[A-Za-z_]|^\d/.test(t))out.push(t);else if(t==='(')stack.push(t);else if(t===')'){while(stack.length&&stack.at(-1)!=='(')out.push(stack.pop());if(stack.pop()!=='(')throw new Error('Unbalanced parentheses');}else if(OPS[t]){while(stack.length&&OPS[stack.at(-1)]>=OPS[t])out.push(stack.pop());stack.push(t);}else throw new Error('Unsupported token');}while(stack.length){const x=stack.pop();if(x==='(')throw new Error('Unbalanced parentheses');out.push(x);}return out;}
function evaluate(expr,vars={}){const s=[];for(const t of toRpn(expr)){if(OPS[t]){if(s.length<2)throw new Error('Invalid expression');const b=s.pop(),a=s.pop();s.push(t==='+'?a+b:t==='-'?a-b:t==='*'?a*b:a/b);}else if(/^\d/.test(t))s.push(Number(t));else{const v=Number(vars[t]);if(!Number.isFinite(v))throw new Error(`Missing numeric variable: ${t}`);s.push(v);}}if(s.length!==1||!Number.isFinite(s[0]))throw new Error('Invalid formula result');return s[0];}
function validate(expr,variables=[]){try{toRpn(expr);for(const v of variables){} evaluate(expr,Object.fromEntries(variables.map(v=>[v,1])));return {valid:true};}catch(e){return {valid:false,error:e.message};}}

// 2026 CLINICAL FORMULA AUTO-DERIVATION ENGINES

/**
 * CKD-EPI 2021 eGFR (Estimated Glomerular Filtration Rate) without race coefficient
 * @param {number} creatinine Serum Creatinine (mg/dL)
 * @param {number} age Age in years
 * @param {string} gender 'Male' or 'Female'
 */
function calculateEGFR({ creatinine, age, gender }){
  const scr = Number(creatinine), a = Number(age);
  if(!Number.isFinite(scr) || scr <= 0 || !Number.isFinite(a) || a <= 0) return null;
  const isFemale = String(gender||'').toLowerCase().startsWith('f');
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const genderFactor = isFemale ? 1.012 : 1.0;
  const minRatio = Math.min(scr / kappa, 1);
  const maxRatio = Math.max(scr / kappa, 1);
  const egfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, a) * genderFactor;
  return Number(egfr.toFixed(1));
}

/**
 * Friedewald equation for Lipid Panel fractions
 */
function calculateLipidFractions({ totalChol, hdl, triglycerides }){
  const tc = Number(totalChol), h = Number(hdl), tg = Number(triglycerides);
  const out = {};
  if(Number.isFinite(tg) && tg > 0){
    out.vldl = Number((tg / 5).toFixed(1));
  }
  if(Number.isFinite(tc) && Number.isFinite(h) && Number.isFinite(tg)){
    if(tg < 400){
      out.ldl = Number((tc - h - (tg / 5)).toFixed(1));
    }
  }
  if(Number.isFinite(tc) && Number.isFinite(h) && h > 0){
    out.cholHdlRatio = Number((tc / h).toFixed(2));
  }
  return out;
}

/**
 * FIB-4 Index for Liver Fibrosis Risk
 */
function calculateFIB4({ age, ast, alt, platelets }){
  const a = Number(age), s = Number(ast), l = Number(alt), p = Number(platelets);
  if(!Number.isFinite(a) || a <= 0 || !Number.isFinite(s) || s <= 0 || !Number.isFinite(l) || l <= 0 || !Number.isFinite(p) || p <= 0) return null;
  const fib4 = (a * s) / (p * Math.sqrt(l));
  return Number(fib4.toFixed(2));
}

/**
 * Reactive pipeline: takes current tests and patient, derives any missing computed values
 */
function deriveCalculatedTests(tests = [], patient = {}){
  const testMap = new Map();
  for(const t of tests){
    const c = String(t.code||'').toUpperCase();
    testMap.set(c, t);
  }

  const getVal = (code) => {
    const t = testMap.get(code.toUpperCase());
    if(!t) return null;
    const n = parseFloat(t.value);
    return Number.isFinite(n) ? n : null;
  };

  const patientAge = Number(patient.ageExact?.years ?? patient.age ?? 40);
  const patientGender = patient.gender || 'Unspecified';

  // 1. eGFR Auto-Derivation from Creatinine
  const creat = getVal('CREAT') ?? getVal('CREATININE') ?? getVal('KFT_CREAT');
  if(creat !== null){
    const egfrVal = calculateEGFR({ creatinine: creat, age: patientAge, gender: patientGender });
    if(egfrVal !== null){
      let egfrTest = testMap.get('EGFR');
      if(!egfrTest){
        egfrTest = { code: 'EGFR', name: 'Estimated GFR (CKD-EPI 2021)', unit: 'mL/min/1.73m²', reference: '> 60.0', department: 'Biochemistry' };
        tests.push(egfrTest);
        testMap.set('EGFR', egfrTest);
      }
      egfrTest.value = String(egfrVal);
      egfrTest.status = egfrVal >= 60 ? 'Normal' : egfrVal >= 30 ? 'Low' : 'Critical';
      egfrTest.method = 'CKD-EPI 2021 Formula';
      egfrTest.isAutoDerived = true;
    }
  }

  // 2. Lipid Fractions Auto-Derivation (LDL, VLDL, Ratio)
  const tc = getVal('CHOL') ?? getVal('TOTAL_CHOL') ?? getVal('CHOLESTEROL');
  const hdl = getVal('HDL') ?? getVal('HDL_CHOL');
  const tg = getVal('TG') ?? getVal('TRIGLYCERIDES');
  if(tc !== null || hdl !== null || tg !== null){
    const lipid = calculateLipidFractions({ totalChol: tc, hdl, triglycerides: tg });
    if(lipid.vldl !== undefined){
      let vldlTest = testMap.get('VLDL');
      if(!vldlTest){
        vldlTest = { code: 'VLDL', name: 'VLDL Cholesterol', unit: 'mg/dL', reference: '2.0 - 30.0', department: 'Lipid Profile' };
        tests.push(vldlTest);
        testMap.set('VLDL', vldlTest);
      }
      vldlTest.value = String(lipid.vldl);
      vldlTest.status = lipid.vldl <= 30 ? 'Normal' : 'High';
      vldlTest.method = 'Friedewald Formula (TG/5)';
      vldlTest.isAutoDerived = true;
    }
    if(lipid.ldl !== undefined){
      let ldlTest = testMap.get('LDL') ?? testMap.get('LDL_CHOL');
      if(!ldlTest){
        ldlTest = { code: 'LDL', name: 'LDL Cholesterol (Calculated)', unit: 'mg/dL', reference: '< 100.0', department: 'Lipid Profile' };
        tests.push(ldlTest);
        testMap.set('LDL', ldlTest);
      }
      ldlTest.value = String(lipid.ldl);
      ldlTest.status = lipid.ldl < 100 ? 'Normal' : lipid.ldl < 130 ? 'Normal' : 'High';
      ldlTest.method = 'Friedewald Formula';
      ldlTest.isAutoDerived = true;
    }
    if(lipid.cholHdlRatio !== undefined){
      let ratioTest = testMap.get('CHOL_HDL_RATIO');
      if(!ratioTest){
        ratioTest = { code: 'CHOL_HDL_RATIO', name: 'Cholesterol / HDL Ratio', unit: 'Ratio', reference: '< 4.5', department: 'Lipid Profile' };
        tests.push(ratioTest);
        testMap.set('CHOL_HDL_RATIO', ratioTest);
      }
      ratioTest.value = String(lipid.cholHdlRatio);
      ratioTest.status = lipid.cholHdlRatio <= 4.5 ? 'Normal' : 'High';
      ratioTest.method = 'Calculated Ratio (Total/HDL)';
      ratioTest.isAutoDerived = true;
    }
  }

  // 3. Indirect Bilirubin Auto-Derivation (ISO 15189 traceability)
  const bilT = getVal('BIL-T') ?? getVal('BILIRUBIN_TOTAL') ?? getVal('TOTAL_BILIRUBIN') ?? getVal('BILT') ?? getVal('T_BIL');
  const bilD = getVal('BIL-D') ?? getVal('BILIRUBIN_DIRECT') ?? getVal('DIRECT_BILIRUBIN') ?? getVal('BILD') ?? getVal('D_BIL');
  if(bilT !== null && bilD !== null){
    const bilI = Number(Math.max(0, bilT - bilD).toFixed(2));
    let indTest = testMap.get('BIL-I');
    if(!indTest){
      indTest = { code:'BIL-I', name:'Indirect Bilirubin (Calculated)', unit:'mg/dL', reference:'0.10 - 0.80', department:'Liver Function Tests' };
      tests.push(indTest); testMap.set('BIL-I', indTest);
    }
    indTest.value = String(bilI);
    indTest.status = bilI <= 0.80 ? 'Normal' : bilI <= 1.20 ? 'High' : 'Critical';
    indTest.method = 'Calculated (Total − Direct Bilirubin)';
    indTest.isAutoDerived = true;
  }

  // 4. FIB-4 Liver Fibrosis Index Auto-Derivation
  const astVal = getVal('AST') ?? getVal('SGOT') ?? getVal('AST_SGOT');
  const altVal = getVal('ALT') ?? getVal('SGPT') ?? getVal('ALT_SGPT');
  const pltVal = getVal('PLT') ?? getVal('PLATELETS') ?? getVal('PLT_COUNT');
  if(astVal !== null && altVal !== null && pltVal !== null && patientAge > 0){
    const fib4 = calculateFIB4({ age: patientAge, ast: astVal, alt: altVal, platelets: pltVal });
    if(fib4 !== null){
      let fibTest = testMap.get('FIB4');
      if(!fibTest){
        fibTest = { code:'FIB4', name:'FIB-4 Index (Liver Fibrosis Risk)', unit:'Index', reference:'< 1.30', department:'Liver Function Tests' };
        tests.push(fibTest); testMap.set('FIB4', fibTest);
      }
      fibTest.value = String(fib4);
      fibTest.status = fib4 < 1.30 ? 'Normal' : fib4 < 2.67 ? 'Indeterminate (Grey Zone)' : 'High Risk (Advanced Fibrosis)';
      fibTest.method = 'FIB-4 Formula: (Age × AST) / (Platelets × √ALT)';
      fibTest.isAutoDerived = true;
    }
  }

  return tests;
}

module.exports = {
  tokenize, toRpn, evaluate, validate,
  calculateEGFR, calculateLipidFractions, calculateFIB4, deriveCalculatedTests
};
