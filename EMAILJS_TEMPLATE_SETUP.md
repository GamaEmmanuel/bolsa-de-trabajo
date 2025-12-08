# EmailJS Template Setup Guide

## Template ID: `template_kv50v38`

This is your **ONE dynamic template** that will handle all email notifications.

---

## 📋 Required Template Variables

Copy this structure into your EmailJS template editor:

### **Basic HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
        }
        .details {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .detail-item {
            margin: 10px 0;
        }
        .detail-label {
            font-weight: bold;
            color: #667eea;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 10px 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{title}}</h1>
    </div>

    <div class="content">
        <p>{{greeting}}</p>

        <p><strong>{{main_message}}</strong></p>

        {{#if secondary_message}}
        <p>{{secondary_message}}</p>
        {{/if}}

        {{#if detail_1_label}}
        <div class="details">
            {{#if detail_1_label}}
            <div class="detail-item">
                <span class="detail-label">{{detail_1_label}}:</span>
                <span>{{detail_1_value}}</span>
            </div>
            {{/if}}

            {{#if detail_2_label}}
            <div class="detail-item">
                <span class="detail-label">{{detail_2_label}}:</span>
                <span>{{detail_2_value}}</span>
            </div>
            {{/if}}

            {{#if detail_3_label}}
            <div class="detail-item">
                <span class="detail-label">{{detail_3_label}}:</span>
                <span>{{detail_3_value}}</span>
            </div>
            {{/if}}

            {{#if detail_4_label}}
            <div class="detail-item">
                <span class="detail-label">{{detail_4_label}}:</span>
                <span>{{detail_4_value}}</span>
            </div>
            {{/if}}
        </div>
        {{/if}}

        {{#if action_url}}
        <div style="text-align: center;">
            <a href="{{action_url}}" class="button">{{action_label}}</a>
        </div>
        {{/if}}
    </div>

    <div class="footer">
        <p>{{footer_message}}</p>
        <p><strong>{{company_name}}</strong></p>
        <p style="margin-top: 15px; font-size: 11px; color: #999;">
            Este es un correo automático, por favor no responder.
        </p>
    </div>
</body>
</html>
```

---

## 🔑 Variable Definitions

### **Required Variables** (Always present):
- `to_email` - Recipient email address
- `to_name` - Recipient name
- `subject` - Email subject line
- `title` - Main header title
- `greeting` - Greeting message (e.g., "Hola Emmanuel,")
- `main_message` - Primary message content
- `footer_message` - Footer text
- `company_name` - Your company name (HR Portal)
- `notification_type` - Type of notification (for tracking)

### **Optional Variables** (Conditional):
- `secondary_message` - Additional message text
- `action_label` - Button text (e.g., "Ver Detalles")
- `action_url` - Button link
- `detail_1_label` - First detail label (e.g., "🏢 Empresa")
- `detail_1_value` - First detail value
- `detail_2_label` - Second detail label
- `detail_2_value` - Second detail value
- `detail_3_label` - Third detail label
- `detail_3_value` - Third detail value
- `detail_4_label` - Fourth detail label
- `detail_4_value` - Fourth detail value

---

## 🎯 How to Set Up in EmailJS

1. **Go to EmailJS Dashboard:**
   - Visit: https://dashboard.emailjs.com/

2. **Navigate to Email Templates:**
   - Click on "Email Templates" in sidebar
   - Find template `template_kv50v38`

3. **Edit Template:**
   - Click "Edit" on your template
   - Copy the HTML template above
   - Paste into the template editor

4. **Configure Template Settings:**
   - **Name:** HR Portal - Dynamic Notifications
   - **Subject:** `{{subject}}`
   - **From Name:** HR Portal
   - **Reply To:** noreply@hrportal.com (or your email)

5. **Test Template:**
   - Click "Test It" button
   - Fill in sample values:
     ```json
     {
       "to_email": "your-email@example.com",
       "to_name": "Test User",
       "subject": "Test Email",
       "title": "Test Notification",
       "greeting": "Hola Test User,",
       "main_message": "This is a test email",
       "footer_message": "Thank you!",
       "company_name": "HR Portal"
     }
     ```
   - Send test email

6. **Save Template:**
   - Click "Save"
   - Your template is now ready!

---

## 📧 Example Notification Outputs

### **1. Application Submitted:**
- **Subject:** "✅ Aplicación enviada - Software Engineer"
- **Title:** "¡Aplicación Enviada Exitosamente!"
- **Details:** Company, Job, Application Date
- **Button:** "Ver Mis Aplicaciones"

### **2. Status Changed:**
- **Subject:** "📊 Actualización de tu Aplicación - Software Engineer"
- **Title:** "Tu Aplicación ha sido Actualizada"
- **Details:** Company, Job, Old Status, New Status
- **Button:** "Ver Detalles"

### **3. Payment Failed:**
- **Subject:** "⚠️ Error en el Procesamiento de Pago"
- **Title:** "Problema con tu Pago"
- **Details:** Status, Required Action
- **Button:** "Actualizar Pago"

---

## ✅ Verification Checklist

- [ ] Template created in EmailJS dashboard
- [ ] Template ID is `template_kv50v38`
- [ ] HTML template pasted and saved
- [ ] Subject line set to `{{subject}}`
- [ ] All variables properly configured
- [ ] Test email sent successfully
- [ ] Email displays correctly in inbox
- [ ] Links work properly
- [ ] Styling looks good on mobile and desktop

---

## 🎨 Customization Tips

1. **Change Colors:**
   - Update `#667eea` and `#764ba2` in gradient
   - Modify button background color

2. **Add Logo:**
   ```html
   <div class="header">
       <img src="YOUR_LOGO_URL" alt="HR Portal" style="max-width: 150px; margin-bottom: 10px;">
       <h1>{{title}}</h1>
   </div>
   ```

3. **Change Font:**
   - Replace `Arial, sans-serif` with your preferred font
   - Consider using Google Fonts

4. **Add Social Links:**
   ```html
   <div class="footer">
       <p>{{footer_message}}</p>
       <div style="margin: 15px 0;">
           <a href="https://facebook.com/yourpage">Facebook</a> |
           <a href="https://twitter.com/yourpage">Twitter</a> |
           <a href="https://linkedin.com/company/yourpage">LinkedIn</a>
       </div>
   </div>
   ```

---

## 🔍 Testing Variables

Use these for testing each notification type:

### **Application Submitted:**
```json
{
  "subject": "✅ Aplicación enviada - Software Engineer",
  "title": "¡Aplicación Enviada Exitosamente!",
  "greeting": "Hola Juan Pérez,",
  "main_message": "Tu aplicación para el puesto de \"Software Engineer\" en TechCorp ha sido enviada exitosamente.",
  "detail_1_label": "🏢 Empresa",
  "detail_1_value": "TechCorp",
  "detail_2_label": "💼 Puesto",
  "detail_2_value": "Software Engineer",
  "detail_3_label": "📅 Fecha de Aplicación",
  "detail_3_value": "5 de diciembre de 2025",
  "action_label": "Ver Mis Aplicaciones",
  "action_url": "http://localhost:3000/candidate/my-applications",
  "footer_message": "¡Te deseamos mucha suerte!",
  "company_name": "HR Portal"
}
```

### **Payment Failed:**
```json
{
  "subject": "⚠️ Error en el Procesamiento de Pago",
  "title": "Problema con tu Pago",
  "greeting": "Hola Empresa ABC,",
  "main_message": "No pudimos procesar tu pago más reciente.",
  "secondary_message": "Por favor actualiza tu método de pago.",
  "detail_1_label": "⚠️ Estado",
  "detail_1_value": "Pago Rechazado",
  "action_label": "Actualizar Pago",
  "action_url": "http://localhost:3000/company/subscription/checkout",
  "footer_message": "Si necesitas ayuda, contáctanos.",
  "company_name": "HR Portal"
}
```

---

## 🚨 Common Issues

**Issue:** Variables not showing
- **Solution:** Make sure to use correct Handlebars syntax: `{{variable_name}}`

**Issue:** Conditional blocks not working
- **Solution:** Use `{{#if variable}}...{{/if}}` syntax

**Issue:** Styling not applied
- **Solution:** Use inline styles or `<style>` tag in `<head>`

**Issue:** Links not clickable
- **Solution:** Use full URLs including `http://` or `https://`

---

## 📞 Need Help?

- **EmailJS Docs:** https://www.emailjs.com/docs/
- **Handlebars Docs:** https://handlebarsjs.com/guide/
- **Test Template:** Use EmailJS dashboard's test feature

---

**Template Status:** 🎨 Ready to Configure
**Last Updated:** December 2025

