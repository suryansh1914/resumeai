// ======= CONFIG =======
const BACKEND_URL = '/api/generate';

// ======= SUPABASE =======
const SUPA_URL = 'https://fcjtdngwgdmokdjctglt.supabase.co';
const SUPA_KEY = 'sb_publishable_DCJ0v-_vROz0wEYH0KNBZQ_ghis05OD';
const cookieStorage = {
  getItem: (k) => { const v = document.cookie.split('; ').find(r => r.startsWith(k+'=')); return v ? decodeURIComponent(v.split('=')[1]) : null; },
  setItem: (k, v) => document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=31536000; SameSite=Lax; Secure`,
  removeItem: (k) => document.cookie = `${k}=; path=/; max-age=0; SameSite=Lax; Secure`
};
const supabase = window.supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { storage: cookieStorage } });
let _currentUser = null;
supabase.auth.getSession().then(({ data: { session } }) => {
  _currentUser = session?.user || null;
});

// ======= STATE =======
const S = {
  step: 0,
  apiKey: '',
  eduCount: 0,
  expCount: 0,
  projCount: 0,
  techSkills: [],
  softSkills: [],
  generated: null
};

// ======= INIT =======
window.addEventListener('DOMContentLoaded', () => {
  S.step = 1;
  
  const prefillStr = sessionStorage.getItem('resume_prefill');
  if (prefillStr) {
    try {
      const d = JSON.parse(prefillStr);
      document.getElementById('p-name').value = d.name || '';
      document.getElementById('p-email').value = d.email || '';
      document.getElementById('p-phone').value = d.phone || '';
      document.getElementById('p-loc').value = d.location || '';
      document.getElementById('p-linkedin').value = d.linkedin || '';
      document.getElementById('p-github').value = d.github || '';
      document.getElementById('p-portfolio').value = d.portfolio || '';
      document.getElementById('p-role').value = d.role || '';
      
      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      
      (d.education || []).forEach(e => {
        addEdu();
        setVal('edu-uni-' + S.eduCount, e.university);
        setVal('edu-deg-' + S.eduCount, e.degree);
        setVal('edu-major-' + S.eduCount, e.major);
        setVal('edu-year-' + S.eduCount, e.year);
        setVal('edu-gpa-' + S.eduCount, e.gpa);
        setVal('edu-courses-' + S.eduCount, e.courses);
      });
      
      (d.experience || []).forEach(e => {
        addExp();
        setVal('exp-co-' + S.expCount, e.company);
        setVal('exp-role-' + S.expCount, e.role);
        setVal('exp-start-' + S.expCount, e.start);
        setVal('exp-end-' + S.expCount, e.end);
        setVal('exp-desc-' + S.expCount, e.desc || (e.bullets ? e.bullets.join('\\n') : ''));
      });
      
      (d.projects || []).forEach(p => {
        addProj();
        setVal('proj-name-' + S.projCount, p.name);
        setVal('proj-tech-' + S.projCount, p.tech);
        setVal('proj-gh-' + S.projCount, p.github);
        setVal('proj-live-' + S.projCount, p.live);
        setVal('proj-desc-' + S.projCount, p.desc || (p.bullets ? p.bullets.join('\\n') : ''));
      });
      
      (d.techSkills || []).forEach(s => {
        document.getElementById('tech-inp').value = s;
        addSkill({key: 'Enter', preventDefault: ()=>{}}, 'tech');
      });
      (d.softSkills || []).forEach(s => {
        document.getElementById('soft-inp').value = s;
        addSkill({key: 'Enter', preventDefault: ()=>{}}, 'soft');
      });
      
      sessionStorage.removeItem('resume_prefill');
    } catch(e) {
      console.error(e);
      addEdu(); addExp(); addProj();
    }
  } else {
    addEdu(); addExp(); addProj();
  }
  
  updatePreview();
  setInterval(updatePreview, 2000);
});

// ======= NAVIGATION =======
function goStep(n) {
  document.querySelectorAll('.fstep').forEach(s => s.classList.remove('active'));
  document.getElementById('step-' + n).classList.add('active');
  document.querySelectorAll('.ps').forEach(p => {
    const ps = parseInt(p.dataset.step);
    p.classList.remove('active');
    if (ps === n) p.classList.add('active');
  });
  S.step = n;
}

function nextStep() { if (S.step < 6) goStep(S.step + 1); }
function prevStep() { if (S.step > 1) goStep(S.step - 1); }

function markStep(n, state) {
  const el = document.querySelector(`.ps[data-step="${n}"]`);
  if (!el) return;
  el.classList.remove('active', 'done');
  el.classList.add(state);
  if (state === 'done') el.querySelector('.ps-num').innerHTML = '✓';
}



// ======= EDUCATION =======
function addEdu() {
  const id = ++S.eduCount;
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.id = 'edu-' + id;
  div.innerHTML = `
    <div class="ec-hdr"><span class="ec-title">🎓 Education ${id}</span><button class="rm-btn" onclick="removeEntry('edu-${id}')">✕</button></div>
    <div class="fgrid">
      <div class="fg fw"><label class="label">University / College *</label><input type="text" class="inp" id="edu-uni-${id}" placeholder="IIT Delhi"></div>
      <div class="fg"><label class="label">Degree *</label><input type="text" class="inp" id="edu-deg-${id}" placeholder="B.Tech"></div>
      <div class="fg"><label class="label">Major</label><input type="text" class="inp" id="edu-major-${id}" placeholder="Computer Science"></div>
      <div class="fg"><label class="label">Graduation Year</label><input type="text" class="inp" id="edu-year-${id}" placeholder="2025"></div>
      <div class="fg"><label class="label">CGPA / Percentage</label><input type="text" class="inp" id="edu-gpa-${id}" placeholder="8.5 / 10"></div>
      <div class="fg fw"><label class="label">Relevant Coursework</label><input type="text" class="inp" id="edu-courses-${id}" placeholder="DSA, OS, DBMS, Computer Networks"></div>
    </div>`;
  document.getElementById('edu-list').appendChild(div);
}

// ======= EXPERIENCE =======
function addExp() {
  const id = ++S.expCount;
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.id = 'exp-' + id;
  div.innerHTML = `
    <div class="ec-hdr"><span class="ec-title">💼 Experience ${id}</span><button class="rm-btn" onclick="removeEntry('exp-${id}')">✕</button></div>
    <div class="fgrid">
      <div class="fg"><label class="label">Company *</label><input type="text" class="inp" id="exp-co-${id}" placeholder="Google"></div>
      <div class="fg"><label class="label">Role *</label><input type="text" class="inp" id="exp-role-${id}" placeholder="SWE Intern"></div>
      <div class="fg"><label class="label">Start Date</label><input type="text" class="inp" id="exp-start-${id}" placeholder="Jun 2024"></div>
      <div class="fg"><label class="label">End Date</label><input type="text" class="inp" id="exp-end-${id}" placeholder="Aug 2024 / Present"></div>
      <div class="fg fw"><label class="label">What did you do? (AI will enhance this) *</label><textarea class="ta" id="exp-desc-${id}" placeholder="Built a REST API for user authentication using Node.js. Reduced API response time by optimizing queries. Fixed 15 critical bugs before launch..."></textarea></div>
    </div>`;
  document.getElementById('exp-list').appendChild(div);
}

// ======= PROJECTS =======
function addProj() {
  const id = ++S.projCount;
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.id = 'proj-' + id;
  div.innerHTML = `
    <div class="ec-hdr"><span class="ec-title">🚀 Project ${id}</span><button class="rm-btn" onclick="removeEntry('proj-${id}')">✕</button></div>
    <div class="fgrid">
      <div class="fg"><label class="label">Project Name *</label><input type="text" class="inp" id="proj-name-${id}" placeholder="ResumeAI"></div>
      <div class="fg"><label class="label">Tech Stack</label><input type="text" class="inp" id="proj-tech-${id}" placeholder="React, Node.js, MongoDB"></div>
      <div class="fg"><label class="label">GitHub Link</label><input type="text" class="inp" id="proj-gh-${id}" placeholder="github.com/you/project"></div>
      <div class="fg"><label class="label">Live Link</label><input type="text" class="inp" id="proj-live-${id}" placeholder="project.com"></div>
      <div class="fg fw"><label class="label">What does it do? (AI will enhance this) *</label><textarea class="ta" id="proj-desc-${id}" placeholder="An AI-powered tool that helps users build resumes. Used Gemini API for content generation. Built with React frontend and Node.js backend..."></textarea></div>
    </div>`;
  document.getElementById('proj-list').appendChild(div);
}

function removeEntry(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ======= SKILLS =======
function addSkill(e, type) {
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const inp = document.getElementById(type === 'tech' ? 'tech-inp' : 'soft-inp');
  const val = inp.value.trim().replace(/,$/, '');
  if (!val) return;
  const arr = type === 'tech' ? S.techSkills : S.softSkills;
  if (arr.includes(val)) { inp.value = ''; return; }
  arr.push(val);
  const box = document.getElementById(type + '-skills-box');
  const tag = document.createElement('div');
  tag.className = 'stag';
  tag.id = 'stag-' + type + '-' + val.replace(/\\s+/g, '-');
  tag.innerHTML = `${esc(val)}<span onclick="removeSkill('${type}','${val.replace(/'/g, "\\\\'")}')">✕</span>`;
  box.insertBefore(tag, inp);
  inp.value = '';
}

function removeSkill(type, val) {
  const arr = type === 'tech' ? S.techSkills : S.softSkills;
  const idx = arr.indexOf(val);
  if (idx > -1) arr.splice(idx, 1);
  const tag = document.getElementById('stag-' + type + '-' + val.replace(/\s+/g, '-'));
  if (tag) tag.remove();
}

// ======= COLLECT DATA =======
function collectData() {
  const g = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  const edu = [];
  for (let i = 1; i <= S.eduCount; i++) {
    if (!document.getElementById('edu-' + i)) continue;
    const uni = g('edu-uni-' + i);
    if (!uni) continue;
    edu.push({ university: uni, degree: g('edu-deg-' + i), major: g('edu-major-' + i), year: g('edu-year-' + i), gpa: g('edu-gpa-' + i), courses: g('edu-courses-' + i) });
  }

  const exp = [];
  for (let i = 1; i <= S.expCount; i++) {
    if (!document.getElementById('exp-' + i)) continue;
    const co = g('exp-co-' + i);
    if (!co) continue;
    exp.push({ company: co, role: g('exp-role-' + i), start: g('exp-start-' + i), end: g('exp-end-' + i), desc: g('exp-desc-' + i) });
  }

  const proj = [];
  for (let i = 1; i <= S.projCount; i++) {
    if (!document.getElementById('proj-' + i)) continue;
    const name = g('proj-name-' + i);
    if (!name) continue;
    proj.push({ name, tech: g('proj-tech-' + i), github: g('proj-gh-' + i), live: g('proj-live-' + i), desc: g('proj-desc-' + i) });
  }

  return {
    name: g('p-name'), role: g('p-role'), email: g('p-email'), phone: g('p-phone'),
    location: g('p-loc'), linkedin: g('p-linkedin'), github: g('p-github'), portfolio: g('p-portfolio'), jd: g('p-jd'),
    education: edu, experience: exp, projects: proj,
    techSkills: S.techSkills, softSkills: S.softSkills
  };
}

// ======= AI GENERATION =======
async function generateResume() {
  const data = collectData();
  if (!data.name) { toast('Please fill in your name first', 'error'); goStep(1); return; }

  document.getElementById('gen-idle').style.display = 'none';
  document.getElementById('gen-loading').style.display = 'block';
  document.getElementById('gen-done').style.display = 'none';

  const logs = ['gl-1','gl-2','gl-3','gl-4','gl-5'];
  const logTexts = ['✅ Analyzing your experience...','✅ Writing professional summary...','✅ Enhancing bullet points...','✅ Optimizing for ATS...','✅ Finalizing resume...'];

  const animLogs = (idx) => {
    if (idx >= logs.length) return;
    const el = document.getElementById(logs[idx]);
    el.classList.add('active');
    setTimeout(() => { el.textContent = logTexts[idx]; el.classList.remove('active'); el.classList.add('done'); animLogs(idx + 1); }, 1000);
  };
  animLogs(0);

  const prompt = `You are a professional resume writer. Based on the user's info, generate enhanced resume content.

Target Job Description (JD) to tailor towards:
${data.jd ? data.jd : "No specific JD provided."}

User Info:
Name: ${data.name}
Target Role: ${data.role}
Experience: ${JSON.stringify(data.experience)}
Projects: ${JSON.stringify(data.projects)}
Skills: ${data.techSkills.join(', ')}
Education: ${JSON.stringify(data.education)}

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "2-3 sentence professional summary highlighting key strengths and target role",
  "experience": [
    {
      "company": "company name",
      "role": "role",
      "start": "start date",
      "end": "end date",
      "bullets": ["Enhanced bullet point 1", "Enhanced bullet point 2", "Enhanced bullet point 3"]
    }
  ],
  "projects": [
    {
      "name": "project name",
      "tech": "tech stack",
      "github": "github link",
      "live": "live link",
      "bullets": ["Compelling point 1", "Compelling point 2"]
    }
  ]
}

Rules for bullet points:
- Start with strong action verbs (Built, Developed, Optimized, Implemented, Reduced, Increased)
- Add quantifiable results where possible (e.g., "reduced load time by 40%")
- Keep each bullet under 15 words
- Maximum 3 bullets per entry
- CRITICALLY IMPORTANT: If a Target Job Description is provided above, you MUST organically weave matching keywords from the JD into the bullets and summary to ensure it passes ATS filters for that specific role.
- Make them ATS-optimized`;

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    let text = json.choices?.[0]?.message?.content || '';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    const aiData = JSON.parse(text);
    S.generated = { ...data, ...aiData };

    setTimeout(() => {
      document.getElementById('gen-loading').style.display = 'none';
      document.getElementById('gen-done').style.display = 'block';
      document.getElementById('dl-btn').style.display = '';
      renderFinalPreview(S.generated);
      toast('Resume generated! 🎉', 'success');
    }, 5500);

  } catch(err) {
    document.getElementById('gen-loading').style.display = 'none';
    document.getElementById('gen-idle').style.display = 'block';
    toast('Error: ' + err.message, 'error');
  }
}

function resetGen() {
  S.generated = null;
  document.getElementById('gen-idle').style.display = 'block';
  document.getElementById('gen-loading').style.display = 'none';
  document.getElementById('gen-done').style.display = 'none';
  document.querySelectorAll('.gl-item').forEach((el, i) => {
    el.classList.remove('done','active');
    const defaults = ['⏳ Analyzing your experience...','⏳ Writing professional summary...','⏳ Enhancing bullet points...','⏳ Optimizing for ATS...','⏳ Finalizing resume...'];
    el.textContent = defaults[i];
  });
  document.getElementById('dl-btn').style.display = 'none';
}

// ======= PREVIEW =======
function updatePreview() {
  const data = collectData();
  if (!data.name && !data.email) return;
  document.getElementById('prev-empty').style.display = 'none';
  document.getElementById('resume-preview').style.display = 'block';
  if (!S.generated) renderBasicPreview(data);
}

function renderBasicPreview(d) {
  document.getElementById('resume-preview').innerHTML = buildResumeHTML(d, false);
}

function renderFinalPreview(d) {
  document.getElementById('prev-empty').style.display = 'none';
  document.getElementById('resume-preview').style.display = 'block';
  document.getElementById('resume-preview').innerHTML = buildResumeHTML(d, true);
}

const esc = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

function buildResumeHTML(d, isAI) {
  let html = `<div class="rdoc" id="resume-doc">`;

  // Header
  html += `<div class="rname">${esc(d.name) || 'Your Name'}</div>`;
  const contact = [];
  if (d.email) contact.push(`<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`);
  if (d.phone) contact.push(esc(d.phone));
  if (d.location) contact.push(esc(d.location));
  if (d.linkedin) contact.push(`<a href="https://${esc(d.linkedin).replace(/^https?:\/\//,'')}" target="_blank">LinkedIn</a>`);
  if (d.github) contact.push(`<a href="https://${esc(d.github).replace(/^https?:\/\//,'')}" target="_blank">GitHub</a>`);
  if (d.portfolio) contact.push(`<a href="https://${esc(d.portfolio).replace(/^https?:\/\//,'')}" target="_blank">Portfolio</a>`);
  if (contact.length) html += `<div class="rcontact">${contact.join(' | ')}</div>`;
  html += `<hr>`;

  // Summary
  if (d.summary) {
    html += `<div class="rtitle">Professional Summary</div><div class="rsummary">${esc(d.summary)}</div>`;
  } else if (d.role) {
    html += `<div class="rtitle">Professional Summary</div><div class="rsummary">Motivated ${esc(d.role)} with hands-on experience in building scalable solutions. Looking to contribute technical skills to a forward-thinking organization.</div>`;
  }

  // Experience
  const exps = isAI ? (d.experience || []) : (d.experience || []);
  if (exps.length) {
    html += `<div class="rtitle">Work Experience</div>`;
    exps.forEach(e => {
      html += `<div class="rentry"><div class="rehdr"><span class="rco">${esc(e.company)}</span><span class="rdate">${esc(e.start) || ''}${e.end ? ' – ' + esc(e.end) : ''}</span></div><div class="rrole">${esc(e.role)}</div>`;
      if (isAI && e.bullets?.length) {
        html += `<ul>${e.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
      } else if (e.desc) {
        html += `<ul>${e.desc.split(/\\n|\\./).filter(s=>s.trim().length>10).slice(0,3).map(b=>`<li>${esc(b.trim())}</li>`).join('')}</ul>`;
      }
      html += `</div>`;
    });
  }

  // Education
  const edus = d.education || [];
  if (edus.length) {
    html += `<div class="rtitle">Education</div>`;
    edus.forEach(e => {
      html += `<div class="rentry"><div class="rehdr"><span class="rco">${esc(e.university)}</span><span class="rdate">${esc(e.year) || ''}</span></div><div class="rrole">${esc(e.degree) || ''}${e.major ? ' in ' + esc(e.major) : ''}${e.gpa ? ' | GPA: ' + esc(e.gpa) : ''}</div>`;
      if (e.courses) html += `<div style="font-size:.74rem;color:#555">Coursework: ${esc(e.courses)}</div>`;
      html += `</div>`;
    });
  }

  // Projects
  const projs = isAI ? (d.projects || []) : (d.projects || []);
  if (projs.length) {
    html += `<div class="rtitle">Projects</div>`;
    projs.forEach(p => {
      html += `<div class="rentry"><div class="rehdr"><span class="rco">${esc(p.name)}</span>${p.tech ? `<span class="rdate">${esc(p.tech)}</span>` : ''}</div>`;
      const links = [];
      if (p.github) links.push(`<a href="https://${esc(p.github).replace(/^https?:\/\//,'')}" style="color:#4338ca;font-size:.73rem">GitHub</a>`);
      if (p.live) links.push(`<a href="https://${esc(p.live).replace(/^https?:\/\//,'')}" style="color:#4338ca;font-size:.73rem">Live Demo</a>`);
      if (links.length) html += `<div style="margin-bottom:.25rem">${links.join(' • ')}</div>`;
      if (isAI && p.bullets?.length) {
        html += `<ul>${p.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`;
      } else if (p.desc) {
        html += `<ul>${p.desc.split(/\\n|\\./).filter(s=>s.trim().length>10).slice(0,2).map(b=>`<li>${esc(b.trim())}</li>`).join('')}</ul>`;
      }
      html += `</div>`;
    });
  }

  // Skills
  if (d.techSkills?.length || d.softSkills?.length) {
    html += `<div class="rtitle">Skills</div><div class="rskills">`;
    if (d.techSkills?.length) html += `<div class="rskrow"><span class="rsklbl">Technical:</span><span class="rskval">${esc(d.techSkills.join(', '))}</span></div>`;
    if (d.softSkills?.length) html += `<div class="rskrow"><span class="rsklbl">Soft Skills:</span><span class="rskval">${esc(d.softSkills.join(', '))}</span></div>`;
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ======= PDF DOWNLOAD =======
function downloadPDF() {
  const el = document.getElementById('resume-doc');
  if (!el) { toast('Generate your resume first!', 'error'); return; }
  const data = S.generated || collectData();
  const filename = (data.name || 'Resume').replace(/\s+/g, '_') + '_Resume.pdf';
  toast('Preparing PDF...', 'success');
  html2pdf().set({
    margin: [10, 10, 10, 10],
    filename,
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(el).save();
}

// ======= SAVE TO CLOUD =======
async function saveToCloud() {
  if (!S.generated) { toast('Please generate your resume first!', 'error'); return; }

  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';

  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    btn.disabled = false;
    btn.textContent = '☁ Save to Cloud';
    toast('Please sign in to save resumes!', 'error');
    setTimeout(() => window.location.href = 'auth.html', 1200);
    return;
  }

  try {
    const { data, error } = await supabase
      .from('resumes')
      .insert([{
        user_id:     session.user.id,
        name:        S.generated.name || 'Unnamed',
        email:       S.generated.email || '',
        role:        S.generated.role || '',
        resume_json: S.generated,
        created_at:  new Date().toISOString()
      }]);

    if (error) throw error;

    btn.textContent = '✅ Saved!';
    btn.style.background = '#22c55e';
    btn.style.color = '#000';
    toast('Resume saved! View it in your <a href="dashboard.html">Dashboard</a> ☁️', 'success');
  } catch(err) {
    btn.disabled = false;
    btn.textContent = '☁ Save to Cloud';
    toast('Save failed: ' + err.message, 'error');
    console.error('Supabase error:', err);
  }
}

// ======= TOAST =======
function toast(msg, type = 'success') {
  const wrap = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = `${type === 'success' ? '✅' : '❌'} ${msg}`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ======= COVER LETTER =======
async function generateCoverLetter() {
  const data = S.generated || collectData();
  if (!data.name) { toast('Please generate your resume first.', 'error'); return; }

  const btn = document.getElementById('cl-btn');
  btn.textContent = '⏳ Generating...';
  btn.disabled = true;

  const prompt = `Write a compelling, professional cover letter for the following user, applying for their Target Role.

User Information:
Name: ${data.name}
Role: ${data.role || 'Professional'}
Key Experience: ${JSON.stringify(data.experience)}
Key Skills: ${data.techSkills.join(', ')}

Target Job Description:
${data.jd ? data.jd : "No specific JD provided."}

Instructions:
- Write a 3 to 4 paragraph cover letter.
- Tone should be confident, professional, and engaging.
- If a Target Job Description is provided, explicitly connect their experience to the requirements in the JD.
- Return ONLY the raw text of the cover letter. No explanations.
- Do not include [Date] or [Employer Name] at the top, write it so it can be pasted directly into an email body or form with minimal edits. Start with "Dear Hiring Manager,"`;

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, forceText: true })
    });

    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    let text = json.choices?.[0]?.message?.content || '';
    
    document.getElementById('cl-ta').value = text.trim();
    document.getElementById('cl-modal').style.display = 'flex';
    toast('Cover Letter Generated! ✨', 'success');
  } catch (err) {
    toast('Error generating Cover Letter', 'error');
  } finally {
    btn.textContent = '✍️ Get Cover Letter';
    btn.disabled = false;
  }
}
