# 🔧 Fix Corrupted Variables - Action Required

## ⚠️ Issue: Variables Still Corrupted

If you're still seeing corrupted variables, the issue is likely **in your EmailJS template configuration**, not in the code.

---

## 🎯 Quick Fix Steps

### **Step 1: Check What's Being Sent**

1. **Open your browser** and go to your HR Portal
2. **Open Developer Console** (F12 or Cmd+Option+I)
3. **Go to Console tab**
4. **Apply to a job**
5. **Look for this log:**

```
📨 Full email data being sent to EmailJS: {...}
```

**Copy this entire object** - we need to see exactly what's being sent.

---

### **Step 2: Fix Your EmailJS Template**

The problem is likely that your EmailJS template has **extra variables** that we're not sending, or **wrong variable names**.

#### **Option A: Replace Your Template (RECOMMENDED)**

1. **Go to EmailJS Dashboard:**
   - https://dashboard.emailjs.com/admin/templates

2. **Find template:** `template_kv50v38`

3. **Click "Edit"**

4. **REPLACE the entire template content** with the file:
   - `SIMPLE_EMAIL_TEMPLATE.html` (I just created this)

5. **Set the Subject to:**
   ```
   {{subject}}
   ```

6. **Set "From Name" to:** `HR Portal`

7. **Save the template**

8. **Test again**

#### **Option B: Check Your Current Template**

If you want to keep your existing template, check for these common issues:

**1. Extra Variables:**
Your template might have variables like these that we're NOT sending:
```html
{{candidate_name}}    ❌ We send: to_name
{{job_title}}         ❌ We send this in detail_2_value
{{company}}           ❌ We send: company_name
{{email}}             ❌ We send: to_email
{{message}}           ❌ We send: main_message
```

**2. Missing Conditionals:**
Variables MUST be wrapped in conditionals:
```html
<!-- WRONG ❌ -->
<p>{{secondary_message}}</p>

<!-- CORRECT ✅ -->
{{#if secondary_message}}
<p>{{secondary_message}}</p>
{{/if}}
```

**3. Typos in Variable Names:**
Variables must match EXACTLY:
```html
<!-- WRONG ❌ -->
{{titel}}
{{greting}}
{{detail1_label}}

<!-- CORRECT ✅ -->
{{title}}
{{greeting}}
{{detail_1_label}}
```

---

### **Step 3: Verify Template Variables**

Your template should ONLY use these variables:

#### **Always Present (No conditional needed):**
- `{{to_email}}`
- `{{to_name}}`
- `{{subject}}`
- `{{title}}`
- `{{greeting}}`
- `{{main_message}}`
- `{{footer_message}}`
- `{{company_name}}`

#### **Optional (MUST be in conditionals):**
```html
{{#if secondary_message}}
  {{secondary_message}}
{{/if}}

{{#if action_url}}
  <a href="{{action_url}}">{{action_label}}</a>
{{/if}}

{{#if detail_1_label}}
  {{detail_1_label}}: {{detail_1_value}}
{{/if}}

{{#if detail_2_label}}
  {{detail_2_label}}: {{detail_2_value}}
{{/if}}

{{#if detail_3_label}}
  {{detail_3_label}}: {{detail_3_value}}
{{/if}}

{{#if detail_4_label}}
  {{detail_4_label}}: {{detail_4_value}}
{{/if}}
```

---

## 🔍 Debugging Steps

### **1. Check Console Output**

After applying to a job, you should see:

```javascript
📨 Full email data being sent to EmailJS: {
  to_email: "candidate@example.com",
  to_name: "Emmanuel García",
  subject: "✅ Aplicación enviada - Chef de Cocina",
  notification_type: "application_submitted",
  title: "¡Aplicación Enviada Exitosamente!",
  greeting: "Hola Emmanuel García,",
  main_message: "Tu aplicación para el puesto de...",
  secondary_message: "El equipo de reclutamiento revisará...",
  detail_1_label: "🏢 Empresa",
  detail_1_value: "Restaurant XYZ",
  detail_2_label: "💼 Puesto",
  detail_2_value: "Chef de Cocina",
  detail_3_label: "📅 Fecha de Aplicación",
  detail_3_value: "18 de diciembre de 2025",
  action_label: "Ver Mis Aplicaciones",
  action_url: "https://meserea.com/candidate/my-applications",
  footer_message: "¡Te deseamos mucha suerte...",
  company_name: "HR Portal"
}
```

**Notice:** Only fields with values are included!

### **2. Check EmailJS Dashboard**

1. Go to: https://dashboard.emailjs.com/history
2. Find your recent email
3. Click "View"
4. Check the "Parameters" section
5. Verify all variables match what we're sending

### **3. Test with Simple Template**

Try the template I created in `SIMPLE_EMAIL_TEMPLATE.html`:

1. Copy ALL content from that file
2. Go to EmailJS dashboard
3. Edit your template
4. Paste the new content
5. Save
6. Test again

---

## 🎯 What Changed in the Code

I've updated the email client to:

1. ✅ **Only send fields that have values**
   - Before: Sent all fields (some were empty strings)
   - Now: Only sends fields with actual content

2. ✅ **Better logging**
   - Shows exactly what's being sent to EmailJS
   - Helps debug template issues

3. ✅ **Conditional field inclusion**
   - Optional fields are only included if they have a value
   - Reduces chances of template errors

---

## 📋 Expected Email Output

### **Candidate Application Email:**

```
Subject: ✅ Aplicación enviada - Chef de Cocina

-----------------------------------
¡Aplicación Enviada Exitosamente!
-----------------------------------

Hola Emmanuel García,

Tu aplicación para el puesto de "Chef de Cocina" en
Restaurant XYZ ha sido enviada exitosamente.

El equipo de reclutamiento revisará tu perfil y te
contactará si tu experiencia es adecuada para la posición.

┌──────────────────────────────────┐
│ 🏢 Empresa: Restaurant XYZ       │
│ 💼 Puesto: Chef de Cocina        │
│ 📅 Fecha: 18 de diciembre, 2025  │
└──────────────────────────────────┘

[Ver Mis Aplicaciones]

¡Te deseamos mucha suerte en tu proceso de selección!

HR Portal
─────────────────────────────────
Este es un correo automático, por favor no responder.
```

**No "undefined", no corrupted text!** ✅

### **Company New Application Email:**

```
Subject: 📥 Nueva Aplicación Recibida - Chef de Cocina

-----------------------------------
¡Nueva Aplicación Recibida!
-----------------------------------

Hola Restaurant XYZ,

Has recibido una nueva aplicación para el puesto de
"Chef de Cocina".

Revisa el perfil del candidato en tu panel de ATS y
gestiona el proceso de selección.

┌──────────────────────────────────┐
│ 👤 Candidato: Emmanuel García    │
│ 💼 Puesto: Chef de Cocina        │
│ 📅 Fecha: 18 de diciembre, 2025  │
└──────────────────────────────────┘

[Ver en ATS]

Gestiona todas tus aplicaciones en un solo lugar.

HR Portal
─────────────────────────────────
Este es un correo automático, por favor no responder.
```

---

## ⚡ Quick Actions

**Right Now:**

1. [ ] Open browser console (F12)
2. [ ] Apply to a job
3. [ ] Copy the "📨 Full email data" log
4. [ ] Go to EmailJS dashboard
5. [ ] Replace template with `SIMPLE_EMAIL_TEMPLATE.html`
6. [ ] Test again

**If Still Not Working:**

- Share the console log output (the "📨 Full email data" part)
- Check EmailJS dashboard for error messages
- Verify template ID is: `template_kv50v38`
- Verify service ID is: `job-portal`

---

## 🆘 Common Mistakes

### **Mistake 1: Template has extra variables**
```html
<!-- Template has: -->
{{candidate_name}}
{{job_title}}

<!-- But we send: -->
to_name: "Emmanuel"
detail_2_value: "Chef"

<!-- Solution: Update template to use correct variable names -->
```

### **Mistake 2: Missing conditionals**
```html
<!-- Wrong: -->
<p>{{secondary_message}}</p>

<!-- If secondary_message is not sent, EmailJS shows "undefined" -->

<!-- Correct: -->
{{#if secondary_message}}
<p>{{secondary_message}}</p>
{{/if}}
```

### **Mistake 3: Old template cached**
- Clear browser cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Try in incognito/private window

---

## ✅ Success Checklist

- [ ] Replaced EmailJS template with `SIMPLE_EMAIL_TEMPLATE.html`
- [ ] Set subject to `{{subject}}`
- [ ] Tested candidate email - no corrupted text
- [ ] Tested company email - no corrupted text
- [ ] All fields display correctly
- [ ] Buttons work and link correctly

---

**Files to Use:**
1. `SIMPLE_EMAIL_TEMPLATE.html` - Clean, working template
2. This file - Troubleshooting guide

**Next Step:** Replace your EmailJS template and test again! 🚀

